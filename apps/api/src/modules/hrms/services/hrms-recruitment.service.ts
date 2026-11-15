import { HttpStatus, Injectable } from "@nestjs/common";
import { z } from "@dhriti/validation";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { PermissionService } from "../../authorization/services/permission.service";

const amount = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/);
const openingSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    department: z.string().trim().min(1).max(120),
    location: z.string().trim().min(1).max(200),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "TEMPORARY"]),
    workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
    description: z.string().trim().min(1).max(10000),
    companyName: z.string().trim().min(1).max(200).nullable().optional(),
    experienceMin: z.number().int().min(0).max(100).nullable().optional(),
    experienceMax: z.number().int().min(0).max(100).nullable().optional(),
    ctcMin: amount.nullable().optional(),
    ctcMax: amount.nullable().optional(),
    ctcCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable()
      .optional(),
    ctcPeriod: z.enum(["YEAR", "MONTH"]).nullable().optional(),
    ctcNotDisclosed: z.boolean().optional(),
    postedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      }, "Enter a valid date.")
      .nullable()
      .optional(),
    openingsCount: z.number().int().min(1).max(100000).nullable().optional(),
    highlights: z.string().trim().max(5000).nullable().optional(),
    keySkills: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.experienceMin !== null &&
      data.experienceMin !== undefined &&
      data.experienceMax !== null &&
      data.experienceMax !== undefined &&
      data.experienceMin > data.experienceMax
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["experienceMax"],
        message: "Maximum experience must not be less than minimum.",
      });
    }
    if (
      data.ctcMin !== null &&
      data.ctcMin !== undefined &&
      data.ctcMax !== null &&
      data.ctcMax !== undefined &&
      Number(data.ctcMin) > Number(data.ctcMax)
    ) {
      ctx.addIssue({ code: "custom", path: ["ctcMax"], message: "Maximum CTC must not be less than minimum." });
    }
    // Not disclosed controls publication visibility; a private range may still be recorded.
    if (data.ctcNotDisclosed === false && (!data.ctcMin || !data.ctcMax || !data.ctcCurrency || !data.ctcPeriod)) {
      ctx.addIssue({
        code: "custom",
        path: ["ctcMin"],
        message: "A disclosed CTC requires a range, currency and period.",
      });
    }
  });
const grantSchema = z.object({ userId: z.string().uuid(), role: z.enum(["MANAGER", "INTERVIEWER"]) }).strict();
const statusSchema = z
  .object({ status: z.enum(["DRAFT", "OPEN", "CLOSED"]), revision: z.number().int().positive() })
  .strict();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError(
      ErrorCode.VALIDATION_FAILED,
      result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      HttpStatus.BAD_REQUEST,
    );
  }
  return result.data;
}

@Injectable()
export class HrmsRecruitmentService {
  constructor(
    private readonly db: PrismaService,
    private readonly permissions: PermissionService,
  ) {}

  async access(org: string, user: string) {
    const admin = await this.permissions.isOrganizationAdministrator(user, org);
    const grant = await this.db.hrmsRecruitmentGrant.findUnique({
      where: { organizationId_userId: { organizationId: org, userId: user } },
    });
    return { admin, role: admin ? "MANAGER" : (grant?.role ?? null) };
  }

  private async requireManager(org: string, user: string) {
    if ((await this.access(org, user)).role !== "MANAGER") {
      throw new AppError(ErrorCode.PERMISSION_DENIED, "Recruitment manager access is required.", HttpStatus.FORBIDDEN);
    }
  }

