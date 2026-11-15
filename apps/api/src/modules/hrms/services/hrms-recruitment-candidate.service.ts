import { HttpStatus, Injectable } from "@nestjs/common";
import { z } from "@dhriti/validation";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { HrmsRecruitmentService } from "./hrms-recruitment.service";

const defaults = [
  { systemKey: "APPLIED", name: "Applied", position: 100 },
  { systemKey: "SCREENING", name: "Screening", position: 200 },
  { systemKey: "INTERVIEW", name: "Interview", position: 300 },
  { systemKey: "OFFER", name: "Offer", position: 400 },
  { systemKey: "HIRED", name: "Hired", position: 500 },
] as const;
const candidateInput = z
  .object({
    openingId: z.string().uuid(),
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().max(40).optional(),
  })
  .strict();
const stageInput = z.object({ name: z.string().trim().min(1).max(80) }).strict();
const reorderInput = z
  .object({
    stageIds: z.array(z.string().uuid()).min(5).max(500),
    expectedStageIds: z.array(z.string().uuid()).min(5).max(500),
  })
  .strict();
const rejectionInput = z
  .object({ reason: z.string().trim().min(1).max(5000), revision: z.number().int().positive() })
  .strict();
const moveInput = z.object({ stageId: z.string().uuid(), revision: z.number().int().positive() }).strict();
const assignmentInput = z
  .object({ userId: z.string().uuid().nullable(), revision: z.number().int().positive() })
  .strict();
const outcomeInput = z
  .object({ outcome: z.enum(["JOINED", "OFFER_DECLINED"]), revision: z.number().int().positive() })
  .strict();
const commentInput = z.object({ text: z.string().trim().min(1).max(5000) }).strict();
const interviewFeedbackInput = z
  .object({
    verdict: z.enum(["PASSED", "FAILED"]),
    feedback: z.string().trim().min(1).max(5000),
    revision: z.number().int().positive(),
  })
  .strict();
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      ErrorCode.VALIDATION_FAILED,
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      HttpStatus.BAD_REQUEST,
    );
  }
  return parsed.data;
}
const fail = (text: string, status = HttpStatus.BAD_REQUEST) => new AppError(ErrorCode.VALIDATION_FAILED, text, status);

@Injectable()
export class HrmsRecruitmentCandidateService {
  constructor(
    private readonly db: PrismaService,
    private readonly recruitment: HrmsRecruitmentService,
  ) {}

