import { HttpStatus, Injectable } from "@nestjs/common";
import type { LeaveStatus, Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { enqueueNotification } from "../../notification/notification-events";
import { AppSettingsService } from "../../settings/app-settings.service";
import { resolveAppSettings, settingsPolicyError } from "../../settings/settings.defaults";
import type {
  ApplyHrmsCompOffDto,
  ApplyHrmsLeaveDto,
  UpsertHrmsLeaveTypeDto,
} from "../dto/hrms-leave-center.dto";

const ACTIVE_STATUSES: LeaveStatus[] = ["PENDING", "NEEDS_INFO", "APPROVED"];
const OPEN_STATUSES: LeaveStatus[] = ["PENDING", "NEEDS_INFO"];
/** Leave attachments are capped lower than the platform-wide file limit. */
const ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024;
/** System leave types managed from HRMS settings; granted in full each year rather than accrued monthly. */
const BIRTHDAY_CODE = "BIRTHDAY";
const OPTIONAL_CODE = "OPTIONAL";
const FIXED_GRANT_CODES = [BIRTHDAY_CODE, OPTIONAL_CODE];
const DAY_MS = 86_400_000;

const DEFAULT_TYPES = [
  { code: "PRIVILEGE", name: "Privilege leave", category: "VACATION", annualDays: 12 },
  { code: "SICK", name: "Sick leave", category: "SICK_LEAVE", annualDays: 8 },
  { code: "CASUAL", name: "Casual leave", category: "PERSONAL_LEAVE", annualDays: 6 },
  { code: "WFH", name: "Work from home", category: "WORK_FROM_HOME", annualDays: 0 },
  { code: "UNPAID", name: "Unpaid leave", category: "UNPAID_LEAVE", annualDays: 0, isPaid: false },
  { code: "COMP_OFF", name: "Comp off", category: "VACATION", annualDays: 0, isCompOff: true },
] as const;

const parseDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "Invalid date", HttpStatus.BAD_REQUEST);
  }
  return date;
};
const todayUtc = () => parseDate(new Date().toISOString());
const bad = (message: string, status = HttpStatus.BAD_REQUEST) =>
  new AppError(ErrorCode.VALIDATION_FAILED, message, status);
const clean = (value?: string | null) => value?.trim() || null;

const requestEmployee = { select: { id: true, employeeNumber: true, user: { select: { id: true, name: true, avatarUrl: true } } } } as const;

/**
 * Self-service leave and comp-off, admin-managed leave types, balances and the HR review flow.
 *
 * Invariants:
 *  - Leave types are tenant-owned; defaults are created lazily the first time an organization lists them.
 *  - `HrmsLeaveRequest.leaveType` always mirrors the chosen type's `category`, so Pulse keeps reading the enum.
 *  - A type with `annualDays = 0` and no comp-off flag is unlimited (work from home, unpaid).
 *  - Balances use the calendar year of the request's start date; comp-off credit is the sum of approved comp-off days.
 *  - Applying for someone else requires the `leaveOnBehalfEnabled` HRMS setting plus `hrms.leave.manage` (route guard).
 *  - Pending and needs-info requests count against the balance so it cannot be over-booked.
 */
