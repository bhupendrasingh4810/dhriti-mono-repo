import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../common/decorators/organization.decorator";
import { RequireAccess } from "../../common/decorators/access.decorator";
import { AccessGuard } from "../../common/guards/access.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { PulseService, type SchedulingConflict } from "./pulse.service";
import { CreateCalendarDto, UpdateCalendarDto } from "./dto/calendar.dto";
import {
  AddAttendeeDto,
  CreateEventDto,
  CreateEventRequestDto,
  CreateMeetingDto,
  ListEventsQueryDto,
  RsvpDto,
  UpdateEventDto,
} from "./dto/event.dto";

@ApiTags("pulse")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/pulse")
export class PulseController {
  constructor(private readonly pulse: PulseService) {}

  // ---------------- Calendars ----------------

  @Get("calendars")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.read" })
  @ApiOperation({ summary: "List calendars in the active organization" })
  async listCalendars(@CurrentOrganization() organization: OrganizationContext) {
    return this.pulse.listCalendars(organization.organizationId);
  }

  @Post("calendars")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.create" })
  @ApiOperation({ summary: "Create a calendar; marking default clears other defaults" })
  async createCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateCalendarDto,
  ) {
    return this.pulse.createCalendar(organization.organizationId, user.userId, dto);
  }

  @Patch("calendars/:calendarId")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.update" })
  @ApiOperation({ summary: "Update a calendar" })
  async updateCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("calendarId") calendarId: string,
    @Body() dto: UpdateCalendarDto,
  ) {
    return this.pulse.updateCalendar(organization.organizationId, calendarId, user.userId, dto);
  }

  @Delete("calendars/:calendarId")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a calendar and its events (owner only)" })
  async deleteCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("calendarId") calendarId: string,
  ): Promise<void> {
    return this.pulse.deleteCalendar(organization.organizationId, calendarId, user.userId);
  }

  // ---------------- Events ----------------

  @Get("events")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.read" })
  @ApiOperation({ summary: "List events overlapping a time range (from/to ISO 8601)" })
  async listEvents(@CurrentOrganization() organization: OrganizationContext, @Query() query: ListEventsQueryDto) {
    return this.pulse.listEvents(organization.organizationId, query);
  }

  @Get("schedule")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.read" })
  @ApiOperation({ summary: "List Pulse events with organization holidays, birthdays, and approved leaves" })
  async getSchedule(@CurrentOrganization() organization: OrganizationContext, @Query() query: ListEventsQueryDto) {
    return this.pulse.getSchedule(organization.organizationId, query);
  }

  @Post("events")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.create" })
  @ApiOperation({ summary: "Create a persisted Pulse event" })
  async createEventForCalendar(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateEventRequestDto,
  ) {
    return this.pulse.createEvent(organization.organizationId, dto.calendarId, user.userId, dto);
  }

  @Post("meetings")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.create" })
  @ApiOperation({ summary: "Create a meeting and its private Connect conversation" })
  async createMeeting(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateMeetingDto,
  ) {
    return this.pulse.createMeeting(organization.organizationId, dto.calendarId, user.userId, dto);
  }

  @Post("calendars/:calendarId/events")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.create" })
  @ApiOperation({ summary: "Create an event; creator becomes organizer (accepted), others pending" })
  async createEvent(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("calendarId") calendarId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.pulse.createEvent(organization.organizationId, calendarId, user.userId, dto);
  }

  @Get("events/:eventId")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.read" })
  @ApiOperation({ summary: "Get an event with attendees" })
  async getEvent(@CurrentOrganization() organization: OrganizationContext, @Param("eventId") eventId: string) {
    return this.pulse.getEvent(organization.organizationId, eventId);
  }

  @Patch("events/:eventId")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.update" })
  @ApiOperation({ summary: "Update an event (organizer only)" })
  async updateEvent(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.pulse.updateEvent(organization.organizationId, eventId, user.userId, dto);
  }

  @Delete("events/:eventId")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an event (organizer only)" })
  async deleteEvent(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("eventId") eventId: string,
  ): Promise<void> {
    return this.pulse.deleteEvent(organization.organizationId, eventId, user.userId);
  }

  @Post("events/:eventId/cancel")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.update" })
  @ApiOperation({ summary: "Cancel an event or meeting; cancelled items remain visible in the schedule" })
  async cancelEvent(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("eventId") eventId: string,
  ) {
    return this.pulse.cancelEvent(organization.organizationId, eventId, user.userId);
  }

  // ---------------- RSVP & attendees ----------------

  @Post("events/:eventId/rsvp")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.read" })
  @ApiOperation({ summary: "Respond to an event invitation (accepted/declined/tentative)" })
  async rsvp(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("eventId") eventId: string,
    @Body() dto: RsvpDto,
  ) {
    return this.pulse.rsvp(organization.organizationId, eventId, user.userId, dto.status, dto.declineReason);
  }

  @Post("events/:eventId/attendees")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Add an attendee (organizer only)" })
  async addAttendee(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("eventId") eventId: string,
    @Body() dto: AddAttendeeDto,
  ): Promise<void> {
    return this.pulse.addAttendee(organization.organizationId, eventId, user.userId, dto.userId);
  }

  @Delete("events/:eventId/attendees/:userId")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove an attendee (organizer only)" })
  async removeAttendee(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("eventId") eventId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.pulse.removeAttendee(organization.organizationId, eventId, user.userId, userId);
  }

  // ---------------- Scheduling ----------------

  @Get("events/conflicts")
  @RequireAccess({ entitlement: "pulse.enabled", permission: "pulse.calendar.read" })
  @ApiOperation({ summary: "Find events that conflict for the current user in a time range" })
  async findConflicts(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("excludeEventId") excludeEventId?: string,
  ): Promise<SchedulingConflict[]> {
    return this.pulse.findConflicts(organization.organizationId, user.userId, from, to, excludeEventId);
  }
}
