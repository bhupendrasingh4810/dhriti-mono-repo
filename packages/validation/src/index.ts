import { z } from "zod";

const hrmsLifecycleDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Use a valid calendar date.");
const assetOptionalText = (limit: number) => z.string().trim().max(limit).nullable().optional();
export const hrmsAssetRegisterSchema = z.object({
  name: z.string().trim().min(1, "Asset name is required.").max(200),
  assetTag: z.string().trim().min(1, "Asset tag is required.").max(100),
  serialNumber: assetOptionalText(200),
  type: z.enum(["LAPTOP", "PHONE", "MONITOR", "KEYBOARD", "MOUSE", "HEADPHONES", "FURNITURE", "OTHER"]),
  customCategory: assetOptionalText(100),
  categoryId: z.string().uuid().nullable().optional(),
  condition: z.enum(["NEW", "GOOD", "FAIR"]).optional(),
  status: z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "UNFIT"]).optional(),
  assignedEmployeeId: z.string().uuid().nullable().optional(),
  brand: assetOptionalText(120), model: assetOptionalText(120),
  specifications: assetOptionalText(5000), location: assetOptionalText(200),
  custodianEmployeeId: z.string().uuid().nullable().optional(),
  purchaseDate: hrmsLifecycleDate.nullable().optional(),
  purchaseCost: z.string().regex(/^\d{1,15}(\.\d{1,3})?$/, "Use a nonnegative amount with at most 3 decimal places.").nullable().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, "Use a three-letter uppercase currency code.").nullable().optional(),
  vendor: assetOptionalText(200), warrantyExpiresOn: hrmsLifecycleDate.nullable().optional(),
  notes: assetOptionalText(5000),
}).strict().superRefine((value, context) => {
  if (value.type === "OTHER" && !value.categoryId && !value.customCategory?.trim()) {
    context.addIssue({ code: "custom", path: ["customCategory"], message: "Choose a category or enter a custom category." });
  }
  if (value.purchaseCost !== undefined && value.purchaseCost !== null && !value.currency) {
    context.addIssue({ code: "custom", path: ["currency"], message: "Currency is required when purchase cost is recorded." });
  }
  if (value.purchaseDate && value.warrantyExpiresOn && value.warrantyExpiresOn < value.purchaseDate) {
    context.addIssue({ code: "custom", path: ["warrantyExpiresOn"], message: "Warranty expiry cannot precede purchase." });
  }
});
export const hrmsAssetCustodySchema = z.object({
  revision: z.number().int().min(1),
  condition: z.enum(["NEW", "GOOD", "FAIR"]),
  notes: z.string().trim().min(1, "Handover notes are required.").max(5000),
  employeeId: z.string().uuid().optional(),
  expectedReturnDate: hrmsLifecycleDate.nullable().optional(),
  status: z.enum(["AVAILABLE", "MAINTENANCE", "UNFIT"]).optional(),
}).strict();
export const hrmsAssetRevisionSchema = z.object({ revision: z.number().int().min(1) }).strict();
export const hrmsAssetCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(100),
  isActive: z.boolean().optional(),
}).strict();
const assetReason = z.string().trim().min(1, "Reason is required.").max(5000);
const assetRevision = z.number().int().min(1);
const assetMoney = z.string().regex(/^\d{1,15}(\.\d{1,3})?$/, "Use a nonnegative amount with at most 3 decimal places.");
const assetCurrency = z.string().regex(/^[A-Z]{3}$/, "Use a three-letter uppercase currency code.");
export const hrmsAssetReplacementSchema = z.object({ assetId: z.string().uuid(), revision: assetRevision, reason: assetReason }).strict();
export const hrmsAssetRequestDecisionSchema = z.object({
  revision: assetRevision, action: z.enum(["APPROVE", "REJECT", "FULFIL"]), note: assetReason,
  replacementAssetId: z.string().uuid().optional(), assetRevision: assetRevision.optional(),
}).strict();
export const hrmsAssetMaintenanceSchema = z.object({
  assetId: z.string().uuid(), revision: assetRevision, fault: assetReason, vendor: assetOptionalText(200),
}).strict();
export const hrmsAssetRepairCloseSchema = z.object({
  revision: assetRevision, assetRevision, resolution: assetReason, cost: assetMoney, currency: assetCurrency,
  condition: z.enum(["NEW", "GOOD", "FAIR"]), status: z.enum(["AVAILABLE", "UNFIT"]),
}).strict();
export const hrmsAssetAccessorySchema = z.object({
  name: z.string().trim().min(1, "Accessory name is required.").max(200), quantity: z.number().int().min(1).max(1000), revision: assetRevision,
}).strict();
export const hrmsAssetAccessoryReturnSchema = z.object({
  revision: assetRevision, quantity: z.number().int().min(1).max(1000),
  condition: z.enum(["NEW", "GOOD", "FAIR"]), note: assetReason,
}).strict();
export const hrmsAssetOverrideSchema = z.object({ reason: assetReason, fingerprint: z.string().length(64) }).strict();
export const hrmsAssetAttachmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160), kind: z.enum(["INVOICE", "WARRANTY", "CONDITION", "HANDOVER", "OTHER"]),
}).strict();
export const hrmsAssetStockSchema = z.object({ name: z.string().trim().min(1).max(200) }).strict();
export const hrmsAssetStockObservationSchema = z.object({
  revision: assetRevision, result: z.enum(["FOUND", "MISSING", "MISPLACED", "HOLDER_MISMATCH"]),
  observedLocation: assetOptionalText(200), note: assetReason,
}).strict();
export const hrmsAssetStockResolutionSchema = z.object({ revision: assetRevision, resolution: assetReason }).strict();
export const hrmsAssetProcurementSchema = z.object({
  name: z.string().trim().min(1).max(200), quantity: z.number().int().min(1).max(10000),
  estimatedCost: assetMoney, currency: assetCurrency, reason: assetReason,
}).strict();
export const hrmsAssetProcurementDecisionSchema = z.object({
  revision: assetRevision, action: z.enum(["APPROVE", "REJECT"]), note: assetReason,
}).strict();
export const hrmsAssetDepreciationSchema = z.object({
  revision: z.number().int().min(0), method: z.enum(["DISABLED", "STRAIGHT_LINE"]),
  usefulLifeMonths: z.number().int().min(1).max(1200).nullable(),
  residualPercent: z.string().regex(/^\d{1,3}(\.\d{1,3})?$/).refine((value) => Number(value) <= 100).nullable(),
  reason: assetReason,
}).strict().superRefine((value, ctx) => {
  if (value.method !== "DISABLED") {
    if (!value.usefulLifeMonths) ctx.addIssue({ code: "custom", path: ["usefulLifeMonths"], message: "Useful life is required." });
    if (value.residualPercent === null) ctx.addIssue({ code: "custom", path: ["residualPercent"], message: "Residual percentage is required." });
  }
});
const hrmsLifecycleConfiguration = z.object({
  probationEndDate: hrmsLifecycleDate.nullable(),
  contractStartDate: hrmsLifecycleDate.nullable(),
  contractEndDate: hrmsLifecycleDate.nullable(),
  noticePeriodDays: z.number().int().min(0).max(3650).nullable(),
}).strict();
export const hrmsEmployeeLifecycleSchema = hrmsLifecycleConfiguration.extend({
  probationEndDate: hrmsLifecycleDate.nullable().default(null),
  probationConfirmedOn: hrmsLifecycleDate.nullable().default(null),
  contractStartDate: hrmsLifecycleDate.nullable().default(null),
  contractEndDate: hrmsLifecycleDate.nullable().default(null),
  noticePeriodDays: z.number().int().min(0).max(3650).nullable().default(null),
  approvedLastWorkingDate: hrmsLifecycleDate.nullable().default(null),
});
const lifecycleWriteFields = {
  version: z.number().int().nonnegative(),
  reason: z.string().trim().min(1, "Reason is required.").max(1000),
};
export const updateHrmsLifecycleSchema = z.discriminatedUnion("action", [
  z.object({ ...lifecycleWriteFields, action: z.literal("CONFIGURE"), data: hrmsLifecycleConfiguration }).strict(),
  z.object({
    ...lifecycleWriteFields,
    action: z.enum(["CONFIRM_PROBATION", "EXTEND_PROBATION", "RENEW_CONTRACT", "APPROVE_LAST_WORKING_DATE"]),
    date: hrmsLifecycleDate,
  }).strict(),
]);
// Package imports resolve explicit .ts targets for native Node loading and TypeScript consumers.
export { hrmsEmployeeProfileSchema, updateHrmsEmployeeProfileSchema } from "#hrms-profile";
export {
  hrmsProfileFieldDefinitionsSchema,
  updateHrmsProfileFieldCatalogSchema,
  validateHrmsOrganizationFields,
} from "#hrms-profile-fields";

