import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { APP_SETTINGS_LIMITS } from "@dhriti/validation";
import {
  UpdateAtlasSettingsDto,
  UpdateCadenceSettingsDto,
  UpdateConnectSettingsDto,
  UpdateConnectUserSettingsDto,
  UpdateFlowSettingsDto,
  UpdateHrmsSettingsDto,
  UpdateNexusSettingsDto,
  UpdateNotesSettingsDto,
  UpdatePulseSettingsDto,
} from "./app-settings.dto";

type DtoConstructor = new () => object;

const numericBounds: Array<[string, DtoConstructor, string, { min: number; max: number }]> = [
  [
    "connect group members",
    UpdateConnectSettingsDto,
    "maxGroupChatMembers",
    APP_SETTINGS_LIMITS.connect.maxGroupChatMembers,
  ],
  [
    "connect edit window",
    UpdateConnectSettingsDto,
    "messageEditWindowMinutes",
    APP_SETTINGS_LIMITS.connect.messageWindowsMinutes,
  ],
  [
    "connect message length",
    UpdateConnectSettingsDto,
    "maxMessageLength",
    APP_SETTINGS_LIMITS.connect.maxMessageLength,
  ],
  ["connect image size", UpdateConnectSettingsDto, "maxImageSizeKb", APP_SETTINGS_LIMITS.connect.maxImageSizeKb],
  [
    "connect ring timeout",
    UpdateConnectSettingsDto,
    "callRingTimeoutSeconds",
    APP_SETTINGS_LIMITS.connect.callRingTimeoutSeconds,
  ],
  ["connect retention", UpdateConnectSettingsDto, "messageRetentionDays", APP_SETTINGS_LIMITS.connect.retentionDays],
  ["flow page size", UpdateFlowSettingsDto, "issueListPageSize", APP_SETTINGS_LIMITS.flow.issueListPageSize],
  ["flow estimate", UpdateFlowSettingsDto, "maxIssueEstimate", APP_SETTINGS_LIMITS.flow.maxIssueEstimate],
  ["atlas hierarchy", UpdateAtlasSettingsDto, "maxPageHierarchyDepth", APP_SETTINGS_LIMITS.atlas.maxPageHierarchyDepth],
  ["atlas content", UpdateAtlasSettingsDto, "maxPageContentLength", APP_SETTINGS_LIMITS.atlas.maxPageContentLength],
  [
    "nexus history",
    UpdateNexusSettingsDto,
    "conversationHistoryLimit",
    APP_SETTINGS_LIMITS.nexus.conversationHistoryLimit,
  ],
  ["nexus list size", UpdateNexusSettingsDto, "taskListSize", APP_SETTINGS_LIMITS.nexus.taskListSize],
  [
    "cadence content",
    UpdateCadenceSettingsDto,
    "maxCardContentLength",
    APP_SETTINGS_LIMITS.cadence.maxCardContentLength,
  ],
  ["pulse start hour", UpdatePulseSettingsDto, "workingHoursStart", APP_SETTINGS_LIMITS.pulse.workingHoursStart],
  ["pulse attendees", UpdatePulseSettingsDto, "maxMeetingAttendees", APP_SETTINGS_LIMITS.pulse.maxMeetingAttendees],
  [
    "notes collaborators",
    UpdateNotesSettingsDto,
    "maxSharedUsersPerNote",
    APP_SETTINGS_LIMITS.notes.maxSharedUsersPerNote,
  ],
  ["hrms leave days", UpdateHrmsSettingsDto, "maxLeaveRequestDays", APP_SETTINGS_LIMITS.hrms.maxLeaveRequestDays],
  [
    "hrms participants",
    UpdateHrmsSettingsDto,
    "maxTrainingParticipants",
    APP_SETTINGS_LIMITS.hrms.maxTrainingParticipants,
  ],
];

async function validateField(dto: DtoConstructor, property: string, value: unknown) {
  return validate(plainToInstance(dto, { [property]: value }));
}

describe.each(numericBounds)("%s bounds", (_name, dto, property, bounds) => {
  it.each([bounds.min, bounds.max])("accepts boundary %i", async (value) => {
    await expect(validateField(dto, property, value)).resolves.toHaveLength(0);
  });

  it.each([bounds.min - 1, bounds.max + 1])("rejects out-of-range value %i", async (value) => {
    await expect(validateField(dto, property, value)).resolves.not.toHaveLength(0);
  });
});

describe("shared settings array and string bounds", () => {
  it("uses the shared payroll currency pattern", async () => {
    await expect(validateField(UpdateHrmsSettingsDto, "defaultPayrollCurrency", "USD")).resolves.toHaveLength(0);
    await expect(validateField(UpdateHrmsSettingsDto, "defaultPayrollCurrency", "US1")).resolves.not.toHaveLength(0);
  });

  it("uses shared channel prefix array and item length limits", async () => {
    const limits = APP_SETTINGS_LIMITS.connect.channelNamePrefixes;
    await expect(
      validateField(UpdateConnectSettingsDto, "channelNamePrefixes", ["x".repeat(limits.maxLength)]),
    ).resolves.toHaveLength(0);
    await expect(
      validateField(UpdateConnectSettingsDto, "channelNamePrefixes", ["x".repeat(limits.maxLength + 1)]),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateField(UpdateConnectSettingsDto, "channelNamePrefixes", Array(limits.maxItems + 1).fill("x")),
    ).resolves.not.toHaveLength(0);
  });

  it("uses shared Connect reaction and weekday bounds", async () => {
    const reactionLimits = APP_SETTINGS_LIMITS.connect.allowedReactions;
    await expect(
      validateField(UpdateConnectSettingsDto, "allowedReactions", ["x".repeat(reactionLimits.maxLength)]),
    ).resolves.toHaveLength(0);
    await expect(
      validateField(UpdateConnectSettingsDto, "allowedReactions", ["x".repeat(reactionLimits.maxLength + 1)]),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateField(UpdateConnectSettingsDto, "allowedReactions", Array(reactionLimits.maxItems + 1).fill("x")),
    ).resolves.not.toHaveLength(0);
    const imageTypeLimits = APP_SETTINGS_LIMITS.connect.allowedImageTypes;
    await expect(
      validateField(UpdateConnectSettingsDto, "allowedImageTypes", [
        `image/${"a".repeat(imageTypeLimits.maxLength - "image/".length)}`,
      ]),
    ).resolves.toHaveLength(0);
    await expect(
      validateField(UpdateConnectSettingsDto, "allowedImageTypes", [
        `image/${"a".repeat(imageTypeLimits.maxLength - "image/".length + 1)}`,
      ]),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateField(UpdateConnectUserSettingsDto, "quietHoursDays", [
        APP_SETTINGS_LIMITS.connect.quietHoursDays.maxDay + 1,
      ]),
    ).resolves.not.toHaveLength(0);
  });
});
