import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import type { Env } from "./env.validation";

@Injectable()
export class ApiConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv(): Env["NODE_ENV"] {
    return this.config.get("NODE_ENV", { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  get port(): number {
    return this.config.get("PORT", { infer: true });
  }

  get apiPrefix(): string {
    return this.config.get("API_PREFIX", { infer: true });
  }

  get webAppUrl(): string {
    return this.config.get("WEB_APP_URL", { infer: true });
  }

  get onboardingUrl(): string {
    return this.config.get("ONBOARDING_URL", { infer: true });
  }

  get corsOrigins(): string[] {
    return this.config
      .get("CORS_ORIGINS", { infer: true })
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  get databaseUrl(): string {
    return this.config.get("DATABASE_URL", { infer: true });
  }

  get redisUrl(): string {
    return this.config.get("REDIS_URL", { infer: true });
  }

  get jwtAccessSecret(): string {
    return this.config.get("JWT_ACCESS_SECRET", { infer: true });
  }

  get jwtAccessTtlSeconds(): number {
    return this.config.get("JWT_ACCESS_TTL_SECONDS", { infer: true });
  }

  get jwtMfaSecret(): string {
    return this.config.get("JWT_MFA_SECRET", { infer: true });
  }

  get jwtMfaTtlSeconds(): number {
    return this.config.get("JWT_MFA_TTL_SECONDS", { infer: true });
  }

  get secretEncryptionKey(): string | undefined {
    return this.config.get("SECRETS_ENCRYPTION_KEY", { infer: true });
  }

  get refreshTokenTtlDays(): number {
    return this.config.get("REFRESH_TOKEN_TTL_DAYS", { infer: true });
  }

  get bcryptRounds(): number {
    return this.config.get("BCRYPT_ROUNDS", { infer: true });
  }

  get lockoutThreshold(): number {
    return this.config.get("LOCKOUT_THRESHOLD", { infer: true });
  }

  get lockoutDurationMinutes(): number {
    return this.config.get("LOCKOUT_DURATION_MINUTES", { infer: true });
  }

  get trustProxy(): boolean {
    return this.config.get("TRUST_PROXY", { infer: true });
  }

  get publicAuthRateLimit(): { windowSeconds: number; maxRequests: number } {
    return {
      windowSeconds: this.config.get("PUBLIC_AUTH_RATE_LIMIT_WINDOW_SECONDS", { infer: true }),
      maxRequests: this.config.get("PUBLIC_AUTH_RATE_LIMIT_MAX_REQUESTS", { infer: true }),
    };
  }

  get emailVerificationTokenTtlSeconds(): number {
    return this.config.get("EMAIL_VERIFICATION_TOKEN_TTL_SECONDS", { infer: true });
  }

  get passwordResetTokenTtlSeconds(): number {
    return this.config.get("PASSWORD_RESET_TOKEN_TTL_SECONDS", { infer: true });
  }

  get mfa(): { pendingSecretTtlSeconds: number; recoveryCodeCount: number } {
    return {
      pendingSecretTtlSeconds: this.config.get("MFA_PENDING_SECRET_TTL_SECONDS", { infer: true }),
      recoveryCodeCount: this.config.get("MFA_RECOVERY_CODE_COUNT", { infer: true }),
    };
  }

  get profilePhotoMaxSizeBytes(): number {
    return this.config.get("PROFILE_PHOTO_MAX_SIZE_MB", { infer: true }) * 1024 * 1024;
  }

  get redis(): { maxRetriesPerRequest: number; scanCount: number; metricsIntervalSeconds: number } {
    return {
      maxRetriesPerRequest: this.config.get("REDIS_MAX_RETRIES_PER_REQUEST", { infer: true }),
      scanCount: this.config.get("REDIS_SCAN_COUNT", { infer: true }),
      metricsIntervalSeconds: this.config.get("REDIS_METRICS_INTERVAL_SECONDS", { infer: true }),
    };
  }

  get connectSocket(): {
    allowedOrigins: string[];
    presenceTtlSeconds: number;
    typingTtlSeconds: number;
    rateLimitWindowSeconds: number;
    rateLimitMaxEvents: number;
  } {
    const configuredOrigins = this.config.get("CONNECT_SOCKET_ALLOWED_ORIGINS", { infer: true });
    return {
      allowedOrigins: (configuredOrigins ?? this.corsOrigins.join(","))
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
      presenceTtlSeconds: this.config.get("CONNECT_SOCKET_PRESENCE_TTL_SECONDS", { infer: true }),
      typingTtlSeconds: this.config.get("CONNECT_SOCKET_TYPING_TTL_SECONDS", { infer: true }),
      rateLimitWindowSeconds: this.config.get("CONNECT_SOCKET_RATE_LIMIT_WINDOW_SECONDS", { infer: true }),
      rateLimitMaxEvents: this.config.get("CONNECT_SOCKET_RATE_LIMIT_MAX_EVENTS", { infer: true }),
    };
  }

  get entitlementCacheTtlSeconds(): number {
    return this.config.get("ENTITLEMENT_CACHE_TTL_SECONDS", { infer: true });
  }

  get webhookDelivery(): { timeoutSeconds: number; maxAttempts: number; retryBaseDelaySeconds: number } {
    return {
      timeoutSeconds: this.config.get("WEBHOOK_DELIVERY_TIMEOUT_SECONDS", { infer: true }),
      maxAttempts: this.config.get("WEBHOOK_DELIVERY_MAX_ATTEMPTS", { infer: true }),
      retryBaseDelaySeconds: this.config.get("WEBHOOK_DELIVERY_RETRY_BASE_DELAY_SECONDS", { infer: true }),
    };
  }

  get s3(): {
    endpoint: string | undefined;
    region: string;
    bucket: string;
    accessKeyId: string | undefined;
    secretAccessKey: string | undefined;
    forcePathStyle: boolean;
    presignTtlSeconds: number;
  } {
    return {
      endpoint: this.config.get("S3_ENDPOINT", { infer: true }),
      region: this.config.get("S3_REGION", { infer: true }),
      bucket: this.config.get("S3_BUCKET", { infer: true }),
      accessKeyId: this.config.get("S3_ACCESS_KEY_ID", { infer: true }),
      secretAccessKey: this.config.get("S3_SECRET_ACCESS_KEY", { infer: true }),
      forcePathStyle: this.config.get("S3_FORCE_PATH_STYLE", { infer: true }),
      presignTtlSeconds: this.config.get("S3_PRESIGN_TTL_SECONDS", { infer: true }),
    };
  }

  get fileMaxSizeBytes(): number {
    return this.config.get("FILE_MAX_SIZE_MB", { infer: true }) * 1024 * 1024;
  }

  get openAiApiKey(): string | undefined {
    return this.config.get("OPENAI_API_KEY", { infer: true });
  }

  get openAiModel(): string {
    return this.config.get("OPENAI_MODEL", { infer: true });
  }

  get stripeWebhookSecret(): string | undefined {
    return this.config.get("STRIPE_WEBHOOK_SECRET", { infer: true });
  }

  get billing(): {
    webhookRateLimitWindowSeconds: number;
    webhookRateLimitMaxRequests: number;
    webhookSignatureToleranceSeconds: number;
    webhookMaxRetryAttempts: number;
    webhookProcessingTimeoutSeconds: number;
    webhookRetryBaseDelaySeconds: number;
    webhookRetryMaxDelaySeconds: number;
    webhookRetryIntervalSeconds: number;
    webhookRetryLeaseTtlSeconds: number;
    idempotencyLockTtlSeconds: number;
    idempotencyResultTtlSeconds: number;
    webhookRetryBatchSize: number;
  } {
    return {
      webhookRateLimitWindowSeconds: this.config.get("BILLING_WEBHOOK_RATE_LIMIT_WINDOW_SECONDS", { infer: true }),
      webhookRateLimitMaxRequests: this.config.get("BILLING_WEBHOOK_RATE_LIMIT_MAX_REQUESTS", { infer: true }),
      webhookSignatureToleranceSeconds: this.config.get("BILLING_WEBHOOK_SIGNATURE_TOLERANCE_SECONDS", { infer: true }),
      webhookMaxRetryAttempts: this.config.get("BILLING_WEBHOOK_MAX_RETRY_ATTEMPTS", { infer: true }),
      webhookProcessingTimeoutSeconds: this.config.get("BILLING_WEBHOOK_PROCESSING_TIMEOUT_SECONDS", { infer: true }),
      webhookRetryBaseDelaySeconds: this.config.get("BILLING_WEBHOOK_RETRY_BASE_DELAY_SECONDS", { infer: true }),
      webhookRetryMaxDelaySeconds: this.config.get("BILLING_WEBHOOK_RETRY_MAX_DELAY_SECONDS", { infer: true }),
      webhookRetryIntervalSeconds: this.config.get("BILLING_WEBHOOK_RETRY_INTERVAL_SECONDS", { infer: true }),
      webhookRetryLeaseTtlSeconds: this.config.get("BILLING_WEBHOOK_RETRY_LEASE_TTL_SECONDS", { infer: true }),
      idempotencyLockTtlSeconds: this.config.get("BILLING_IDEMPOTENCY_LOCK_TTL_SECONDS", { infer: true }),
      idempotencyResultTtlSeconds: this.config.get("BILLING_IDEMPOTENCY_RESULT_TTL_SECONDS", { infer: true }),
      webhookRetryBatchSize: this.config.get("BILLING_WEBHOOK_RETRY_BATCH_SIZE", { infer: true }),
    };
  }

  get brevo(): { apiKey: string; senderEmail: string; senderName: string } | null {
    const apiKey = this.config.get("BREVO_API_KEY", { infer: true });
    const senderEmail = this.config.get("BREVO_SENDER_EMAIL", { infer: true });
    const senderName = this.config.get("BREVO_SENDER_NAME", { infer: true });

    if (!apiKey || !senderEmail || !senderName) {
      return null;
    }
    return { apiKey, senderEmail, senderName };
  }

  get googleOAuth(): { clientId: string; clientSecret: string; callbackUrl: string } | null {
    return this.oauthProviderConfig("GOOGLE");
  }

  get githubOAuth(): { clientId: string; clientSecret: string; callbackUrl: string } | null {
    return this.oauthProviderConfig("GITHUB");
  }

  private oauthProviderConfig(
    provider: "GOOGLE" | "GITHUB",
  ): { clientId: string; clientSecret: string; callbackUrl: string } | null {
    const clientId = this.config.get(`${provider}_CLIENT_ID`, { infer: true });
    const clientSecret = this.config.get(`${provider}_CLIENT_SECRET`, { infer: true });
    const callbackUrl = this.config.get(`${provider}_CALLBACK_URL`, { infer: true });

    if (!clientId || !clientSecret || !callbackUrl) {
      return null;
    }
    return { clientId, clientSecret, callbackUrl };
  }
}
