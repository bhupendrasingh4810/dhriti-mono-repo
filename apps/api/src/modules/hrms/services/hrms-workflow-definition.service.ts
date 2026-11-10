import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { HrmsWorkflowDefinitionStatus } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { validateWorkflowGraph } from "../workflow-contract";

type WorkflowPayload = {
  name: string;
  description?: string;
  stages: Record<string, unknown>[];
  transitions: Record<string, unknown>[];
};

@Injectable()
export class HrmsWorkflowDefinitionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string, filters: { status?: HrmsWorkflowDefinitionStatus; isTemplate?: boolean }) {
    return this.prisma.hrmsWorkflowDefinition.findMany({
      where: {
        organizationId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.isTemplate !== undefined ? { isTemplate: filters.isTemplate } : {}),
      },
      orderBy: [{ isTemplate: "desc" }, { name: "asc" }],
    });
  }

  listTemplates(organizationId: string) {
    return this.prisma.hrmsWorkflowDefinition.findMany({
      where: { organizationId, isTemplate: true, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });
  }

  async get(organizationId: string, workflowId: string) {
    return this.requireWorkflow(organizationId, workflowId);
  }

  async create(organizationId: string, actorUserId: string, input: WorkflowPayload) {
    const graph = validateWorkflowGraph(input.stages, input.transitions);
    const workflow = await this.prisma.hrmsWorkflowDefinition.create({
      data: {
        organizationId,
        name: input.name.trim(),
        description: this.clean(input.description),
        stages: graph.stages,
        transitions: graph.transitions,
        createdByUserId: actorUserId,
      },
    });
    await this.record("created", workflow.id, organizationId, actorUserId);
    return workflow;
  }

  async update(
    organizationId: string,
    workflowId: string,
    actorUserId: string,
    input: Partial<WorkflowPayload> & { status?: Extract<HrmsWorkflowDefinitionStatus, "DRAFT" | "ARCHIVED"> },
  ) {
    const existing = await this.requireWorkflow(organizationId, workflowId);
    this.assertEditable(existing.isTemplate);
    const archiveOnly =
      existing.status === "ACTIVE" &&
      input.status === "ARCHIVED" &&
      input.name === undefined &&
      input.description === undefined &&
      input.stages === undefined &&
      input.transitions === undefined;
    if (existing.status !== "DRAFT" && !archiveOnly) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Only draft workflow definitions can be changed",
        HttpStatus.CONFLICT,
      );
    }
    const graph =
      input.stages !== undefined || input.transitions !== undefined
        ? validateWorkflowGraph(
            input.stages ?? (existing.stages as Record<string, unknown>[]),
            input.transitions ?? (existing.transitions as Record<string, unknown>[]),
          )
        : undefined;
    const workflow = await this.prisma.hrmsWorkflowDefinition.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: this.clean(input.description) } : {}),
        ...(graph ? { stages: graph.stages, transitions: graph.transitions } : {}),
        ...(input.status !== undefined
          ? { status: input.status, publishedAt: input.status === "DRAFT" ? null : undefined }
          : {}),
        updatedByUserId: actorUserId,
      },
    });
    await this.record("updated", workflow.id, organizationId, actorUserId);
    return workflow;
  }

  async clone(organizationId: string, sourceWorkflowId: string, actorUserId: string, name?: string) {
    const source = await this.requireWorkflow(organizationId, sourceWorkflowId);
    const workflow = await this.prisma.hrmsWorkflowDefinition.create({
      data: {
        organizationId,
        name: name?.trim() || `${source.name} copy`,
        description: source.description,
        stages: source.stages as Prisma.InputJsonValue,
        transitions: source.transitions as Prisma.InputJsonValue,
        status: "DRAFT",
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
    });
    await this.record("cloned", workflow.id, organizationId, actorUserId, { sourceWorkflowId });
    return workflow;
  }

  async publish(organizationId: string, workflowId: string, actorUserId: string) {
    const existing = await this.requireWorkflow(organizationId, workflowId);
    this.assertEditable(existing.isTemplate);
    if (existing.status !== "DRAFT") {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Only draft workflow definitions can be published",
        HttpStatus.CONFLICT,
      );
    }
    const graph = validateWorkflowGraph(
      existing.stages as Record<string, unknown>[],
      existing.transitions as Record<string, unknown>[],
    );
    const workflow = await this.prisma.$transaction(async (tx) => {
      const published = await tx.hrmsWorkflowDefinition.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          publishedAt: new Date(),
          updatedByUserId: actorUserId,
          stages: graph.stages,
          transitions: graph.transitions,
        },
      });
      await tx.hrmsWorkflowDefinitionVersion.create({
        data: {
          definitionId: published.id,
          version: published.version,
          name: published.name,
          description: published.description,
          stages: published.stages as Prisma.InputJsonValue,
          transitions: published.transitions as Prisma.InputJsonValue,
          publishedByUserId: actorUserId,
        },
      });
      return published;
    });
    await this.record("published", workflow.id, organizationId, actorUserId);
    return workflow;
  }

  private async requireWorkflow(organizationId: string, workflowId: string) {
    const workflow = await this.prisma.hrmsWorkflowDefinition.findFirst({ where: { id: workflowId, organizationId } });
    if (!workflow) {
      throw new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, "Workflow definition not found", HttpStatus.NOT_FOUND);
    }
    return workflow;
  }

  private async record(
    action: string,
    resourceId: string,
    organizationId: string,
    actorUserId: string,
    metadata?: Record<string, string>,
  ) {
    await this.audit.record({
      action: `hrms.workflow_definition.${action}`,
      organizationId,
      actorUserId,
      resourceType: "HrmsWorkflowDefinition",
      resourceId,
      metadata,
    });
  }

  private clean(value: string | undefined): string | null {
    return value?.trim() || null;
  }

  private assertEditable(isTemplate: boolean) {
    if (isTemplate) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Default workflow templates cannot be modified. Clone a template to customize it.",
        HttpStatus.CONFLICT,
      );
    }
  }
}
