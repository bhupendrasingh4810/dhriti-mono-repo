import { z } from "@dhriti/validation";

const optionalWhen = (enabled: boolean, value: string | undefined): boolean =>
  !enabled || (typeof value === "string" && value.length > 0);

const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim().length === 0 ? undefined : value;

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    API_PREFIX: z.string().min(1).default("v1"),
    WEB_APP_URL: z.string().url(),
    ONBOARDING_URL: z.string().url(),
    CORS_ORIGINS: z.string().min(1),

    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_MFA_SECRET: z.string().min(32),
    JWT_MFA_TTL_SECONDS: z.coerce.number().int().positive().default(300),
    SECRETS_ENCRYPTION_KEY: z.string().optional(),

    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    BCRYPT_ROUNDS: z.coerce.number().int().min(12).default(12),

    LOCKOUT_THRESHOLD: z.coerce.number().int().positive().default(10),
    LOCKOUT_DURATION_MINUTES: z.coerce.number().int().positive().default(15),
    TRUST_PROXY: z.enum(["true", "false"]).transform((value) => value === "true").default("false"),
    PUBLIC_AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
    PUBLIC_AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
    EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(1200),
    PASSWORD_RESET_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
    MFA_PENDING_SECRET_TTL_SECONDS: z.coerce.number().int().positive().default(600),
    MFA_RECOVERY_CODE_COUNT: z.coerce.number().int().min(1).max(100).default(10),
    PROFILE_PHOTO_MAX_SIZE_MB: z.coerce.number().int().positive().default(2),
    REDIS_MAX_RETRIES_PER_REQUEST: z.coerce.number().int().min(0).default(3),
    REDIS_SCAN_COUNT: z.coerce.number().int().positive().default(200),
    REDIS_METRICS_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
    CONNECT_SOCKET_ALLOWED_ORIGINS: z.string().min(1).optional(),
    CONNECT_SOCKET_PRESENCE_TTL_SECONDS: z.coerce.number().int().positive().default(90),
    CONNECT_SOCKET_TYPING_TTL_SECONDS: z.coerce.number().int().positive().default(6),
    CONNECT_SOCKET_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
    CONNECT_SOCKET_RATE_LIMIT_MAX_EVENTS: z.coerce.number().int().positive().default(120),
    ENTITLEMENT_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    WEBHOOK_DELIVERY_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    WEBHOOK_DELIVERY_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
    WEBHOOK_DELIVERY_RETRY_BASE_DELAY_SECONDS: z.coerce.number().int().positive().default(1),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GITHUB_CALLBACK_URL: z.string().url().optional(),

    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().min(1).default("us-east-1"),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),
    S3_PRESIGN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    FILE_MAX_SIZE_MB: z.coerce.number().int().positive().default(25),

    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),

    BREVO_API_KEY: z.string().optional(),
    BREVO_SENDER_EMAIL: z.string().email().optional(),
    BREVO_SENDER_NAME: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.preprocess(emptyStringToUndefined, z.string().min(32).optional()),
    BILLING_WEBHOOK_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
    BILLING_WEBHOOK_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
    BILLING_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS: z.coerce.number().int().positive().default(300),
    BILLING_WEBHOOK_MAX_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(8),
    BILLING_WEBHOOK_PROCESSING_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(600),
    BILLING_WEBHOOK_RETRY_BASE_DELAY_SECONDS: z.coerce.number().int().positive().default(60),
    BILLING_WEBHOOK_RETRY_MAX_DELAY_SECONDS: z.coerce.number().int().positive().default(3600),
    BILLING_WEBHOOK_RETRY_INTERVAL_SECONDS: z.coerce.number().int().positive().default(60),
    BILLING_WEBHOOK_RETRY_LEASE_TTL_SECONDS: z.coerce.number().int().positive().default(55),
    BILLING_IDEMPOTENCY_LOCK_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    BILLING_IDEMPOTENCY_RESULT_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
    BILLING_WEBHOOK_RETRY_BATCH_SIZE: z.coerce.number().int().positive().max(1000).default(100),
  })
  .superRefine((env, ctx) => {
    const providers: Array<[string, Array<string | undefined>]> = [
      ["GOOGLE", [env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_CALLBACK_URL]],
      ["GITHUB", [env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, env.GITHUB_CALLBACK_URL]],
    ];

    for (const [name, values] of providers) {
      const anySet = values.some((v) => typeof v === "string" && v.length > 0);
      if (anySet && !values.every((v) => optionalWhen(true, v))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${name} OAuth requires CLIENT_ID, CLIENT_SECRET and CALLBACK_URL together`,
        });
      }
    }

    if (env.BREVO_API_KEY && (!env.BREVO_SENDER_EMAIL || !env.BREVO_SENDER_NAME)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "BREVO_API_KEY requires BREVO_SENDER_EMAIL and BREVO_SENDER_NAME",
      });
    }
    if (env.NODE_ENV === "production" && (!env.SECRETS_ENCRYPTION_KEY || Buffer.from(env.SECRETS_ENCRYPTION_KEY, "base64").length !== 32)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SECRETS_ENCRYPTION_KEY must be a base64-encoded 32-byte key in production" });
    }

    if (env.BILLING_WEBHOOK_RETRY_LEASE_TTL_SECONDS >= env.BILLING_WEBHOOK_RETRY_INTERVAL_SECONDS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BILLING_WEBHOOK_RETRY_LEASE_TTL_SECONDS must be less than BILLING_WEBHOOK_RETRY_INTERVAL_SECONDS" });
    }
    if (env.BILLING_WEBHOOK_RETRY_BASE_DELAY_SECONDS > env.BILLING_WEBHOOK_RETRY_MAX_DELAY_SECONDS) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BILLING_WEBHOOK_RETRY_BASE_DELAY_SECONDS must not exceed BILLING_WEBHOOK_RETRY_MAX_DELAY_SECONDS" });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}
