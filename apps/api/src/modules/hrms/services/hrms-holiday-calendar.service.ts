import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class HrmsHolidayCalendarService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(organizationId: string) {
    return this.prisma.holidayCalendar.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
  }

  async create(organizationId: string, actorUserId: string, input: { name: string; countryCode?: string; region?: string; holidays: Record<string, unknown>[] }) {
    const calendar = await this.prisma.holidayCalendar.create({
      data: { organizationId, name: input.name.trim(), countryCode: this.clean(input.countryCode), region: this.clean(input.region), holidays: input.holidays as Prisma.InputJsonValue },
    }).catch(() => { throw new AppError(ErrorCode.VALIDATION_FAILED, "Holiday calendar name already exists in this organization", HttpStatus.CONFLICT); });
    await this.audit.record({ action: "hrms.holiday_calendar.created", organizationId, actorUserId, resourceType: "HolidayCalendar", resourceId: calendar.id });
    return calendar;
  }

  async update(organizationId: string, calendarId: string, actorUserId: string, input: { name?: string; countryCode?: string; region?: string; holidays?: Record<string, unknown>[] }) {
    await this.requireCalendar(organizationId, calendarId);
    const calendar = await this.prisma.holidayCalendar.update({
      where: { id: calendarId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.countryCode !== undefined ? { countryCode: this.clean(input.countryCode) } : {}),
        ...(input.region !== undefined ? { region: this.clean(input.region) } : {}),
        ...(input.holidays !== undefined ? { holidays: input.holidays as Prisma.InputJsonValue } : {}),
      },
    });
    await this.audit.record({ action: "hrms.holiday_calendar.updated", organizationId, actorUserId, resourceType: "HolidayCalendar", resourceId: calendar.id });
    return calendar;
  }

  async remove(organizationId: string, calendarId: string, actorUserId: string): Promise<void> {
    await this.requireCalendar(organizationId, calendarId);
    await this.prisma.holidayCalendar.delete({ where: { id: calendarId } });
    await this.audit.record({ action: "hrms.holiday_calendar.deleted", organizationId, actorUserId, resourceType: "HolidayCalendar", resourceId: calendarId });
  }

  private async requireCalendar(organizationId: string, calendarId: string): Promise<void> {
    const calendar = await this.prisma.holidayCalendar.findFirst({ where: { id: calendarId, organizationId }, select: { id: true } });
    if (!calendar) {throw new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, "Holiday calendar not found", HttpStatus.NOT_FOUND);}
  }

  private clean(value: string | undefined): string | null {
    return value?.trim() || null;
  }
}