import { HttpStatus, Injectable, Logger } from "@nestjs/common";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { EmailService } from "../../notification/email.service";
import type { ImportHrmsHolidaysDto, SendHrmsHolidayListDto, UpsertHrmsHolidayDto } from "../dto/hrms-holiday.dto";

type HolidayRow = { date: Date; name: string; isHalfDay: boolean; workLocationId: string | null; updatedAt: Date; workLocation?: { name: string } | null };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
const SEND_BATCH = 10;
const withLocation = { workLocation: { select: { id: true, name: true } } } as const;

const parseDate = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(ErrorCode.VALIDATION_FAILED, "Invalid holiday date", HttpStatus.BAD_REQUEST);
  }
  return date;
};

/**
 * Organization holidays and the "send holiday list" email broadcast.
 * A holiday with a null workLocationId applies to everyone; otherwise only to employees at that location. At most one
 * holiday exists per (date, location). Pulse and the Home widget read the same rows, so edits here update every product.
 * A broadcast is recorded per send; an ALL, full-list broadcast for a year drives the "sent to all" badge, and the
 * latest broadcast of any kind is the baseline for "send only changes" (holidays updated after it).
 */
@Injectable()
export class HrmsHolidayService {
  private readonly logger = new Logger(HrmsHolidayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  private yearRange(year: number) {
    return { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
  }

  list(organizationId: string, year: number) {
    return this.prisma.hrmsHoliday.findMany({
      where: { organizationId, date: this.yearRange(year) },
      include: withLocation,
      orderBy: [{ date: "asc" }, { name: "asc" }],
    });
  }

  /** Holidays the signed-in employee observes (org-wide plus their work location) from today onward. */
  async upcomingForUser(organizationId: string, userId: string, limit = 5) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { workLocationId: true },
    });
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    return this.prisma.hrmsHoliday.findMany({
      where: {
        organizationId,
        date: { gte: today },
        OR: [{ workLocationId: null }, ...(employee?.workLocationId ? [{ workLocationId: employee.workLocationId }] : [])],
      },
      include: withLocation,
      orderBy: { date: "asc" },
      take: limit,
    });
  }

  private async assertLocation(organizationId: string, workLocationId: string | null | undefined) {
    if (!workLocationId) {return null;}
    const location = await this.prisma.hrmsLocation.findFirst({ where: { id: workLocationId, organizationId }, select: { id: true } });
    if (!location) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Unknown work location", HttpStatus.BAD_REQUEST);}
    return location.id;
  }

  /** Creates a holiday, or updates it when `id` is given; rejects a second holiday for the same date and location. */
  async upsert(organizationId: string, actorUserId: string, input: UpsertHrmsHolidayDto) {
    const date = parseDate(input.date);
    const workLocationId = await this.assertLocation(organizationId, input.workLocationId);
    const clash = await this.prisma.hrmsHoliday.findFirst({
      where: { organizationId, date, workLocationId, ...(input.id ? { id: { not: input.id } } : {}) },
      select: { id: true },
    });
    if (clash) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "A holiday already exists for this date and location", HttpStatus.CONFLICT);
    }
    const data = {
      date,
      workLocationId,
      name: input.name.trim(),
      isHalfDay: input.isHalfDay ?? false,
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    };
    let holiday;
    if (input.id) {
      const updated = await this.prisma.hrmsHoliday.updateMany({ where: { id: input.id, organizationId }, data });
      if (updated.count === 0) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Holiday not found", HttpStatus.NOT_FOUND);}
      holiday = await this.prisma.hrmsHoliday.findUniqueOrThrow({ where: { id: input.id }, include: withLocation });
    } else {
      holiday = await this.prisma.hrmsHoliday.create({ data: { organizationId, ...data }, include: withLocation });
    }
    await this.audit.record({
      action: "hrms.holiday.saved",
      organizationId,
      actorUserId,
      resourceType: "HrmsHoliday",
      resourceId: holiday.id,
      metadata: { date: input.date },
    });
    return holiday;
  }

  /** Bulk create/update from a CSV/ICS file parsed by the client; locations are matched by name (blank = all). */
  async importHolidays(organizationId: string, actorUserId: string, input: ImportHrmsHolidaysDto) {
    const locations = await this.prisma.hrmsLocation.findMany({ where: { organizationId }, select: { id: true, name: true } });
    const byName = new Map(locations.map((location) => [location.name.trim().toLowerCase(), location.id]));
    let created = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];

    for (const [index, item] of input.items.entries()) {
      try {
        const date = parseDate(item.date);
        const locationName = item.locationName?.trim();
        const workLocationId = locationName ? byName.get(locationName.toLowerCase()) : null;
        if (locationName && !workLocationId) {throw new Error(`Unknown location "${locationName}"`);}
        const existing = await this.prisma.hrmsHoliday.findFirst({ where: { organizationId, date, workLocationId: workLocationId ?? null }, select: { id: true } });
        const data = { name: item.name.trim(), isHalfDay: item.isHalfDay ?? false };
        if (existing) {
          await this.prisma.hrmsHoliday.update({ where: { id: existing.id }, data });
          updated += 1;
        } else {
          await this.prisma.hrmsHoliday.create({ data: { organizationId, date, workLocationId: workLocationId ?? null, ...data } });
          created += 1;
        }
      } catch (error) {
        errors.push({ row: index + 1, message: error instanceof Error ? error.message : "Invalid row" });
      }
    }
    await this.audit.record({
      action: "hrms.holiday.imported",
      organizationId,
      actorUserId,
      resourceType: "HrmsHoliday",
      metadata: { created, updated, failed: errors.length },
    });
    return { created, updated, errors };
  }

  async remove(organizationId: string, holidayId: string, actorUserId: string): Promise<void> {
    const removed = await this.prisma.hrmsHoliday.deleteMany({ where: { id: holidayId, organizationId } });
    if (removed.count === 0) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Holiday not found", HttpStatus.NOT_FOUND);
    }
    await this.audit.record({
      action: "hrms.holiday.deleted",
      organizationId,
      actorUserId,
      resourceType: "HrmsHoliday",
      resourceId: holidayId,
    });
  }

  /** Send history for a year, newest first, with the sender's name. */
  async listBroadcasts(organizationId: string, year: number) {
    const rows = await this.prisma.hrmsHolidayBroadcast.findMany({
      where: { organizationId, year },
      orderBy: { sentAt: "desc" },
      take: 50,
    });
    const senderIds = [...new Set(rows.map((row) => row.sentByUserId).filter((id): id is string => Boolean(id)))];
    const senders = senderIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, name: true } })
      : [];
    const names = new Map(senders.map((sender) => [sender.id, sender.name]));
    return rows.map((row) => ({ ...row, sentBy: row.sentByUserId ? (names.get(row.sentByUserId) ?? null) : null }));
  }

  /** Holidays that would be emailed: the full year, or only rows changed since the latest send. */
  private async holidaysToSend(organizationId: string, input: SendHrmsHolidayListDto) {
    const all = await this.list(organizationId, input.year);
    if (!input.changesOnly) {
      if (all.length === 0) {throw new AppError(ErrorCode.VALIDATION_FAILED, `No holidays are defined for ${input.year}`, HttpStatus.BAD_REQUEST);}
      return all;
    }
    const last = await this.prisma.hrmsHolidayBroadcast.findFirst({
      where: { organizationId, year: input.year },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    });
    const changed = last ? all.filter((holiday) => holiday.updatedAt > last.sentAt) : all;
    if (changed.length === 0) {throw new AppError(ErrorCode.VALIDATION_FAILED, "No holidays have changed since the last send", HttpStatus.BAD_REQUEST);}
    return changed;
  }

  /** Renders the email exactly as a recipient without a location restriction would see it. */
  async preview(organizationId: string, input: SendHrmsHolidayListDto) {
    const holidays = await this.holidaysToSend(organizationId, input);
    const orgName = await this.orgName(organizationId);
    return { subject: this.subject(orgName, input), html: this.renderHtml("Employee", orgName, input, holidays), holidayCount: holidays.length };
  }

  /** Emails each recipient the holidays that apply to their location and records the send. */
  async send(organizationId: string, actorUserId: string, input: SendHrmsHolidayListDto) {
    const holidays = await this.holidaysToSend(organizationId, input);
    const employees = await this.prisma.hrmsEmployee.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: "ACTIVE",
        ...(input.employeeIds?.length ? { id: { in: input.employeeIds } } : {}),
      },
      select: { workLocationId: true, user: { select: { email: true, name: true } } },
    });
    const recipients = employees
      .filter((employee) => employee.user.email)
      .map((employee) => ({
        user: employee.user,
        holidays: holidays.filter((holiday) => !holiday.workLocationId || holiday.workLocationId === employee.workLocationId),
      }))
      .filter((recipient) => recipient.holidays.length > 0);
    if (recipients.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "No eligible recipients found", HttpStatus.BAD_REQUEST);
    }
    const orgName = await this.orgName(organizationId);

    let failed = 0;
    for (let index = 0; index < recipients.length; index += SEND_BATCH) {
      const results = await Promise.allSettled(
        recipients.slice(index, index + SEND_BATCH).map(({ user, holidays: own }) =>
          this.email.send({
            to: [{ email: user.email }],
            subject: this.subject(orgName, input),
            text: this.renderText(user.name, orgName, input, own),
            html: this.renderHtml(user.name, orgName, input, own),
          }),
        ),
      );
      failed += results.filter((result) => result.status === "rejected").length;
    }
    if (failed) {this.logger.warn(`Holiday list ${input.year}: ${failed}/${recipients.length} emails failed`);}

    const audience = input.employeeIds?.length ? "SELECTED" : "ALL";
    const broadcast = await this.prisma.hrmsHolidayBroadcast.create({
      data: {
        organizationId,
        year: input.year,
        audience,
        recipientCount: recipients.length - failed,
        failedCount: failed,
        changesOnly: Boolean(input.changesOnly),
        holidayCount: holidays.length,
        sentByUserId: actorUserId,
      },
    });
    await this.audit.record({
      action: "hrms.holiday.list_sent",
      organizationId,
      actorUserId,
      resourceType: "HrmsHolidayBroadcast",
      resourceId: broadcast.id,
      metadata: { year: input.year, audience, recipients: recipients.length, failed, changesOnly: Boolean(input.changesOnly) },
    });
    return broadcast;
  }

  private async orgName(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
    return organization?.name ?? "Your organization";
  }

  private subject(orgName: string, input: SendHrmsHolidayListDto) {
    return `${orgName} holiday list ${input.year}${input.changesOnly ? " (updates)" : ""}`;
  }

  private intro(orgName: string, input: SendHrmsHolidayListDto) {
    return (
      input.message?.trim() ||
      (input.changesOnly ? `These ${orgName} holidays for ${input.year} were added or changed.` : `Here is the ${orgName} holiday list for ${input.year}.`)
    );
  }

  private line(holiday: HolidayRow) {
    const date = holiday.date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
    const location = holiday.workLocation ? ` [${holiday.workLocation.name}]` : "";
    return { date, label: `${holiday.name}${holiday.isHalfDay ? " (half day)" : ""}${location}` };
  }

  private renderText(name: string, orgName: string, input: SendHrmsHolidayListDto, holidays: HolidayRow[]) {
    const lines = holidays.map((holiday) => {
      const { date, label } = this.line(holiday);
      return `- ${date}: ${label}`;
    });
    return [`Hi ${name},`, "", this.intro(orgName, input), "", ...lines].join("\n");
  }

  private renderHtml(name: string, orgName: string, input: SendHrmsHolidayListDto, holidays: HolidayRow[]) {
    const rows = holidays
      .map((holiday) => {
        const { date, label } = this.line(holiday);
        return `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(date)}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${escapeHtml(label)}</td></tr>`;
      })
      .join("");
    return `<div style="font-family:Arial,sans-serif;color:#111827"><p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(this.intro(orgName, input))}</p><table style="border-collapse:collapse;font-size:14px">${rows}</table></div>`;
  }
}
