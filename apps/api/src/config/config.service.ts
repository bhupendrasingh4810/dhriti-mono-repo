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

  get googleOAuth(): { clientId: string; clientSecret: string; callbackUrl: string } | null {
    return this.oauthProviderConfig("GOOGLE");
  }

  get githubOAuth(): { clientId: string; clientSecret: string; callbackUrl: string } | null {
    return this.oauthProviderConfig("GITHUB");
  }

  get microsoftOAuth(): {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    tenant: string;
  } | null {
    const base = this.oauthProviderConfig("MICROSOFT");
    if (!base) {
      return null;
    }
    return { ...base, tenant: this.config.get("MICROSOFT_TENANT", { infer: true }) };
  }

  private oauthProviderConfig(
    provider: "GOOGLE" | "GITHUB" | "MICROSOFT",
  ): { clientId: string; clientSecret: string; callbackUrl: string } | null {
    const clientId = this.config.get(`${provider}_CLIENT_ID`, { infer: true }) as string | undefined;
    const clientSecret = this.config.get(`${provider}_CLIENT_SECRET`, { infer: true }) as
      | string
      | undefined;
    const callbackUrl = this.config.get(`${provider}_CALLBACK_URL`, { infer: true }) as
      | string
      | undefined;

    if (!clientId || !clientSecret || !callbackUrl) {
      return null;
    }
    return { clientId, clientSecret, callbackUrl };
  }
}