  private async role(org: string, actor: string) {
    const access = await this.recruitment.access(org, actor);
    if (!access.role) {
      throw new AppError(ErrorCode.PERMISSION_DENIED, "Recruitment access is required.", HttpStatus.FORBIDDEN);
    }
    return access;
  }
  private async manager(org: string, actor: string) {
    if ((await this.role(org, actor)).role !== "MANAGER") {
      throw new AppError(ErrorCode.PERMISSION_DENIED, "Recruitment manager access is required.", HttpStatus.FORBIDDEN);
    }
  }
  private async stagesFor(org: string) {
    // Stable keys ensure the required stages are initialized idempotently per tenant.
    await Promise.all(
      defaults.map((stage) =>
        this.db.hrmsRecruitmentStage.upsert({
          where: { organizationId_systemKey: { organizationId: org, systemKey: stage.systemKey } },
          create: { organizationId: org, ...stage },
          update: {},
        }),
      ),
    );
    return this.db.hrmsRecruitmentStage.findMany({
      where: { organizationId: org },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
  }
  async stages(org: string, actor: string) {
    await this.manager(org, actor);
    return this.stagesFor(org);
  }
  async addStage(org: string, actor: string, input: unknown) {
    if (!(await this.role(org, actor)).admin) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        "Only organization administrators may add stages.",
        HttpStatus.FORBIDDEN,
      );
    }
    const { name } = parse(stageInput, input);
    await this.stagesFor(org);
    return this.db.$transaction(async (tx) => {
      // Serialize stage configuration per tenant so concurrent edits cannot overwrite ordering.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${org}, 0))`;
      const stages = await tx.hrmsRecruitmentStage.findMany({
        where: { organizationId: org },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      });
      if (stages.length >= 500) {
        throw fail("A maximum of 500 stages is supported.", HttpStatus.CONFLICT);
      }
      if (stages.some((stage) => stage.name.toLowerCase() === name.toLowerCase())) {
        throw fail("A stage with this name already exists.", HttpStatus.CONFLICT);
      }
      const hired = stages.find((stage) => stage.systemKey === "HIRED");
      if (!hired) {
        throw fail("Hired stage is unavailable.", HttpStatus.CONFLICT);
      }
      const created = await tx.hrmsRecruitmentStage.create({
        data: { organizationId: org, name, position: stages.length - 1 },
      });
      const ordered = [...stages.filter((stage) => stage.id !== hired.id), created, hired];
      for (const [position, stage] of ordered.entries()) {
        await tx.hrmsRecruitmentStage.update({ where: { id: stage.id }, data: { position } });
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentStage",
          resourceId: created.id,
          action: "hrms.recruitment.stage_created",
          metadata: { name },
        },
      });
      return created;
    });
  }
  async renameStage(org: string, actor: string, id: string, input: unknown) {
    if (!(await this.role(org, actor)).admin) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        "Only organization administrators may edit stages.",
        HttpStatus.FORBIDDEN,
      );
    }
    const { name } = parse(stageInput, input);
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${org}, 0))`;
      const stages = await tx.hrmsRecruitmentStage.findMany({ where: { organizationId: org } });
      const stage = stages.find((item) => item.id === id);
      if (!stage) {
        throw fail("Stage not found.", HttpStatus.NOT_FOUND);
      }
      if (stages.some((item) => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) {
        throw fail("A stage with this name already exists.", HttpStatus.CONFLICT);
      }
      const updated = await tx.hrmsRecruitmentStage.update({ where: { id }, data: { name } });
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentStage",
          resourceId: id,
          action: "hrms.recruitment.stage_renamed",
          metadata: { from: stage.name, to: name },
        },
      });
      return updated;
    });
  }
  async deleteStage(org: string, actor: string, id: string) {
    if (!(await this.role(org, actor)).admin) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        "Only organization administrators may delete stages.",
        HttpStatus.FORBIDDEN,
      );
    }
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${org}, 0))`;
      const stage = await tx.hrmsRecruitmentStage.findFirst({ where: { id, organizationId: org } });
      if (!stage) {
        throw fail("Stage not found.", HttpStatus.NOT_FOUND);
      }
      if (stage.systemKey) {
        throw fail("Default stages cannot be deleted.", HttpStatus.CONFLICT);
      }
      const deleted = await tx.hrmsRecruitmentStage.deleteMany({
        where: { id, organizationId: org, systemKey: null, candidates: { none: {} } },
      });
      if (!deleted.count) {
        throw fail("Stages referenced by active or historical candidates cannot be deleted.", HttpStatus.CONFLICT);
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentStage",
          resourceId: id,
          action: "hrms.recruitment.stage_deleted",
          metadata: { name: stage.name },
        },
      });
      return { deleted: true };
    });
  }
  async reorderStages(org: string, actor: string, input: unknown) {
    if (!(await this.role(org, actor)).admin) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        "Only organization administrators may reorder stages.",
        HttpStatus.FORBIDDEN,
      );
    }
    const { stageIds, expectedStageIds } = parse(reorderInput, input);
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${org}, 0))`;
      const stages = await tx.hrmsRecruitmentStage.findMany({
        where: { organizationId: org },
        orderBy: [{ position: "asc" }, { id: "asc" }],
      });
      if (
        expectedStageIds.length !== stages.length ||
        stages.some((stage, index) => stage.id !== expectedStageIds[index])
      ) {
        throw fail("Stages changed. Reload and retry.", HttpStatus.CONFLICT);
      }
      if (
        stageIds.length !== stages.length ||
        new Set(stageIds).size !== stages.length ||
        stages.some((stage) => !stageIds.includes(stage.id))
      ) {
        throw fail("Stages changed. Reload and retry.", HttpStatus.CONFLICT);
      }
      const applied = stages.find((stage) => stage.systemKey === "APPLIED");
      const hired = stages.find((stage) => stage.systemKey === "HIRED");
      if (stageIds[0] !== applied?.id || stageIds[stageIds.length - 1] !== hired?.id) {
        throw fail("Applied must be first and Hired must be last.");
      }
      for (const [position, id] of stageIds.entries()) {
        await tx.hrmsRecruitmentStage.update({ where: { id }, data: { position } });
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentStage",
          resourceId: org,
          action: "hrms.recruitment.stages_reordered",
          metadata: { stageIds },
        },
      });
      return { updated: true };
    });
  }
  async board(org: string, actor: string, openingId?: string, includeClosed = false) {
    await this.manager(org, actor);
    return this.db.hrmsRecruitmentCandidate.findMany({
      where: { organizationId: org, ...(includeClosed ? {} : { outcome: null }), ...(openingId ? { openingId } : {}) },
      include: {
        opening: { select: { title: true } },
        stage: true,
        interviewFeedback: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }
  async reject(org: string, actor: string, id: string, input: unknown) {
    await this.manager(org, actor);
    const { reason, revision } = parse(rejectionInput, input);
    return this.db.$transaction(async (tx) => {
      const updated = await tx.hrmsRecruitmentCandidate.updateMany({
        where: { id, organizationId: org, revision, outcome: null },
        data: { outcome: "REJECTED", rejectionReason: reason, revision: { increment: 1 } },
      });
      if (!updated.count) {
        throw fail("Candidate changed or was not found. Reload and retry.", HttpStatus.CONFLICT);
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentCandidate",
          resourceId: id,
          action: "hrms.recruitment.candidate_rejected",
          metadata: {},
        },
      });
      return { revision: revision + 1 };
    });
  }
  async list(org: string, actor: string, page: number, openingId?: string, scope: "active" | "closed" = "active") {
    await this.manager(org, actor);
    const where = {
      organizationId: org,
      outcome: scope === "closed" ? { not: null } : null,
      ...(openingId ? { openingId } : {}),
    };
    const [items, total] = await this.db.$transaction([
      this.db.hrmsRecruitmentCandidate.findMany({
        where,
        include: {
          opening: { select: { title: true } },
          stage: true,
          interviewFeedback: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * 50,
        take: 50,
      }),
      this.db.hrmsRecruitmentCandidate.count({ where }),
    ]);
    return { items, total };
  }
  private async candidate(org: string, actor: string, id: string) {
    await this.manager(org, actor);
    const candidate = await this.db.hrmsRecruitmentCandidate.findFirst({
      where: { id, organizationId: org },
      include: {
        opening: { select: { title: true, description: true } },
        stage: true,
        comments: { orderBy: { createdAt: "desc" }, take: 100 },
        interviewFeedback: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });
    if (!candidate) {
      throw fail("Candidate not found.", HttpStatus.NOT_FOUND);
    }
    return candidate;
  }
  async details(org: string, actor: string, id: string) {
    return this.candidate(org, actor, id);
  }
  async create(org: string, actor: string, input: unknown) {
    await this.manager(org, actor);
    const data = parse(candidateInput, input);
    const stages = await this.stagesFor(org);
    const applied = stages.find((stage) => stage.systemKey === "APPLIED");
    if (!applied) {
      throw fail("Default Applied stage is unavailable.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this.db.$transaction(async (tx) => {
      const opening = await tx.hrmsJobOpening.findFirst({
        where: { id: data.openingId, organizationId: org, status: "OPEN" },
        select: { id: true },
      });
      if (!opening) {
        throw fail("Select an open job opening.", HttpStatus.CONFLICT);
      }
      const candidate = await tx.hrmsRecruitmentCandidate.create({
        data: { organizationId: org, ...data, email: data.email.toLowerCase(), stageId: applied.id },
      });
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentCandidate",
          resourceId: candidate.id,
          action: "hrms.recruitment.candidate_created",
          metadata: { openingId: data.openingId },
        },
      });
      return candidate;
    });
  }
  async move(org: string, actor: string, id: string, input: unknown) {
    const candidate = await this.candidate(org, actor, id);
    const { stageId, revision } = parse(moveInput, input);
    if (candidate.outcome) {
      throw fail("Closed candidates cannot be moved.", HttpStatus.CONFLICT);
    }
    if (candidate.stage.systemKey === "HIRED") {
      throw fail("Hired is the final stage; record a joined or declined outcome.", HttpStatus.CONFLICT);
    }
    return this.db.$transaction(async (tx) => {
      // Coordinate stage deletion with moves so a target cannot disappear between validation and update.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${org}, 0))`;
      const stage = await tx.hrmsRecruitmentStage.findFirst({ where: { id: stageId, organizationId: org } });
      if (!stage) {
        throw fail("Stage not found.", HttpStatus.NOT_FOUND);
      }
      const result = await tx.hrmsRecruitmentCandidate.updateMany({
        where: {
          id,
          organizationId: org,
          revision,
          outcome: null,
          stage: { OR: [{ systemKey: null }, { systemKey: { not: "HIRED" } }] },
        },
        data: { stageId, revision: { increment: 1 } },
      });
      if (!result.count) {
        throw fail("Candidate changed or access was revoked. Reload and retry.", HttpStatus.CONFLICT);
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentCandidate",
          resourceId: id,
          action: "hrms.recruitment.stage_changed",
          metadata: { from: candidate.stageId, to: stageId },
        },
      });
      return { revision: revision + 1 };
    });
  }
  async assignInterviewer(org: string, actor: string, id: string, input: unknown) {
    await this.manager(org, actor);
    const { userId, revision } = parse(assignmentInput, input);
    return this.db.$transaction(async (tx) => {
      if (userId) {
        const member = await tx.organizationMember.findFirst({
          where: {
            organizationId: org,
            userId,
            status: "ACTIVE",
            deletedAt: null,
            user: {
              status: "ACTIVE",
              deletedAt: null,
              hrmsEmployees: { some: { organizationId: org, status: "ACTIVE", deletedAt: null } },
            },
          },
          select: { id: true },
        });
        if (!member) {
          throw fail("Choose an active employee who is an organization member.");
        }
      }
      const updated = await tx.hrmsRecruitmentCandidate.updateMany({
        where: { organizationId: org, id, revision, outcome: null },
        data: { interviewerUserId: userId, revision: { increment: 1 } },
      });
      if (!updated.count) {
        throw fail("Candidate changed or was not found. Reload and retry.", HttpStatus.CONFLICT);
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentCandidate",
          resourceId: id,
          action: "hrms.recruitment.interviewer_assigned",
          metadata: { userId },
        },
      });
      return { revision: revision + 1 };
    });
  }
  async interviewDetails(org: string, actor: string, id: string) {
    // Assignment, not a recruitment grant or knowledge of the URL, is the access boundary.
    const candidate = await this.db.hrmsRecruitmentCandidate.findFirst({
      where: { organizationId: org, id, interviewerUserId: actor, outcome: null },
      include: {
        opening: true,
        stage: true,
        comments: { orderBy: { createdAt: "desc" }, take: 100 },
        interviewFeedback: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });
    if (!candidate) {
      throw fail("Interview assignment not found.", HttpStatus.NOT_FOUND);
    }
    return candidate;
  }
  async submitInterviewFeedback(org: string, actor: string, id: string, input: unknown) {
    const data = parse(interviewFeedbackInput, input);
    return this.db.$transaction(async (tx) => {
      // The assignment and revision are rechecked atomically with the write.
      const updated = await tx.hrmsRecruitmentCandidate.updateMany({
        where: { organizationId: org, id, interviewerUserId: actor, revision: data.revision, outcome: null },
        data: { revision: { increment: 1 } },
      });
      if (!updated.count) {
        throw fail("Interview assignment changed or is no longer available. Reload and retry.", HttpStatus.CONFLICT);
      }
      const feedback = await tx.hrmsRecruitmentInterviewFeedback.create({
        data: {
          organizationId: org,
          candidateId: id,
          authorUserId: actor,
          verdict: data.verdict,
          feedback: data.feedback,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentCandidate",
          resourceId: id,
          action: "hrms.recruitment.interview_feedback_submitted",
          metadata: { verdict: data.verdict, feedbackId: feedback.id },
        },
      });
      return { revision: data.revision + 1 };
    });
  }
  async assign(org: string, actor: string, id: string, input: unknown) {
    await this.manager(org, actor);
    const { userId, revision } = parse(assignmentInput, input);
    return this.db.$transaction(async (tx) => {
      if (userId) {
        const grant = await tx.hrmsRecruitmentGrant.findFirst({
          where: {
            organizationId: org,
            userId,
            user: {
              status: "ACTIVE",
              deletedAt: null,
              memberships: { some: { organizationId: org, status: "ACTIVE", deletedAt: null } },
            },
          },
        });
        if (!grant) {
          throw fail("Choose an active member with recruitment access.");
        }
      }
      const updated = await tx.hrmsRecruitmentCandidate.updateMany({
        where: { organizationId: org, id, revision, outcome: null },
        data: { assignedUserId: userId, revision: { increment: 1 } },
      });
      if (!updated.count) {
        throw fail("Candidate changed or was not found. Reload and retry.", HttpStatus.CONFLICT);
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentCandidate",
          resourceId: id,
          action: "hrms.recruitment.assigned",
          metadata: { userId },
        },
      });
      return { revision: revision + 1 };
    });
  }
  async close(org: string, actor: string, id: string, input: unknown) {
    await this.manager(org, actor);
    const { outcome, revision } = parse(outcomeInput, input);
    return this.db.$transaction(async (tx) => {
      const updated = await tx.hrmsRecruitmentCandidate.updateMany({
        where: { organizationId: org, id, revision, outcome: null, stage: { systemKey: "HIRED" } },
        data: { outcome, revision: { increment: 1 } },
      });
      if (!updated.count) {
        throw fail("Candidate must be in Hired and unchanged before closing.", HttpStatus.CONFLICT);
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentCandidate",
          resourceId: id,
          action: "hrms.recruitment.closed",
          metadata: { outcome },
        },
      });
      return { revision: revision + 1 };
    });
  }
  async comment(org: string, actor: string, id: string, input: unknown) {
    await this.candidate(org, actor, id);
    const { text } = parse(commentInput, input);
    return this.db.$transaction(async (tx) => {
      const visible = await tx.hrmsRecruitmentCandidate.findFirst({
        where: { id, organizationId: org },
        select: { id: true },
      });
      if (!visible) {
        throw fail("Candidate not found.", HttpStatus.NOT_FOUND);
      }
      return tx.hrmsRecruitmentComment.create({
        data: { organizationId: org, candidateId: id, authorUserId: actor, text },
      });
    });
  }
}
