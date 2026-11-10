import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import type {
  ActOnHrmsWorkflowInstanceDto,
  CreateHrmsWorkflowInstanceDto,
  ListHrmsWorkflowInstancesDto,
} from "../dto/hrms-workflow-definition.dto";
import type { WorkflowStage, WorkflowTransition } from "../workflow-contract";

@Injectable()
export class HrmsWorkflowInstanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string, filters: ListHrmsWorkflowInstancesDto) {
    return this.prisma.hrmsWorkflowInstance.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.definitionId ? { definitionId: filters.definitionId } : {}),
      },
      include: { definition: { select: { id: true, name: true } }, assignments: { where: { status: "PENDING" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async get(organizationId: string, instanceId: string) {
    return this.requireInstance(organizationId, instanceId);
  }

  async create(organizationId: string, actorUserId: string, dto: CreateHrmsWorkflowInstanceDto) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const definition = await tx.hrmsWorkflowDefinition.findFirst({
          where: { id: dto.definitionId, organizationId, status: "ACTIVE" },
        });
        if (!definition) {
          throw this.notFound("Active workflow definition not found");
        }
        const version = await tx.hrmsWorkflowDefinitionVersion.findUnique({
          where: { definitionId_version: { definitionId: definition.id, version: definition.version } },
        });
        if (!version) {
          throw new AppError(
            ErrorCode.VALIDATION_FAILED,
            "Published definition snapshot is unavailable",
            HttpStatus.CONFLICT,
          );
        }
        const stages = version.stages as unknown as WorkflowStage[];
        const start = this.startStage(stages, version.transitions as unknown as WorkflowTransition[]);
        const snapshot = {
          definitionId: definition.id,
          version: version.version,
          name: version.name,
          stages,
          transitions: version.transitions,
        };
        const instance = await tx.hrmsWorkflowInstance.create({
          data: {
            organizationId,
            definitionId: definition.id,
            definitionVersionId: version.id,
            definitionVersion: version.version,
            currentStageId: start.id,
            context: (dto.context ?? {}) as Prisma.InputJsonValue,
            definitionSnapshot: snapshot,
            initiatedByUserId: actorUserId,
          },
        });
        await tx.hrmsWorkflowEvent.create({
          data: {
            organizationId,
            instanceId: instance.id,
            type: "INITIATED",
            actorUserId,
            stageId: start.id,
            nextState: { status: "ACTIVE", stageId: start.id },
            evidence: (dto.context ?? {}) as Prisma.InputJsonValue,
          },
        });
        await this.createAssignments(tx, instance, start, actorUserId);
        return instance;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.audit.record({
      action: "hrms.workflow_instance.initiated",
      organizationId,
      actorUserId,
      resourceType: "HrmsWorkflowInstance",
      resourceId: result.id,
    });
    return result;
  }

  async act(organizationId: string, instanceId: string, actorUserId: string, dto: ActOnHrmsWorkflowInstanceDto) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const instance = await tx.hrmsWorkflowInstance.findFirst({
          where: { id: instanceId, organizationId },
          include: { assignments: true },
        });
        if (!instance) {
          throw this.notFound("Workflow instance not found");
        }
        if (instance.status !== "ACTIVE") {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Workflow instance is no longer active", HttpStatus.CONFLICT);
        }
        const snapshot = instance.definitionSnapshot as unknown as {
          stages: WorkflowStage[];
          transitions: WorkflowTransition[];
        };
        const stage = snapshot.stages.find((candidate) => candidate.id === instance.currentStageId);
        if (!stage) {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Workflow instance snapshot is invalid", HttpStatus.CONFLICT);
        }
        const assignment = instance.assignments.find(
          (candidate) =>
            candidate.stageId === stage.id &&
            candidate.assigneeUserId === actorUserId &&
            candidate.status === "PENDING",
        );
        if (!assignment) {
          throw new AppError(
            ErrorCode.FORBIDDEN,
            "You do not have a pending assignment for this stage",
            HttpStatus.FORBIDDEN,
          );
        }
        if (stage.type === "APPROVAL" && !["APPROVE", "REJECT"].includes(dto.action)) {
          throw new AppError(
            ErrorCode.VALIDATION_FAILED,
            "Approval stages require APPROVE or REJECT",
            HttpStatus.BAD_REQUEST,
          );
        }
        if (stage.type === "TASK" && dto.action !== "COMPLETE") {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Task stages require COMPLETE", HttpStatus.BAD_REQUEST);
        }
        const assignmentStatus =
          dto.action === "APPROVE" ? "APPROVED" : dto.action === "REJECT" ? "REJECTED" : "COMPLETED";
        const changed = await tx.hrmsWorkflowAssignment.updateMany({
          where: { id: assignment.id, status: "PENDING" },
          data: { status: assignmentStatus, actedAt: new Date(), comment: this.clean(dto.comment) },
        });
        if (changed.count !== 1) {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "This assignment was already actioned", HttpStatus.CONFLICT);
        }
        await tx.hrmsWorkflowEvent.create({
          data: {
            organizationId,
            instanceId,
            type: assignmentStatus,
            actorUserId,
            stageId: stage.id,
            previousState: { status: "PENDING" },
            nextState: { status: assignmentStatus },
            comment: this.clean(dto.comment),
            evidence: dto.evidence as Prisma.InputJsonValue | undefined,
          },
        });
        if (dto.action !== "REJECT") {
          const approvals = await tx.hrmsWorkflowAssignment.count({
            where: { instanceId, stageId: stage.id, status: { in: ["APPROVED", "COMPLETED"] } },
          });
          if (approvals < (stage.requiredApprovals ?? 1)) {
            return this.requireInstanceTx(tx, organizationId, instanceId);
          }
        }
        const transition = snapshot.transitions.find(
          (candidate) =>
            candidate.from === stage.id &&
            candidate.action === dto.action &&
            this.matchesCondition(candidate, instance.context),
        );
        if (!transition) {
          if (!stage.isTerminal) {
            throw new AppError(
              ErrorCode.VALIDATION_FAILED,
              "No transition is configured for this action",
              HttpStatus.CONFLICT,
            );
          }
          return this.finish(
            tx,
            instance,
            stage.id,
            dto.action === "REJECT" ? "REJECTED" : "COMPLETED",
            actorUserId,
            dto,
          );
        }
        const next = snapshot.stages.find((candidate) => candidate.id === transition.to);
        if (!next) {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Workflow transition target is invalid", HttpStatus.CONFLICT);
        }
        const previousState = { status: "ACTIVE", stageId: stage.id };
        const terminalStatus = dto.action === "REJECT" ? "REJECTED" : "COMPLETED";
        const nextState = { status: next.isTerminal ? terminalStatus : "ACTIVE", stageId: next.id };
        const updated = await tx.hrmsWorkflowInstance.updateMany({
          where: { id: instance.id, status: "ACTIVE", currentStageId: stage.id },
          data: {
            currentStageId: next.id,
            ...(next.isTerminal ? { status: terminalStatus, completedAt: new Date() } : {}),
          },
        });
        if (updated.count !== 1) {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Workflow state changed concurrently", HttpStatus.CONFLICT);
        }
        await tx.hrmsWorkflowEvent.create({
          data: {
            organizationId,
            instanceId,
            type: "TRANSITIONED",
            actorUserId,
            stageId: next.id,
            previousState,
            nextState,
            evidence: dto.evidence as Prisma.InputJsonValue | undefined,
          },
        });
        if (next.isTerminal) {
          await tx.hrmsWorkflowEvent.create({
            data: {
              organizationId,
              instanceId,
              type: terminalStatus === "COMPLETED" ? "COMPLETED" : "REJECTED",
              actorUserId,
              stageId: next.id,
              previousState,
              nextState,
            },
          });
        } else {
          await this.createAssignments(tx, instance, next, actorUserId);
        }
        return this.requireInstanceTx(tx, organizationId, instanceId);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.audit.record({
      action: `hrms.workflow_instance.${dto.action.toLowerCase()}`,
      organizationId,
      actorUserId,
      resourceType: "HrmsWorkflowInstance",
      resourceId: instanceId,
    });
    return result;
  }

  async listAssignments(organizationId: string, instanceId: string) {
    await this.requireInstance(organizationId, instanceId);
    return this.prisma.hrmsWorkflowAssignment.findMany({
      where: { organizationId, instanceId },
      orderBy: { createdAt: "asc" },
    });
  }

  async listHistory(organizationId: string, instanceId: string) {
    await this.requireInstance(organizationId, instanceId);
    return this.prisma.hrmsWorkflowEvent.findMany({
      where: { organizationId, instanceId },
      orderBy: { createdAt: "asc" },
    });
  }

  private async createAssignments(
    tx: Prisma.TransactionClient,
    instance: { id: string; organizationId: string; initiatedByUserId: string },
    stage: WorkflowStage,
    actorUserId: string,
  ) {
    const assigneeIds =
      stage.assigneeRule?.kind === "INITIATOR" ? [instance.initiatedByUserId] : (stage.assigneeRule?.userIds ?? []);
    if (!assigneeIds.length) {
      return;
    }
    const members = await tx.organizationMember.count({
      where: {
        organizationId: instance.organizationId,
        userId: { in: assigneeIds },
        status: "ACTIVE",
        deletedAt: null,
      },
    });
    if (members !== assigneeIds.length) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Workflow stage includes an inactive or external assignee",
        HttpStatus.BAD_REQUEST,
      );
    }
    await tx.hrmsWorkflowAssignment.createMany({
      data: assigneeIds.map((assigneeUserId) => ({
        organizationId: instance.organizationId,
        instanceId: instance.id,
        stageId: stage.id,
        assigneeUserId,
      })),
    });
    await tx.hrmsWorkflowEvent.createMany({
      data: assigneeIds.map((assigneeUserId) => ({
        organizationId: instance.organizationId,
        instanceId: instance.id,
        type: "ASSIGNED",
        actorUserId,
        stageId: stage.id,
        nextState: { assigneeUserId, status: "PENDING" },
      })),
    });
  }

  private startStage(stages: WorkflowStage[], transitions: WorkflowTransition[]) {
    const targets = new Set(transitions.map((transition) => transition.to));
    const start = stages.filter((stage) => !targets.has(stage.id));
    if (start.length !== 1) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Published workflow snapshot has no unique start stage",
        HttpStatus.CONFLICT,
      );
    }
    return start[0];
  }

  private matchesCondition(transition: WorkflowTransition, context: Prisma.JsonValue): boolean {
    if (!transition.condition) {
      return true;
    }
    const value = transition.condition.field
      .split(".")
      .reduce<unknown>(
        (current, key) =>
          current && typeof current === "object" && !Array.isArray(current)
            ? (current as Record<string, unknown>)[key]
            : undefined,
        context,
      );
    if (transition.condition.operator === "EXISTS") {
      return value !== undefined && value !== null;
    }
    return transition.condition.operator === "EQUALS"
      ? value === transition.condition.value
      : value !== transition.condition.value;
  }

  private async finish(
    tx: Prisma.TransactionClient,
    instance: { id: string; organizationId: string; currentStageId: string },
    stageId: string,
    status: "COMPLETED" | "REJECTED",
    actorUserId: string,
    dto: ActOnHrmsWorkflowInstanceDto,
  ) {
    await tx.hrmsWorkflowInstance.update({ where: { id: instance.id }, data: { status, completedAt: new Date() } });
    await tx.hrmsWorkflowEvent.create({
      data: {
        organizationId: instance.organizationId,
        instanceId: instance.id,
        type: status === "COMPLETED" ? "COMPLETED" : "REJECTED",
        actorUserId,
        stageId,
        previousState: { status: "ACTIVE", stageId: instance.currentStageId },
        nextState: { status, stageId },
        comment: this.clean(dto.comment),
        evidence: dto.evidence as Prisma.InputJsonValue | undefined,
      },
    });
    return this.requireInstanceTx(tx, instance.organizationId, instance.id);
  }

  private requireInstance(organizationId: string, instanceId: string) {
    return this.prisma.hrmsWorkflowInstance
      .findFirst({
        where: { id: instanceId, organizationId },
        include: { assignments: true, definition: { select: { id: true, name: true } } },
      })
      .then((instance) => {
        if (!instance) {
          throw this.notFound("Workflow instance not found");
        }
        return instance;
      });
  }

  private requireInstanceTx(tx: Prisma.TransactionClient, organizationId: string, instanceId: string) {
    return tx.hrmsWorkflowInstance.findFirstOrThrow({
      where: { id: instanceId, organizationId },
      include: { assignments: true },
    });
  }

  private notFound(message: string) {
    return new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }

  private clean(value: string | undefined) {
    return value?.trim() || null;
  }
}
