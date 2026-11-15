import { HttpStatus, Injectable } from "@nestjs/common";
import {
  LeaveStatus,
  PayrollStatus,
  Prisma,
  ReviewStatus,
  TrainingEnrollmentStatus,
  TrainingStatus,
  type LeaveType,
  type ReviewType,
  type TrainingType,
} from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { AppSettingsService } from "../../settings/app-settings.service";
import { resolveAppSettings, settingsPolicyError } from "../../settings/settings.defaults";
import { enqueueNotification } from "../../notification/notification-events";
import { resolveWorkWeek, workWeekLeaveAllocation } from "../work-week";

@Injectable()
export class HrmsOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly settings: AppSettingsService,
  ) {}

  listLeave(organizationId: string) {
    return this.prisma.hrmsLeaveRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { id: true, employeeNumber: true } } },
    });
  }
  async createLeave(
    organizationId: string,
    actorUserId: string,
    input: {
      employeeId: string;
      leaveType: LeaveType;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason?: string;
    },
  ) {
    await this.requireActiveEmployee(organizationId, input.employeeId);
    this.assertDateRange(input.startDate, input.endDate);
    const policy = await resolveAppSettings(this.settings, "hrms", organizationId);
    if (policy.maxLeaveRequestDays !== null && input.totalDays > policy.maxLeaveRequestDays) {
      throw settingsPolicyError(
        `Leave requests are limited to ${policy.maxLeaveRequestDays} days`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const schedule = await resolveWorkWeek(
        tx, organizationId, input.employeeId, input.startDate.slice(0, 10), input.endDate.slice(0, 10), policy.workingDays,
      );
      const dayAllocation = workWeekLeaveAllocation(schedule, input.totalDays, policy.allowHalfDayLeave);
      const leave = await tx.hrmsLeaveRequest.create({
        data: {
          organizationId,
          employeeId: input.employeeId,
          leaveType: input.leaveType,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          totalDays: input.totalDays,
          dayAllocation,
          reason: this.clean(input.reason),
        },
      });
      const reviewers = await tx.organizationMember.findMany({
        where: { organizationId, status: "ACTIVE", deletedAt: null, isOwner: true },
        select: { userId: true },
      });
      await enqueueNotification(tx, {
        organizationId,
        actorId: actorUserId,
        sourceType: "hrms",
        sourceId: leave.id,
        type: "HRMS_LEAVE_REQUEST",
        recipientIds: reviewers.map((member) => member.userId),
        title: "A leave request needs review",
        path: "home",
      });
      return leave;
    });
    return this.auditRecord("hrms.leave.created", organizationId, actorUserId, record.id, {
      employeeId: input.employeeId,
    }).then(() => record);
  }
  async updateLeaveStatus(
    organizationId: string,
    leaveId: string,
    actorUserId: string,
    status: LeaveStatus,
    rejectionReason?: string,
  ) {
    const existing = await this.prisma.hrmsLeaveRequest.findFirst({
      where: { id: leaveId, organizationId },
      select: { id: true, status: true },
    });
    if (!existing) {
      this.notFound();
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const leave = await tx.hrmsLeaveRequest.update({
        where: { id: leaveId },
        data: {
          status,
          ...(status === "APPROVED"
            ? {
                approvedByUserId: actorUserId,
                approvedAt: new Date(),
                rejectedByUserId: null,
                rejectedAt: null,
                rejectionReason: null,
              }
            : {}),
          ...(status === "REJECTED"
            ? { rejectedByUserId: actorUserId, rejectedAt: new Date(), rejectionReason: this.clean(rejectionReason) }
            : {}),
        },
      });
      if (existing.status !== status && (status === "APPROVED" || status === "REJECTED")) {
        const employee = await tx.hrmsEmployee.findUniqueOrThrow({
          where: { id: leave.employeeId },
          select: { userId: true },
        });
        await enqueueNotification(tx, {
          organizationId,
          actorId: actorUserId,
          sourceType: "hrms",
          sourceId: leave.id,
          type: "HRMS_LEAVE_DECISION",
          recipientIds: [employee.userId],
          title: `Your leave request was ${status.toLowerCase()}`,
          path: "home",
        });
      }
      return leave;
    });
    return this.auditRecord("hrms.leave.status_updated", organizationId, actorUserId, record.id, { status }).then(
      () => record,
    );
  }

  listReviews(organizationId: string) {
    return this.prisma.hrmsPerformanceReview.findMany({
      where: { organizationId },
      orderBy: { dueDate: "asc" },
      include: { employee: { select: { employeeNumber: true } }, reviewer: { select: { employeeNumber: true } } },
    });
  }
  async createReview(
    organizationId: string,
    actorUserId: string,
    input: {
      employeeId: string;
      reviewerEmployeeId: string;
      reviewType: ReviewType;
      cycle: string;
      startDate: string;
      dueDate: string;
      status?: ReviewStatus;
      overallRating?: number;
      comments?: string;
    },
  ) {
    await Promise.all([
      this.requireActiveEmployee(organizationId, input.employeeId),
      this.requireActiveEmployee(organizationId, input.reviewerEmployeeId),
    ]);
    this.assertDateRange(input.startDate, input.dueDate);
    const record = await this.prisma.hrmsPerformanceReview.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        reviewerEmployeeId: input.reviewerEmployeeId,
        reviewType: input.reviewType,
        cycle: input.cycle.trim(),
        startDate: new Date(input.startDate),
        dueDate: new Date(input.dueDate),
        status: input.status,
        overallRating: input.overallRating,
        comments: this.clean(input.comments),
      },
    });
    return this.auditRecord("hrms.performance_review.created", organizationId, actorUserId, record.id, {
      employeeId: input.employeeId,
    }).then(() => record);
  }

  listPayroll(organizationId: string) {
    return this.prisma.hrmsPayrollRecord.findMany({
      where: { organizationId },
      orderBy: { payDate: "desc" },
      include: { employee: { select: { employeeNumber: true } } },
    });
  }
  async createPayroll(
    organizationId: string,
    actorUserId: string,
    input: {
      employeeId: string;
      period: string;
      periodStart: string;
      periodEnd: string;
      payDate: string;
      grossSalary: number;
      totalDeductions: number;
      netPay: number;
      currency?: string;
      notes?: string;
    },
  ) {
    await this.requireActiveEmployee(organizationId, input.employeeId);
    this.assertDateRange(input.periodStart, input.periodEnd);
    const record = await this.prisma.$transaction(async (tx) => {
      // Protect locked run payroll even when a legacy caller uses a different free-text period label.
      const overlapping = await tx.hrmsPayrollRecord.findFirst({
        where: { organizationId, employeeId: input.employeeId, runId: { not: null },
          periodStart: { lte: new Date(input.periodEnd) }, periodEnd: { gte: new Date(input.periodStart) } },
        select: { id: true },
      });
      if (overlapping) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "An approved payroll run already covers this employee and date range", HttpStatus.CONFLICT);
      }
      return tx.hrmsPayrollRecord.create({
        data: {
          organizationId,
          employeeId: input.employeeId,
          period: input.period.trim(),
          periodStart: new Date(input.periodStart),
          periodEnd: new Date(input.periodEnd),
          payDate: new Date(input.payDate),
          grossSalary: input.grossSalary,
          totalDeductions: input.totalDeductions,
          netPay: input.netPay,
          currency:
            input.currency?.trim().toUpperCase() ??
            (await resolveAppSettings(this.settings, "hrms", organizationId)).defaultPayrollCurrency,
          notes: this.clean(input.notes),
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Duplicate or concurrently changed payroll; reload before retrying", HttpStatus.CONFLICT);
        }
        throw error;
      });
    return this.auditRecord("hrms.payroll.created", organizationId, actorUserId, record.id, {
      employeeId: input.employeeId,
      period: input.period,
    }).then(() => record);
  }
  async approvePayroll(organizationId: string, payrollId: string, actorUserId: string) {
    const existing = await this.prisma.hrmsPayrollRecord.findFirst({
      where: { id: payrollId, organizationId },
      select: { id: true, status: true, runId: true },
    });
    if (!existing) {
      this.notFound();
    }
    // Run-owned records inherit the independently approved snapshot and cannot be reapproved through legacy routes.
    if (existing.runId) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Manage this payroll record through its payroll run", HttpStatus.CONFLICT);
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const payroll = await tx.hrmsPayrollRecord.update({
        where: { id: payrollId },
        data: { status: PayrollStatus.APPROVED, approvedByUserId: actorUserId, approvedAt: new Date() },
      });
      const employee = await tx.hrmsEmployee.findUniqueOrThrow({
        where: { id: payroll.employeeId },
        select: { userId: true },
      });
      if (existing.status !== "APPROVED") {
        await enqueueNotification(tx, {
          organizationId,
          actorId: actorUserId,
          sourceType: "hrms",
          sourceId: payroll.id,
          type: "HRMS_PAYROLL",
          recipientIds: [employee.userId],
          title: "Your payroll record was approved",
          path: "home",
        });
      }
      return payroll;
    });
    return this.auditRecord("hrms.payroll.approved", organizationId, actorUserId, record.id).then(() => record);
  }

  listTrainings(organizationId: string) {
    return this.prisma.hrmsTraining.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { enrollments: true } } },
    });
  }
  async createTraining(
    organizationId: string,
    actorUserId: string,
    input: {
      title: string;
      type: TrainingType;
      description?: string;
      startDate?: string;
      endDate?: string;
      status?: TrainingStatus;
      maxParticipants?: number;
    },
  ) {
    if (input.startDate && input.endDate) {
      this.assertDateRange(input.startDate, input.endDate);
    }
    const { maxTrainingParticipants } = await resolveAppSettings(this.settings, "hrms", organizationId);
    if (
      maxTrainingParticipants !== null &&
      input.maxParticipants !== undefined &&
      input.maxParticipants > maxTrainingParticipants
    ) {
      throw settingsPolicyError(
        `Trainings are limited to ${maxTrainingParticipants} participants`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const record = await this.prisma.hrmsTraining.create({
      data: {
        organizationId,
        title: input.title.trim(),
        type: input.type,
        description: this.clean(input.description),
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: input.status,
        maxParticipants: input.maxParticipants ?? maxTrainingParticipants ?? undefined,
      },
    });
    return this.auditRecord("hrms.training.created", organizationId, actorUserId, record.id).then(() => record);
  }
  async enrollTraining(
    organizationId: string,
    trainingId: string,
    actorUserId: string,
    employeeId: string,
    status?: TrainingEnrollmentStatus,
  ) {
    await this.requireActiveEmployee(organizationId, employeeId);
    const training = await this.prisma.hrmsTraining.findFirst({
      where: { id: trainingId, organizationId },
      select: { id: true, maxParticipants: true },
    });
    if (!training) {
      this.notFound();
    }
    if (training.maxParticipants !== null) {
      const enrolled = await this.prisma.hrmsTrainingEnrollment.count({ where: { trainingId } });
      if (enrolled >= training.maxParticipants) {
        throw new AppError(
          ErrorCode.ENTITLEMENT_LIMIT_EXCEEDED,
          "Training has reached its participant limit",
          HttpStatus.CONFLICT,
        );
      }
    }
    const record = await this.prisma.hrmsTrainingEnrollment.upsert({
      where: { trainingId_employeeId: { trainingId, employeeId } },
      create: { organizationId, trainingId, employeeId, status: status ?? TrainingEnrollmentStatus.ENROLLED },
      update: { status: status ?? TrainingEnrollmentStatus.ENROLLED },
    });
    return this.auditRecord("hrms.training.enrolled", organizationId, actorUserId, record.id, {
      trainingId,
      employeeId,
    }).then(() => record);
  }

  listBenefits(organizationId: string) {
    return this.prisma.hrmsBenefitEnrollment.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { employeeNumber: true } } },
    });
  }
  async createBenefit(
    organizationId: string,
    actorUserId: string,
    input: {
      employeeId: string;
      provider: string;
      planName: string;
      policyNumber?: string;
      coverageStarts: string;
      coverageEnds?: string;
      isActive?: boolean;
    },
  ) {
    await this.requireActiveEmployee(organizationId, input.employeeId);
    if (input.coverageEnds) {
      this.assertDateRange(input.coverageStarts, input.coverageEnds);
    }
    const record = await this.prisma.hrmsBenefitEnrollment.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        provider: input.provider.trim(),
        planName: input.planName.trim(),
        policyNumber: this.clean(input.policyNumber),
        coverageStarts: new Date(input.coverageStarts),
        coverageEnds: input.coverageEnds ? new Date(input.coverageEnds) : null,
        isActive: input.isActive ?? true,
      },
    });
    return this.auditRecord("hrms.benefit.created", organizationId, actorUserId, record.id, {
      employeeId: input.employeeId,
    }).then(() => record);
  }

  private async requireActiveEmployee(organizationId: string, employeeId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!employee) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Active employee not found", HttpStatus.NOT_FOUND);
    }
  }
  private assertDateRange(start: string, end: string) {
    if (new Date(start) > new Date(end)) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Start date must not be after end date", HttpStatus.BAD_REQUEST);
    }
  }
  private clean(value?: string) {
    return value?.trim() || null;
  }
  private notFound(): never {
    throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "HRMS record not found", HttpStatus.NOT_FOUND);
  }
  private auditRecord(
    action: string,
    organizationId: string,
    actorUserId: string,
    resourceId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.audit.record({ action, organizationId, actorUserId, resourceType: "HRMS", resourceId, metadata });
  }
}
