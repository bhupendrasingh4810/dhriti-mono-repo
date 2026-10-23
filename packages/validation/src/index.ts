import { z } from "zod";

export { z };

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