export { z };

export const hrmsEmployeeDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Document title is required.").max(160),
    category: z.enum(["PERSONAL", "EMPLOYMENT", "EDUCATION", "COMPLIANCE", "OTHER"]),
  })
  .strict();

export const APP_SETTINGS_LIMITS = {
  connect: {
    maxGroupChatMembers: { min: 3, max: 500 },
    maxChannelIds: 20,
    channelNamePrefixes: { maxItems: 20, minLength: 1, maxLength: 20 },
    messageWindowsMinutes: { min: 1, max: 43_200 },
    maxMessageLength: { min: 100, max: 10_000 },
    allowedReactions: { maxItems: 50, minLength: 1, maxLength: 16 },
    maxImageSizeKb: { min: 64, max: 2_048 },
    allowedImageTypes: { maxItems: 10, maxLength: 40 },
    callRingTimeoutSeconds: { min: 10, max: 120 },
    retentionDays: { min: 1, max: 3_650 },
    quietHoursDays: { minItems: 1, maxItems: 7, minDay: 1, maxDay: 7 },
    preferredDeviceIdMaxLength: 255,
    preferredBackgroundMaxLength: 64,
  },
  flow: {
    issueListPageSize: { min: 10, max: 200 },
    maxIssueEstimate: { min: 1, max: 1_000 },
    maxIssueDescriptionLength: { min: 500, max: 20_000 },
  },
  atlas: {
    maxPageHierarchyDepth: { min: 1, max: 100 },
    maxPageContentLength: { min: 1_000, max: 100_000 },
    maxSpaceDescriptionLength: { min: 100, max: 1_000 },
  },
  nexus: {
    conversationHistoryLimit: { min: 5, max: 100 },
    summarizationMessageLimit: { min: 10, max: 200 },
    conversationListSize: { min: 10, max: 200 },
    taskListSize: { min: 10, max: 200 },
  },
  cadence: {
    maxCardContentLength: { min: 100, max: 2_000 },
    sessionListSize: { min: 10, max: 500 },
  },
  pulse: {
    defaultReminderMinutes: { min: 0, max: 10_080 },
    maxMeetingAttendees: { min: 1, max: 1_000 },
    maxEventDurationMinutes: { min: 5, max: 10_080 },
  },
  notes: {
    maxSharedUsersPerNote: { min: 1, max: 500 },
    maxNoteContentLength: { min: 1_000, max: 100_000 },
  },
  hrms: {
    workingDays: { minItems: 1, maxItems: 7, minDay: 1, maxDay: 7 },
    maxLeaveRequestDays: { min: 1, max: 365 },
    leaveMinNoticeDays: { min: 0, max: 90 },
    leaveBackdateLimitDays: { min: 0, max: 365 },
    birthdayLeaveDays: { min: 1, max: 5 },
    optionalLeaveDays: { min: 1, max: 30 },
    maxTrainingParticipants: { min: 1, max: 10_000 },
    attendanceClockInWindowMinutes: { min: 0, max: 240 },
    attendanceGpsMaxAccuracyMeters: { min: 1, max: 1000 },
    attendanceLateAfterMinutes: { min: 0, max: 480 },
    missedClockInAlertMinutes: { min: 1, max: 480 },
    missedClockInAlertRepeatSeconds: { min: 3, max: 300 },
    defaultPayrollCurrencyLength: 3,
  },
} as const;

export const APP_SETTINGS_PATTERNS = {
  connect: {
    imageMimeType: /^image\/[a-z0-9.+-]+$/,
  },
  hrms: {
    defaultPayrollCurrency: /^[A-Z]{3}$/,
  },
} as const;

export const userSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(1),
});

export const stripeSubscriptionStatusSchema = z.enum([
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

export const stripeSubscriptionEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().startsWith("customer.subscription."),
  created: z.number().int().safe(),
  data: z.object({
    object: z.object({
      id: z.string().min(1),
      status: stripeSubscriptionStatusSchema,
      current_period_start: z.number().int().safe().optional(),
      current_period_end: z.number().int().safe().optional(),
      trial_end: z.number().int().safe().nullable().optional(),
      cancel_at_period_end: z.boolean().optional(),
    }),
  }),
});

export type StripeSubscriptionEvent = z.infer<typeof stripeSubscriptionEventSchema>;
/** Work-week rows are weekday occurrences in a month, not a continuous rotation. */
export const hrmsWorkWeekPatternSchema = z.array(
  z.array(z.enum(["WORKING", "HALF_DAY", "OFF"])).length(7),
).length(5);
