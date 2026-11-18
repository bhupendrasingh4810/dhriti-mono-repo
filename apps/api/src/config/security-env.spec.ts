import { envSchema } from "./env.validation";

const base = {
  WEB_APP_URL: "https://app.example.test",
  ONBOARDING_URL: "https://app.example.test/onboarding",
  CORS_ORIGINS: "https://app.example.test",
  DATABASE_URL: "postgresql://localhost/test",
  REDIS_URL: "redis://localhost",
  JWT_ACCESS_SECRET: "test-access-secret-at-least-32-characters",
  JWT_MFA_SECRET: "test-mfa-secret-at-least-32-characters",
  S3_BUCKET: "test-bucket",
};
describe("Security integration configuration", () => {
  it("defaults all integrations to disabled", () => {
    const config = envSchema.parse(base);
    expect(config.SECURITY_ALERT_EMAILS).toBe("");
    expect(config.SECURITY_WEBHOOK_URL).toBeUndefined();
    expect(config.SECURITY_INGEST_TOKEN).toBeUndefined();
  });
  it("requires valid recipients and configured email delivery", () => {
    expect(envSchema.safeParse({ ...base, SECURITY_ALERT_EMAILS: "security@example.test" }).success).toBe(false);
    expect(envSchema.safeParse({ ...base, SECURITY_ALERT_EMAILS: "not-email", BREVO_API_KEY: "test" }).success).toBe(
      false,
    );
    expect(
      envSchema.safeParse({
        ...base,
        SECURITY_ALERT_EMAILS: "security@example.test",
        BREVO_API_KEY: "test",
        BREVO_SENDER_EMAIL: "sender@example.test",
        BREVO_SENDER_NAME: "Test",
      }).success,
    ).toBe(true);
  });
  it("requires paired HTTPS webhook configuration and strong independent ingestion credentials", () => {
    const secret = "test-webhook-secret-at-least-32-characters";
    expect(
      envSchema.safeParse({ ...base, SECURITY_WEBHOOK_URL: "https://collector.example.test/events" }).success,
    ).toBe(false);
    expect(
      envSchema.safeParse({
        ...base,
        SECURITY_WEBHOOK_URL: "http://collector.example.test/events",
        SECURITY_WEBHOOK_SECRET: secret,
      }).success,
    ).toBe(false);
    expect(
      envSchema.safeParse({
        ...base,
        SECURITY_WEBHOOK_URL: "https://collector.example.test/events",
        SECURITY_WEBHOOK_SECRET: secret,
      }).success,
    ).toBe(true);
    expect(envSchema.safeParse({ ...base, SECURITY_INGEST_TOKEN: "short" }).success).toBe(false);
    expect(
      envSchema.safeParse({
        ...base,
        SECURITY_WEBHOOK_URL: "https://collector.example.test/events",
        SECURITY_WEBHOOK_SECRET: secret,
        SECURITY_INGEST_TOKEN: secret,
      }).success,
    ).toBe(false);
  });
});