@Injectable()
export class HrmsLeaveCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly settings: AppSettingsService,
  ) {}

  // ---- Leave types ----

  async listTypes(organizationId: string) {
    const count = await this.prisma.hrmsLeaveType.count({ where: { organizationId } });
    if (count === 0) {
      await this.prisma.hrmsLeaveType.createMany({
        data: DEFAULT_TYPES.map((type, index) => ({ organizationId, sortOrder: index, ...type })),
        skipDuplicates: true,
      });
    }
    await this.syncSystemTypes(organizationId);
    return this.prisma.hrmsLeaveType.findMany({ where: { organizationId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  }

  /**
   * Birthday and optional leave are driven by HRMS settings: enabling creates (or reactivates) the type with the
   * configured yearly days, disabling deactivates it so it disappears from the apply form. Existing requests keep their label.
   */
  private async syncSystemTypes(organizationId: string) {
    const policy = await resolveAppSettings(this.settings, "hrms", organizationId);
    const wanted = [
      { code: BIRTHDAY_CODE, name: "Birthday Leave", category: "PERSONAL_LEAVE" as const, enabled: policy.birthdayLeaveEnabled, days: policy.birthdayLeaveDays },
      { code: OPTIONAL_CODE, name: "Optional Leave", category: "PERSONAL_LEAVE" as const, enabled: policy.optionalLeaveEnabled, days: policy.optionalLeaveDays },
    ];
    const existing = await this.prisma.hrmsLeaveType.findMany({ where: { organizationId, code: { in: wanted.map((entry) => entry.code) } } });
    for (const entry of wanted) {
      const current = existing.find((type) => type.code === entry.code);
      if (!current && entry.enabled) {
        await this.prisma.hrmsLeaveType.create({
          data: { organizationId, name: entry.name, code: entry.code, category: entry.category, annualDays: entry.days, allowHalfDay: false, sortOrder: 90 },
        });
      } else if (current && (current.isActive !== entry.enabled || (entry.enabled && current.annualDays !== entry.days))) {
        await this.prisma.hrmsLeaveType.update({ where: { id: current.id }, data: { isActive: entry.enabled, ...(entry.enabled ? { annualDays: entry.days } : {}) } });
      }
    }
  }

  async upsertType(organizationId: string, actorUserId: string, input: UpsertHrmsLeaveTypeDto) {
    const duplicate = await this.prisma.hrmsLeaveType.findFirst({
      where: { organizationId, code: input.code, ...(input.id ? { NOT: { id: input.id } } : {}) },
      select: { id: true },
    });
    if (duplicate) {
      throw bad("A leave type with this code already exists", HttpStatus.CONFLICT);
    }
    const data = {
      name: input.name.trim(),
      code: input.code,
      category: input.category ?? "VACATION",
      annualDays: input.annualDays ?? 0,
      carryForwardDays: input.carryForwardDays ?? 0,
      isPaid: input.isPaid ?? true,
      allowHalfDay: input.allowHalfDay ?? true,
      isCompOff: input.isCompOff ?? false,
      isActive: input.isActive ?? true,
    };
    let record;
    if (input.id) {
      const existing = await this.prisma.hrmsLeaveType.findFirst({ where: { id: input.id, organizationId }, select: { id: true } });
      if (!existing) {
        throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Leave type not found", HttpStatus.NOT_FOUND);
      }
      record = await this.prisma.hrmsLeaveType.update({ where: { id: input.id }, data });
    } else {
      record = await this.prisma.hrmsLeaveType.create({ data: { organizationId, ...data } });
    }
    await this.record("hrms.leave_type.saved", organizationId, actorUserId, record.id, "hrms_leave_type", { code: record.code });
    return record;
  }

  /** Types already used by requests are deactivated instead of deleted so history keeps its label. */
  async removeType(organizationId: string, actorUserId: string, typeId: string) {
    const type = await this.prisma.hrmsLeaveType.findFirst({
      where: { id: typeId, organizationId },
      include: { _count: { select: { requests: true } } },
    });
    if (!type) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Leave type not found", HttpStatus.NOT_FOUND);
    }
    // Settings own birthday/optional leave: removing the type turns the setting off so it is not re-created.
    if (type.code === BIRTHDAY_CODE || type.code === OPTIONAL_CODE) {
      await this.settings.update("hrms", organizationId, actorUserId, {
        [type.code === BIRTHDAY_CODE ? "birthdayLeaveEnabled" : "optionalLeaveEnabled"]: false,
      });
    }
    if (type._count.requests > 0) {
      await this.prisma.hrmsLeaveType.update({ where: { id: typeId }, data: { isActive: false } });
    } else {
      await this.prisma.hrmsLeaveType.delete({ where: { id: typeId } });
    }
    await this.record("hrms.leave_type.removed", organizationId, actorUserId, typeId, "hrms_leave_type", {
      deactivated: type._count.requests > 0,
    });
    return { deactivated: type._count.requests > 0 };
  }

  // ---- Balances ----

  /** Users without an employee profile (e.g. the owner) still see the configured types, with nothing used. */
  async balances(organizationId: string, userId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({ where: { organizationId, userId, deletedAt: null }, select: { id: true } });
    return this.balancesForEmployee(organizationId, employee?.id ?? null);
  }

  /**
   * Leave accrues monthly: annualDays / 12 is credited on the 1st of each month, from the joining month and
   * only while the employee has not resigned (resignation date, or end date once inactive). Carry-forward
   * days are credited up front. Comp-off is earned per approved request, not accrued.
   */
  private async accruedMonths(employeeId: string | null, year: number, now = new Date()) {
    if (!employeeId) return 0;
    const employee = await this.prisma.hrmsEmployee.findUnique({
      where: { id: employeeId },
      select: { startDate: true, endDate: true, resignationDate: true, status: true },
    });
    if (!employee) return 0;
    const cutoff = employee.resignationDate ?? (employee.status === "ACTIVE" ? null : employee.endDate);
    const joinKey = employee.startDate ? employee.startDate.getUTCFullYear() * 12 + employee.startDate.getUTCMonth() : -Infinity;
    let months = 0;
    for (let month = 0; month < 12; month += 1) {
      const monthStart = new Date(Date.UTC(year, month, 1));
      if (monthStart > now || year * 12 + month < joinKey || (cutoff && monthStart > cutoff)) continue;
      months += 1;
    }
    return months;
  }

  private async balancesForEmployee(organizationId: string, employeeId: string | null, year = new Date().getUTCFullYear()) {
    const months = await this.accruedMonths(employeeId, year);
    const types = (await this.listTypes(organizationId)).filter((type) => type.isActive);
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
    const [requests, credits] = employeeId
      ? await Promise.all([
          this.prisma.hrmsLeaveRequest.findMany({
            where: { organizationId, employeeId, status: { in: ACTIVE_STATUSES }, leaveTypeId: { not: null } },
            select: { leaveTypeId: true, status: true, totalDays: true, startDate: true },
          }),
          this.prisma.hrmsCompOffRequest.aggregate({
            where: { organizationId, employeeId, status: "APPROVED" },
            _sum: { days: true },
          }),
        ])
      : [[], { _sum: { days: 0 } }];
    return types.map((type) => {
      const mine = requests.filter(
        (request) =>
          request.leaveTypeId === type.id && (type.isCompOff || (request.startDate >= yearStart && request.startDate < yearEnd)),
      );
      const sum = (statuses: LeaveStatus[]) =>
        mine.filter((request) => statuses.includes(request.status)).reduce((total, request) => total + request.totalDays, 0);
      const unlimited = !type.isCompOff && type.annualDays === 0;
      const entitled = type.isCompOff ? (credits._sum.days ?? 0) : FIXED_GRANT_CODES.includes(type.code)
          ? type.annualDays
          : Math.round(((type.annualDays * months) / 12 + type.carryForwardDays) * 100) / 100;
      const used = sum(["APPROVED"]);
      const pending = sum(OPEN_STATUSES);
      return {
        typeId: type.id,
        name: type.name,
        code: type.code,
        isPaid: type.isPaid,
        isCompOff: type.isCompOff,
        allowHalfDay: type.allowHalfDay,
        unlimited,
        entitled,
        annualDays: type.annualDays,
        accruedMonths: months,
        used,
        pending,
        available: unlimited ? null : Math.max(Math.round((entitled - used - pending) * 100) / 100, 0),
      };
    });
  }

  // ---- Leave requests ----

  async listMine(organizationId: string, userId: string) {
    const employee = await this.findEmployeeByUser(organizationId, userId);
    if (!employee) return [];
    return this.prisma.hrmsLeaveRequest.findMany({
      where: { organizationId, employeeId: employee.id },
      orderBy: { createdAt: "desc" },
      include: { type: { select: { id: true, name: true, code: true } } },
    });
  }

  /** All organization leave requests for HR review, newest first. */
  listAll(organizationId: string) {
    return this.prisma.hrmsLeaveRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { type: { select: { id: true, name: true, code: true } }, employee: requestEmployee },
    });
  }

  async apply(organizationId: string, actorUserId: string, input: ApplyHrmsLeaveDto, onBehalf: boolean) {
    const target = await this.resolveTarget(organizationId, actorUserId, input.employeeId, onBehalf);
    const type = await this.prisma.hrmsLeaveType.findFirst({ where: { id: input.leaveTypeId, organizationId, isActive: true } });
    if (!type) {
      throw bad("Choose an active leave type");
    }
    const start = parseDate(input.startDate);
    const end = parseDate(input.endDate);
    if (end < start) {
      throw bad("End date cannot be before start date");
    }
    const rangeDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
    if (input.totalDays > rangeDays) {
      throw bad("Total days cannot exceed the selected date range");
    }
    const policy = await resolveAppSettings(this.settings, "hrms", organizationId);
    const halfDayOk = policy.allowHalfDayLeave && type.allowHalfDay;
    if (!halfDayOk && !Number.isInteger(input.totalDays)) {
      throw settingsPolicyError("Half-day leave is not allowed for this leave type", HttpStatus.BAD_REQUEST);
    }
    if (policy.maxLeaveRequestDays !== null && input.totalDays > policy.maxLeaveRequestDays) {
      throw settingsPolicyError(`Leave requests are limited to ${policy.maxLeaveRequestDays} days`, HttpStatus.BAD_REQUEST);
    }
    const today = todayUtc();
    const noticeFloor = new Date(today.getTime() + policy.leaveMinNoticeDays * DAY_MS);
    if (policy.leaveMinNoticeDays > 0 && start < noticeFloor && start >= today) {
      throw settingsPolicyError(`Leave needs at least ${policy.leaveMinNoticeDays} day(s) notice`, HttpStatus.BAD_REQUEST);
    }
    if (start < today && policy.leaveBackdateLimitDays !== null) {
      const earliest = new Date(today.getTime() - policy.leaveBackdateLimitDays * DAY_MS);
      if (start < earliest) {
        throw settingsPolicyError(`Leave can be back-dated by at most ${policy.leaveBackdateLimitDays} day(s)`, HttpStatus.BAD_REQUEST);
      }
    }
    const overlap = await this.prisma.hrmsLeaveRequest.findFirst({
      where: { organizationId, employeeId: target.id, status: { in: ACTIVE_STATUSES }, startDate: { lte: end }, endDate: { gte: start } },
      select: { id: true },
    });
    if (overlap) {
      throw bad("You already have a leave request overlapping these dates", HttpStatus.CONFLICT);
    }
    if (type.code === BIRTHDAY_CODE) {
      const profile = await this.prisma.hrmsEmployee.findUnique({ where: { id: target.id }, select: { user: { select: { hrmsProfile: { select: { dateOfBirth: true } } } } } });
      const birth = profile?.user.hrmsProfile?.dateOfBirth;
      if (!birth) {
        throw bad("Add your date of birth to your profile to use birthday leave");
      }
      if (start.getUTCMonth() !== birth.getUTCMonth() || end.getUTCMonth() !== birth.getUTCMonth()) {
        throw bad("Birthday leave must fall within your birth month");
      }
    }
    const balance = (await this.balancesForEmployee(organizationId, target.id, start.getUTCFullYear())).find(
      (entry) => entry.typeId === type.id,
    );
    if (balance && balance.available !== null && input.totalDays > balance.available) {
      throw bad(`Only ${balance.available} day(s) of ${type.name} are available`);
    }
    let attachment: { id: string; originalName: string; sizeBytes: number } | null = null;
    if (input.attachmentFileId) {
      attachment = await this.prisma.storedFile.findFirst({
        where: { id: input.attachmentFileId, organizationId, uploadedById: actorUserId, deletedAt: null },
        select: { id: true, originalName: true, sizeBytes: true },
      });
      if (attachment && attachment.sizeBytes > ATTACHMENT_MAX_BYTES) {
        throw bad("Attachments must be 2 MB or smaller");
      }
      if (!attachment) {
        throw bad("The attached file was not found; upload it again");
      }
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const leave = await tx.hrmsLeaveRequest.create({
        data: {
          organizationId,
          employeeId: target.id,
          leaveType: type.category,
          leaveTypeId: type.id,
          startDate: start,
          endDate: end,
          totalDays: input.totalDays,
          reason: clean(input.reason),
          requestedByUserId: actorUserId,
          attachmentFileId: attachment?.id ?? null,
          attachmentName: attachment?.originalName ?? null,
        },
        include: { type: { select: { id: true, name: true, code: true } } },
      });
      await this.notifyReviewers(tx, organizationId, actorUserId, leave.id, "A leave request needs review");
      return leave;
    });
    await this.record("hrms.leave.created", organizationId, actorUserId, record.id, "hrms_leave_request", {
      employeeId: target.id,
      onBehalf,
    });
    return record;
  }

  /** The owner withdraws a request that is still open, or an approved one that has not started. */
  async cancel(organizationId: string, actorUserId: string, leaveId: string) {
    const leave = await this.prisma.hrmsLeaveRequest.findFirst({
      where: { id: leaveId, organizationId },
      include: { employee: { select: { userId: true } } },
    });
    if (!leave) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Leave request not found", HttpStatus.NOT_FOUND);
    }
    this.assertOwner(leave.employee.userId, actorUserId);
    const cancellable = OPEN_STATUSES.includes(leave.status) || (leave.status === "APPROVED" && leave.startDate > todayUtc());
    if (!cancellable) {
      throw bad("This request can no longer be cancelled", HttpStatus.CONFLICT);
    }
    const record = await this.prisma.hrmsLeaveRequest.update({ where: { id: leaveId }, data: { status: "CANCELLED" } });
    await this.record("hrms.leave.cancelled", organizationId, actorUserId, leaveId, "hrms_leave_request", {});
    return record;
  }

  async decideLeave(organizationId: string, actorUserId: string, leaveId: string, status: "APPROVED" | "REJECTED", reason?: string) {
    const leave = await this.prisma.hrmsLeaveRequest.findFirst({
      where: { id: leaveId, organizationId },
      include: { employee: { select: { userId: true } } },
    });
    if (!leave) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Leave request not found", HttpStatus.NOT_FOUND);
    }
    this.assertOpen(leave.status);
    if (status === "REJECTED" && !clean(reason)) {
      throw bad("A reason is required to reject a request");
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.hrmsLeaveRequest.update({
        where: { id: leaveId },
        data:
          status === "APPROVED"
            ? { status, approvedByUserId: actorUserId, approvedAt: new Date(), rejectedByUserId: null, rejectedAt: null, rejectionReason: null }
            : { status, rejectedByUserId: actorUserId, rejectedAt: new Date(), rejectionReason: clean(reason) },
      });
      await this.notifyUser(tx, organizationId, actorUserId, leaveId, leave.employee.userId, `Your leave request was ${status.toLowerCase()}`);
      return updated;
    });
    await this.record("hrms.leave.status_updated", organizationId, actorUserId, leaveId, "hrms_leave_request", { status });
    return record;
  }

  async requestLeaveInfo(organizationId: string, actorUserId: string, leaveId: string, note: string) {
    const leave = await this.prisma.hrmsLeaveRequest.findFirst({
      where: { id: leaveId, organizationId },
      include: { employee: { select: { userId: true } } },
    });
    if (!leave) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Leave request not found", HttpStatus.NOT_FOUND);
    }
    this.assertOpen(leave.status);
    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.hrmsLeaveRequest.update({
        where: { id: leaveId },
        data: { status: "NEEDS_INFO", moreInfoNote: note.trim(), moreInfoRequestedByUserId: actorUserId, moreInfoRequestedAt: new Date(), moreInfoReply: null },
      });
      await this.notifyUser(tx, organizationId, actorUserId, leaveId, leave.employee.userId, "More information was requested on your leave");
      return updated;
    });
    await this.record("hrms.leave.info_requested", organizationId, actorUserId, leaveId, "hrms_leave_request", {});
    return record;
  }

  async replyLeaveInfo(organizationId: string, actorUserId: string, leaveId: string, reply: string) {
    const leave = await this.prisma.hrmsLeaveRequest.findFirst({
      where: { id: leaveId, organizationId },
      include: { employee: { select: { userId: true } } },
    });
    if (!leave) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Leave request not found", HttpStatus.NOT_FOUND);
    }
    this.assertOwner(leave.employee.userId, actorUserId, leave.requestedByUserId);
    if (leave.status !== "NEEDS_INFO") {
      throw bad("No information is being requested for this leave", HttpStatus.CONFLICT);
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.hrmsLeaveRequest.update({ where: { id: leaveId }, data: { status: "PENDING", moreInfoReply: reply.trim() } });
      await this.notifyReviewers(tx, organizationId, actorUserId, leaveId, "A leave request has new information");
      return updated;
    });
    await this.record("hrms.leave.info_replied", organizationId, actorUserId, leaveId, "hrms_leave_request", {});
    return record;
  }

  /** Approved leave overlapping the window, for the Team calendar (names only, no reasons). */
  teamLeave(organizationId: string, from: string, to: string) {
    return this.prisma.hrmsLeaveRequest.findMany({
      where: { organizationId, status: "APPROVED", startDate: { lte: parseDate(to) }, endDate: { gte: parseDate(from) } },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        type: { select: { name: true, code: true } },
        employee: { select: { id: true, user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    });
  }

  // ---- Comp-off ----

  async listMyCompOff(organizationId: string, userId: string) {
    const employee = await this.findEmployeeByUser(organizationId, userId);
    if (!employee) return [];
    return this.prisma.hrmsCompOffRequest.findMany({ where: { organizationId, employeeId: employee.id }, orderBy: { createdAt: "desc" } });
  }

  listAllCompOff(organizationId: string) {
    return this.prisma.hrmsCompOffRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { employee: requestEmployee },
    });
  }

  async applyCompOff(organizationId: string, actorUserId: string, input: ApplyHrmsCompOffDto, onBehalf: boolean) {
    const target = await this.resolveTarget(organizationId, actorUserId, input.employeeId, onBehalf);
    const workedDate = parseDate(input.workedDate);
    const lastDate = input.workedEndDate ? parseDate(input.workedEndDate) : workedDate;
    if (lastDate > todayUtc()) {
      throw bad("Comp-off can only be requested for days already worked");
    }
    if (lastDate < workedDate) {
      throw bad("End date cannot be before start date");
    }
    const spanDays = Math.round((lastDate.getTime() - workedDate.getTime()) / 86_400_000) + 1;
    if (spanDays > 31) {
      throw bad("A comp-off request can cover at most 31 days");
    }
    if (!Number.isInteger(input.days * 2) || input.days > spanDays) {
      throw bad("Comp-off days must be in half-day steps and at most the number of days worked");
    }
    const duplicate = await this.prisma.hrmsCompOffRequest.findFirst({
      where: {
        organizationId,
        employeeId: target.id,
        status: { in: ACTIVE_STATUSES },
        workedDate: { lte: lastDate },
        OR: [{ workedEndDate: null, workedDate: { gte: workedDate } }, { workedEndDate: { gte: workedDate } }],
      },
      select: { id: true },
    });
    if (duplicate) {
      throw bad("A comp-off request already exists for this date", HttpStatus.CONFLICT);
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.hrmsCompOffRequest.create({
        data: { organizationId, employeeId: target.id, workedDate, workedEndDate: input.workedEndDate ? lastDate : null, days: input.days, reason: clean(input.reason), requestedByUserId: actorUserId },
      });
      await this.notifyReviewers(tx, organizationId, actorUserId, created.id, "A comp-off request needs review");
      return created;
    });
    await this.record("hrms.comp_off.created", organizationId, actorUserId, record.id, "hrms_comp_off_request", { employeeId: target.id, onBehalf });
    return record;
  }

  async cancelCompOff(organizationId: string, actorUserId: string, id: string) {
    const request = await this.requireCompOff(organizationId, id);
    this.assertOwner(request.employee.userId, actorUserId);
    if (!OPEN_STATUSES.includes(request.status)) {
      throw bad("Only open comp-off requests can be cancelled", HttpStatus.CONFLICT);
    }
    return this.prisma.hrmsCompOffRequest.update({ where: { id }, data: { status: "CANCELLED" } });
  }

  async decideCompOff(organizationId: string, actorUserId: string, id: string, status: "APPROVED" | "REJECTED", reason?: string) {
    const request = await this.requireCompOff(organizationId, id);
    this.assertOpen(request.status);
    if (status === "REJECTED" && !clean(reason)) {
      throw bad("A reason is required to reject a request");
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.hrmsCompOffRequest.update({
        where: { id },
        data: { status, decidedByUserId: actorUserId, decidedAt: new Date(), decisionReason: clean(reason) },
      });
      await this.notifyUser(tx, organizationId, actorUserId, id, request.employee.userId, `Your comp-off request was ${status.toLowerCase()}`);
      return updated;
    });
    await this.record("hrms.comp_off.status_updated", organizationId, actorUserId, id, "hrms_comp_off_request", { status });
    return record;
  }

  async requestCompOffInfo(organizationId: string, actorUserId: string, id: string, note: string) {
    const request = await this.requireCompOff(organizationId, id);
    this.assertOpen(request.status);
    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.hrmsCompOffRequest.update({
        where: { id },
        data: { status: "NEEDS_INFO", moreInfoNote: note.trim(), moreInfoRequestedByUserId: actorUserId, moreInfoRequestedAt: new Date(), moreInfoReply: null },
      });
      await this.notifyUser(tx, organizationId, actorUserId, id, request.employee.userId, "More information was requested on your comp-off");
      return updated;
    });
    await this.record("hrms.comp_off.info_requested", organizationId, actorUserId, id, "hrms_comp_off_request", {});
    return record;
  }

  async replyCompOffInfo(organizationId: string, actorUserId: string, id: string, reply: string) {
    const request = await this.requireCompOff(organizationId, id);
    this.assertOwner(request.employee.userId, actorUserId, request.requestedByUserId);
    if (request.status !== "NEEDS_INFO") {
      throw bad("No information is being requested for this comp-off", HttpStatus.CONFLICT);
    }
    const record = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.hrmsCompOffRequest.update({ where: { id }, data: { status: "PENDING", moreInfoReply: reply.trim() } });
      await this.notifyReviewers(tx, organizationId, actorUserId, id, "A comp-off request has new information");
      return updated;
    });
    await this.record("hrms.comp_off.info_replied", organizationId, actorUserId, id, "hrms_comp_off_request", {});
    return record;
  }

  // ---- Helpers ----

  private async requireCompOff(organizationId: string, id: string) {
    const request = await this.prisma.hrmsCompOffRequest.findFirst({
      where: { id, organizationId },
      include: { employee: { select: { userId: true } } },
    });
    if (!request) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Comp-off request not found", HttpStatus.NOT_FOUND);
    }
    return request;
  }

  private findEmployeeByUser(organizationId: string, userId: string) {
    return this.prisma.hrmsEmployee.findFirst({ where: { organizationId, userId, deletedAt: null }, select: { id: true, userId: true } });
  }

  private async requireEmployeeByUser(organizationId: string, userId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({ where: { organizationId, userId, deletedAt: null }, select: { id: true, userId: true } });
    if (!employee) {
      throw bad("You do not have an employee profile in this organization", HttpStatus.FORBIDDEN);
    }
    return employee;
  }

  /** Self by default; another employee only on the on-behalf route and only when the organization enabled it. */
  private async resolveTarget(organizationId: string, actorUserId: string, employeeId: string | undefined, onBehalf: boolean) {
    const self = await this.prisma.hrmsEmployee.findFirst({ where: { organizationId, userId: actorUserId, deletedAt: null }, select: { id: true } });
    if (!onBehalf || !employeeId || employeeId === self?.id) {
      if (!self) {
        throw bad("You do not have an employee profile in this organization", HttpStatus.FORBIDDEN);
      }
      return self;
    }
    const policy = await resolveAppSettings(this.settings, "hrms", organizationId);
    if (!policy.leaveOnBehalfEnabled) {
      throw settingsPolicyError("Applying on behalf of others is disabled in HRMS settings");
    }
    const target = await this.prisma.hrmsEmployee.findFirst({ where: { id: employeeId, organizationId, deletedAt: null }, select: { id: true } });
    if (!target) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found", HttpStatus.NOT_FOUND);
    }
    return target;
  }

  private assertOwner(ownerUserId: string, actorUserId: string, requestedByUserId?: string | null) {
    if (ownerUserId !== actorUserId && requestedByUserId !== actorUserId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the requester can do this", HttpStatus.FORBIDDEN);
    }
  }

  private assertOpen(status: LeaveStatus) {
    if (!OPEN_STATUSES.includes(status)) {
      throw bad("This request has already been decided", HttpStatus.CONFLICT);
    }
  }

  private async notifyReviewers(tx: Prisma.TransactionClient, organizationId: string, actorId: string, sourceId: string, title: string) {
    const reviewers = await tx.organizationMember.findMany({
      where: { organizationId, status: "ACTIVE", deletedAt: null, isOwner: true },
      select: { userId: true },
    });
    await enqueueNotification(tx, {
      organizationId,
      actorId,
      sourceType: "hrms",
      sourceId,
      type: "HRMS_LEAVE_REQUEST",
      recipientIds: reviewers.map((member) => member.userId),
      title,
      path: "home",
    });
  }

  private notifyUser(tx: Prisma.TransactionClient, organizationId: string, actorId: string, sourceId: string, userId: string, title: string) {
    return enqueueNotification(tx, { organizationId, actorId, sourceType: "hrms", sourceId, type: "HRMS_LEAVE_DECISION", recipientIds: [userId], title, path: "home" });
  }

  private record(action: string, organizationId: string, actorUserId: string, resourceId: string, resourceType: string, metadata: Record<string, unknown>) {
    return this.audit.record({ action, organizationId, actorUserId, resourceType, resourceId, metadata: metadata as Prisma.InputJsonValue });
  }
}