  private async requireAdmin(org: string, user: string) {
    if (!(await this.permissions.isOrganizationAdministrator(user, org))) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        "Only organization administrators can manage recruitment access.",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async members(org: string, actor: string, query: string, page: number) {
    await this.requireAdmin(org, actor);
    return this.activeMembers(org, query, page);
  }

  async interviewers(org: string, actor: string, query: string, page: number) {
    await this.requireManager(org, actor);
    return this.db.organizationMember.findMany({
      where: {
        organizationId: org,
        status: "ACTIVE",
        deletedAt: null,
        user: {
          deletedAt: null,
          status: "ACTIVE",
          name: { contains: query, mode: "insensitive" },
          hrmsEmployees: { some: { organizationId: org, status: "ACTIVE", deletedAt: null } },
        },
      },
      select: { userId: true, user: { select: { name: true, email: true } } },
      orderBy: [{ user: { name: "asc" } }, { userId: "asc" }],
      skip: (page - 1) * 50,
      take: 51,
    });
  }

  private async activeMembers(org: string, query: string, page: number) {
    return this.db.organizationMember.findMany({
      where: {
        organizationId: org,
        status: "ACTIVE",
        deletedAt: null,
        user: { deletedAt: null, status: "ACTIVE", name: { contains: query, mode: "insensitive" } },
      },
      select: { userId: true, user: { select: { name: true, email: true } } },
      orderBy: [{ user: { name: "asc" } }, { userId: "asc" }],
      skip: (page - 1) * 50,
      take: 51,
    });
  }

  async grants(org: string, actor: string) {
    await this.requireAdmin(org, actor);
    return this.db.hrmsRecruitmentGrant.findMany({
      where: { organizationId: org },
      select: { userId: true, role: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async assignees(org: string, actor: string) {
    await this.requireManager(org, actor);
    return this.db.hrmsRecruitmentGrant.findMany({
      where: {
        organizationId: org,
        user: {
          status: "ACTIVE",
          deletedAt: null,
          memberships: { some: { organizationId: org, status: "ACTIVE", deletedAt: null } },
        },
      },
      select: { userId: true, role: true, user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async setGrant(org: string, actor: string, input: unknown) {
    await this.requireAdmin(org, actor);
    const data = parse(grantSchema, input);
    return this.db.$transaction(async (tx) => {
      const member = await tx.organizationMember.findFirst({
        where: {
          organizationId: org,
          userId: data.userId,
          status: "ACTIVE",
          deletedAt: null,
          user: { deletedAt: null, status: "ACTIVE" },
        },
        select: { id: true },
      });
      if (!member) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Select an active organization member.",
          HttpStatus.BAD_REQUEST,
        );
      }
      const grant = await tx.hrmsRecruitmentGrant.upsert({
        where: { organizationId_userId: { organizationId: org, userId: data.userId } },
        create: { organizationId: org, ...data },
        update: { role: data.role },
      });
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentGrant",
          resourceId: grant.id,
          action: "hrms.recruitment.grant_set",
          metadata: { userId: data.userId, role: data.role },
        },
      });
      return grant;
    });
  }

  async revokeGrant(org: string, actor: string, userId: string) {
    await this.requireAdmin(org, actor);
    await this.db.$transaction(async (tx) => {
      const grant = await tx.hrmsRecruitmentGrant.findUnique({
        where: { organizationId_userId: { organizationId: org, userId } },
      });
      if (!grant) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Recruitment grant not found.", HttpStatus.NOT_FOUND);
      }
      await tx.hrmsRecruitmentGrant.delete({ where: { id: grant.id } });
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsRecruitmentGrant",
          resourceId: grant.id,
          action: "hrms.recruitment.grant_revoked",
          metadata: { userId, role: grant.role },
        },
      });
    });
  }

  async openings(org: string, actor: string, page: number) {
    await this.requireManager(org, actor);
    const where = { organizationId: org };
    const [items, total, open, applied, interviews, hired] = await this.db.$transaction([
      this.db.hrmsJobOpening.findMany({
        where,
        include: { _count: { select: { candidates: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * 20,
        take: 20,
      }),
      this.db.hrmsJobOpening.count({ where }),
      this.db.hrmsJobOpening.count({ where: { ...where, status: "OPEN" } }),
      this.db.hrmsRecruitmentCandidate.count({ where }),
      this.db.hrmsRecruitmentCandidate.count({ where: { ...where, outcome: null, stage: { systemKey: "INTERVIEW" } } }),
      this.db.hrmsRecruitmentCandidate.count({
        where: { ...where, stage: { systemKey: "HIRED" }, OR: [{ outcome: null }, { outcome: "JOINED" }] },
      }),
    ]);
    return { items, total, open, applied, interviews, hired };
  }

  async createOpening(org: string, actor: string, input: unknown) {
    await this.requireManager(org, actor);
    const data = parse(openingSchema, input);
    return this.db.$transaction(async (tx) => {
      const opening = await tx.hrmsJobOpening.create({
        data: {
          ...data,
          postedDate: data.postedDate ? new Date(`${data.postedDate}T00:00:00.000Z`) : null,
          organizationId: org,
          createdById: actor,
        },
      });
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsJobOpening",
          resourceId: opening.id,
          action: "hrms.recruitment.opening_created",
          metadata: {},
        },
      });
      return opening;
    });
  }

  async changeStatus(org: string, actor: string, id: string, input: unknown) {
    await this.requireManager(org, actor);
    const { status, revision } = parse(statusSchema, input);
    return this.db.$transaction(async (tx) => {
      // OPEN is internal only; public publication requires the separate careers/application workflow.
      const updated = await tx.hrmsJobOpening.updateMany({
        where: { id, organizationId: org, revision },
        data: { status, revision: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Opening changed or was not found. Reload and retry.",
          HttpStatus.CONFLICT,
        );
      }
      await tx.auditLog.create({
        data: {
          organizationId: org,
          actorUserId: actor,
          resourceType: "HrmsJobOpening",
          resourceId: id,
          action: "hrms.recruitment.opening_status",
          metadata: { status },
        },
      });
      return tx.hrmsJobOpening.findFirstOrThrow({ where: { id, organizationId: org } });
    });
  }
}
