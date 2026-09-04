import { z } from "@dhriti/validation";

const optionalWhen = (enabled: boolean, value: string | undefined): boolean =>
  !enabled || (typeof value === "string" && value.length > 0);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    API_PREFIX: z.string().min(1).default("v1"),
    WEB_APP_URL: z.string().url(),
    CORS_ORIGINS: z.string().min(1),

    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_MFA_SECRET: z.string().min(32),
    JWT_MFA_TTL_SECONDS: z.coerce.number().int().positive().default(300),

    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    BCRYPT_ROUNDS: z.coerce.number().int().min(12).default(12),

    LOCKOUT_THRESHOLD: z.coerce.number().int().positive().default(10),
    LOCKOUT_DURATION_MINUTES: z.coerce.number().int().positive().default(15),

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
