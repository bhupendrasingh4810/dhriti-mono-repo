import { HttpStatus, Injectable } from "@nestjs/common";
import {
  AssetStatus,
  LeaveStatus,
  PayrollStatus,
  ReviewStatus,
  TrainingEnrollmentStatus,
  TrainingStatus,
  type AssetType,
  type LeaveType,
  type Prisma,
  type ReviewType,
  type TrainingType,
} from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class HrmsOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
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
    const record = await this.prisma.hrmsLeaveRequest.create({
      data: {
        organizationId,
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        totalDays: input.totalDays,
        reason: this.clean(input.reason),
      },
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
      select: { id: true },
    });
    if (!existing) {
      this.notFound();
    }
    const record = await this.prisma.hrmsLeaveRequest.update({
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
    const record = await this.prisma.hrmsPayrollRecord
      .create({
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
          currency: input.currency?.trim().toUpperCase() ?? "USD",
          notes: this.clean(input.notes),
        },
      })
      .catch(() => {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "A payroll record already exists for this employee and period",
          HttpStatus.CONFLICT,
        );
      });
    return this.auditRecord("hrms.payroll.created", organizationId, actorUserId, record.id, {
      employeeId: input.employeeId,
      period: input.period,
    }).then(() => record);
  }
  async approvePayroll(organizationId: string, payrollId: string, actorUserId: string) {
    const existing = await this.prisma.hrmsPayrollRecord.findFirst({
      where: { id: payrollId, organizationId },
      select: { id: true },
    });
    if (!existing) {
      this.notFound();
    }
    const record = await this.prisma.hrmsPayrollRecord.update({
      where: { id: payrollId },
      data: { status: PayrollStatus.APPROVED, approvedByUserId: actorUserId, approvedAt: new Date() },
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
    const record = await this.prisma.hrmsTraining.create({
      data: {
        organizationId,
        title: input.title.trim(),
        type: input.type,
        description: this.clean(input.description),
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: input.status,
        maxParticipants: input.maxParticipants,
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

  listAssets(organizationId: string) {
    return this.prisma.hrmsAsset.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: { assignedEmployee: { select: { employeeNumber: true } } },
    });
  }
  async createAsset(
    organizationId: string,
    actorUserId: string,
    input: { name: string; type: AssetType; serialNumber?: string; location?: string; notes?: string },
  ) {
    const record = await this.prisma.hrmsAsset
      .create({
        data: {
          organizationId,
          name: input.name.trim(),
          type: input.type,
          serialNumber: this.clean(input.serialNumber),
          location: this.clean(input.location),
          notes: this.clean(input.notes),
        },
      })
      .catch(() => {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Asset serial number already exists in this organization",
          HttpStatus.CONFLICT,
        );
      });
    return this.auditRecord("hrms.asset.created", organizationId, actorUserId, record.id).then(() => record);
  }
  async assignAsset(organizationId: string, assetId: string, actorUserId: string, employeeId?: string) {
    const asset = await this.prisma.hrmsAsset.findFirst({
      where: { id: assetId, organizationId },
      select: { id: true },
    });
    if (!asset) {
      this.notFound();
    }
    if (employeeId) {
      await this.requireActiveEmployee(organizationId, employeeId);
    }
    const record = await this.prisma.hrmsAsset.update({
      where: { id: assetId },
      data: {
        assignedEmployeeId: employeeId ?? null,
        assignedAt: employeeId ? new Date() : null,
        status: employeeId ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE,
      },
    });
    return this.auditRecord("hrms.asset.assignment_updated", organizationId, actorUserId, record.id, {
      employeeId: employeeId ?? null,
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
