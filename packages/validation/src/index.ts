import { z } from "zod";

export { z };

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
    workingDays: { minItems: 1, maxItems: 7, minDay: 1, maxDay: 7 },
    workingHoursStart: { min: 0, max: 23 },
    workingHoursEnd: { min: 1, max: 24 },
    defaultReminderMinutes: { min: 0, max: 10_080 },
    maxMeetingAttendees: { min: 1, max: 1_000 },
    maxEventDurationMinutes: { min: 5, max: 10_080 },
  },
  notes: {
    maxSharedUsersPerNote: { min: 1, max: 500 },
    maxNoteContentLength: { min: 1_000, max: 100_000 },
  },
  hrms: {
    maxLeaveRequestDays: { min: 1, max: 365 },
    maxTrainingParticipants: { min: 1, max: 10_000 },
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
