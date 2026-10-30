import { HttpStatus, Injectable } from "@nestjs/common";
import type {
  AtlasOrganizationSettings,
  CadenceOrganizationSettings,
  ConnectOrganizationSettings,
  ConnectUserSettings,
  FlowOrganizationSettings,
  HrmsOrganizationSettings,
  NexusOrganizationSettings,
  NotesOrganizationSettings,
  PulseOrganizationSettings,
  Prisma,
} from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { NULLABLE_SETTINGS_FIELDS, type UpdateConnectUserSettingsDto } from "./dto/app-settings.dto";
import { enqueueNotification } from "../notification/notification-events";

export const APP_SETTINGS_KEYS = ["connect", "flow", "atlas", "nexus", "cadence", "pulse", "notes", "hrms"] as const;
export type AppSettingsKey = (typeof APP_SETTINGS_KEYS)[number];

export interface AppSettingsMap {
  connect: ConnectOrganizationSettings;
  flow: FlowOrganizationSettings;
  atlas: AtlasOrganizationSettings;
  nexus: NexusOrganizationSettings;
  cadence: CadenceOrganizationSettings;
  pulse: PulseOrganizationSettings;
  notes: NotesOrganizationSettings;
  hrms: HrmsOrganizationSettings;
}

interface SettingsDelegate {
  upsert(args: {
    where: { organizationId: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<unknown>;
  findUnique(args: { where: { organizationId: string } }): Promise<unknown>;
}

@Injectable()
export class AppSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  isAppKey(value: string): value is AppSettingsKey {
    return (APP_SETTINGS_KEYS as readonly string[]).includes(value);
  }

  /** Returns the organization's settings for an app, creating the default row on first read. */
  async get<K extends AppSettingsKey>(app: K, organizationId: string): Promise<AppSettingsMap[K]> {
    const delegate = this.delegate(app);
    let value: unknown;
    try {
      value = await delegate.upsert({ where: { organizationId }, create: { organizationId }, update: {} });
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      value = await delegate.findUnique({ where: { organizationId } });
    }
    if (!value) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Settings could not be loaded", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return value as AppSettingsMap[K];
  }

  async update<K extends AppSettingsKey>(
    app: K,
    organizationId: string,
    actorUserId: string,
    changes: object,
  ): Promise<AppSettingsMap[K]> {
    const data = this.sanitize(changes);
    return this.prisma.$transaction(async (tx) => {
      // Serializes partial updates across API instances before reading/validating.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${organizationId}:${app}`}, 0))`;
      const delegate = this.delegate(app, tx);
      const current = (await delegate.upsert({
        where: { organizationId },
        create: { organizationId },
        update: {},
      })) as AppSettingsMap[K];
      await this.validate(app, organizationId, { ...current, ...data });
      if (app === "connect") {
        const previous = current as ConnectOrganizationSettings;
        const retentionChanged = ["messageRetentionDays", "recordingRetentionDays"].some(
          (key) => key in data && data[key] !== previous[key as keyof ConnectOrganizationSettings],
        );
        if (retentionChanged) {
          const next = { ...previous, ...data };
          data.retentionEnabledAt =
            next.messageRetentionDays === null && next.recordingRetentionDays === null
              ? null
              : new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
      }
      const value = (await delegate.upsert({
        where: { organizationId },
        create: { organizationId, ...data },
        update: data,
      })) as AppSettingsMap[K];
      const before = current as unknown as Record<string, unknown>;
      const after = value as unknown as Record<string, unknown>;
      const changes = Object.fromEntries(
        Object.keys(data).map((key) => [key, { before: before[key] ?? null, after: after[key] ?? null }]),
      );
      await tx.auditLog.create({
        data: {
          action: `settings.${app}.updated`,
          organizationId,
          actorUserId,
          resourceType: `${app}_settings`,
          resourceId: value.id,
          metadata: JSON.parse(JSON.stringify({ changedFields: Object.keys(data), changes })) as Prisma.InputJsonObject,
        },
      });
      if (Object.keys(data).some((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))) {
        const owners = await tx.organizationMember.findMany({
          where: { organizationId, status: "ACTIVE", deletedAt: null, isOwner: true },
          select: { userId: true },
        });
        await enqueueNotification(tx, {
          organizationId,
          actorId: actorUserId,
          sourceType: "control",
          sourceId: value.id,
          type: "CONTROL_SETTINGS_CHANGE",
          recipientIds: owners.map((member) => member.userId),
          title: `${app.charAt(0).toUpperCase() + app.slice(1)} organization settings changed`,
          path: `${app}/settings`,
        });
      }
      return value;
    });
  }

  async getConnectUser(organizationId: string, userId: string): Promise<ConnectUserSettings> {
    const where = { organizationId_userId: { organizationId, userId } };
    try {
      return await this.prisma.connectUserSettings.upsert({ where, create: { organizationId, userId }, update: {} });
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      return this.prisma.connectUserSettings.findUniqueOrThrow({ where });
    }
  }

  async updateConnectUser(
    organizationId: string,
    userId: string,
    changes: UpdateConnectUserSettingsDto,
  ): Promise<ConnectUserSettings> {
    const { manualStatusExpiresAt, ...rest } = this.sanitize(changes) as UpdateConnectUserSettingsDto;
    const data = {
      ...rest,
      ...(manualStatusExpiresAt !== undefined
        ? { manualStatusExpiresAt: manualStatusExpiresAt ? new Date(manualStatusExpiresAt) : null }
        : {}),
      // Clearing the status also clears its expiry.
      ...(rest.manualStatus === null ? { manualStatusExpiresAt: null } : {}),
    };
    if (data.manualStatusExpiresAt && data.manualStatusExpiresAt.getTime() <= Date.now()) {
      throw validationError("Status expiry must be in the future");
    }

    return this.prisma.connectUserSettings.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      create: { organizationId, userId, ...data },
      update: data,
    });
  }

  /** Effective manual status, or null when unset or expired. */
  effectiveManualStatus(
    settings: Pick<ConnectUserSettings, "manualStatus" | "manualStatusExpiresAt">,
    now = new Date(),
  ) {
    if (!settings.manualStatus) {
      return null;
    }
    if (settings.manualStatusExpiresAt && settings.manualStatusExpiresAt <= now) {
      return null;
    }
    return settings.manualStatus;
  }

  /** Whether `now` falls inside the user's quiet hours, evaluated in their time zone. */
  isWithinQuietHours(
    settings: Pick<ConnectUserSettings, "quietHoursEnabled" | "quietHoursStart" | "quietHoursEnd" | "quietHoursDays">,
    timeZone: string | null | undefined,
    now = new Date(),
  ): boolean {
    if (!settings.quietHoursEnabled) {
      return false;
    }
    const { weekday, minutes } = zonedClock(now, timeZone);
    const start = toMinutes(settings.quietHoursStart);
    const end = toMinutes(settings.quietHoursEnd);
    if (start === end) {
      return false;
    }

    // Overnight windows belong to the day they start on.
    if (start < end) {
      return settings.quietHoursDays.includes(weekday) && minutes >= start && minutes < end;
    }
    if (minutes >= start) {
      return settings.quietHoursDays.includes(weekday);
    }
    const previousDay = weekday === 1 ? 7 : weekday - 1;
    return minutes < end && settings.quietHoursDays.includes(previousDay);
  }

  private sanitize(changes: object): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined) {
        continue;
      }
      if (value === null && !NULLABLE_SETTINGS_FIELDS.has(key)) {
        throw validationError(`${key} cannot be empty`);
      }
      data[key] = value;
    }
    return data;
  }

  private async validate(app: AppSettingsKey, organizationId: string, next: Record<string, unknown>) {
    if (app === "pulse") {
      const pulse = next as unknown as PulseOrganizationSettings;
      if (pulse.workingHoursStart >= pulse.workingHoursEnd) {
        throw validationError("Working hours must end after they start");
      }
      if (pulse.workingDays.length === 0) {
        throw validationError("Select at least one working day");
      }
    }

    if (app === "connect") {
      const connect = next as unknown as ConnectOrganizationSettings;
      if (connect.defaultChannelIds.length > 0) {
        const count = await this.prisma.channel.count({
          where: {
            id: { in: connect.defaultChannelIds },
            organizationId,
            visibility: "PUBLIC",
            type: "CHANNEL",
            isArchived: false,
          },
        });
        if (count !== connect.defaultChannelIds.length) {
          throw validationError("Default channels must be existing public channels in this organization");
        }
      }
      if (connect.allowedImageTypes.length === 0) {
        throw validationError("Allow at least one image type");
      }
    }
  }

  private delegate(app: AppSettingsKey, client: Prisma.TransactionClient = this.prisma): SettingsDelegate {
    const delegates: Record<AppSettingsKey, unknown> = {
      connect: client.connectOrganizationSettings,
      flow: client.flowOrganizationSettings,
      atlas: client.atlasOrganizationSettings,
      nexus: client.nexusOrganizationSettings,
      cadence: client.cadenceOrganizationSettings,
      pulse: client.pulseOrganizationSettings,
      notes: client.notesOrganizationSettings,
      hrms: client.hrmsOrganizationSettings,
    };
    return delegates[app] as SettingsDelegate;
  }
}

function validationError(message: string) {
  return new AppError(ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST);
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function zonedClock(date: Date, timeZone: string | null | undefined) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || "UTC",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
  } catch {
    return zonedClock(date, "UTC");
  }
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return {
    weekday: WEEKDAYS[part("weekday")] ?? 1,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}
