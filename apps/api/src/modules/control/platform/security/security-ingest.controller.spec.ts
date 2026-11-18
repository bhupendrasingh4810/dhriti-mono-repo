import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { SecurityIngestController } from "./security-ingest.controller";
import { SecurityIntegrationsService } from "./security-integrations.service";
import { PrismaService } from "../../../../database/prisma.service";
import { RedisService } from "../../../../redis/redis.service";
import { ApiConfigService } from "../../../../config/config.service";
import { EmailService } from "../../../notification/email.service";
import { IS_PUBLIC_KEY } from "../../../../common/decorators/public.decorator";

describe("Authenticated generic security event ingress", () => {
  let app: INestApplication;
  const prisma = { securityEvent: { upsert: jest.fn().mockResolvedValue({ id: "event" }) } };
  const config = { securityIntegrations: { emails: [], ingestToken: "example-ingestion-token-long-enough-for-tests" } };
  const redis = { incrementWithExpiry: jest.fn().mockResolvedValue(1) };
  const input = {
    source: "waf",
    externalId: "finding-1",
    severity: "high",
    type: "WAF finding",
    description: "Normalized finding",
    ipAddress: "192.0.2.2",
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SecurityIngestController],
      providers: [
        SecurityIntegrationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: ApiConfigService, useValue: config },
        { provide: EmailService, useValue: {} },
      ],
    }).compile();
    app = module.createNestApplication();
    // Do not start the delivery worker in a controller-only contract test.
    module.get(SecurityIntegrationsService).onModuleInit = () => undefined;
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());
  it("bypasses user JWT auth only to require its independent integration credential", async () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, SecurityIngestController.prototype.ingest)).toBe(true);
    await request(app.getHttpServer()).post("/integrations/security/events").send(input).expect(401);
    expect(prisma.securityEvent.upsert).not.toHaveBeenCalled();
    const result = await request(app.getHttpServer())
      .post("/integrations/security/events")
      .set("Authorization", `Bearer ${config.securityIntegrations.ingestToken}`)
      .send(input)
      .expect(200);
    expect(result.body).toEqual({ id: "event" });
  });
  it("rejects unknown fields, invalid severities and reserved internal sources", async () => {
    for (const body of [
      { ...input, token: "not-allowed" },
      { ...input, severity: "urgent" },
      { ...input, description: "x".repeat(2001) },
      { ...input, source: "dhriti" },
    ]) {
      await request(app.getHttpServer())
        .post("/integrations/security/events")
        .set("Authorization", `Bearer ${config.securityIntegrations.ingestToken}`)
        .send(body)
        .expect(400);
    }
    expect(prisma.securityEvent.upsert).not.toHaveBeenCalled();
  });
});
