import { ValidationPipe, type ExecutionContext, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { SecurityController } from "./security.controller";
import { SecurityService } from "./security.service";
import { SecurityAccessGuard } from "./security-access.guard";
import { IpBlockGuard } from "./ip-block.guard";
import { SecurityOperationsService } from "./security-operations.service";
import { SecurityIntegrationsService } from "./security-integrations.service";

describe("Security Center HTTP contract", () => {
  let app: INestApplication;
  const service = {
    overview: jest.fn(),
    events: jest.fn(),
    blocked: jest.fn(),
    resolve: jest.fn(),
    block: jest.fn(),
    unblock: jest.fn(),
    event: jest.fn(),
  };
  const operations = { activeSessions: jest.fn(), revoke: jest.fn(), compliance: jest.fn() };
  const integrations = { status: jest.fn(), deliveries: jest.fn(), retry: jest.fn() };
  const database = { blockedIp: { findUnique: jest.fn() } };
  let allowed = true;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [
        { provide: SecurityService, useValue: service },
        { provide: SecurityOperationsService, useValue: operations },
        { provide: SecurityIntegrationsService, useValue: integrations },
      ],
    })
      .overrideGuard(SecurityAccessGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          context.switchToHttp().getRequest().user = { userId: "admin", sessionId: "current" };
          return allowed;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalGuards(new IpBlockGuard(database as never));
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    allowed = true;
    database.blockedIp.findUnique.mockResolvedValue(null);
    service.overview.mockResolvedValue({ activeThreats: 0 });
  });
  afterAll(() => app.close());

  it("denies access before querying the dashboard when the security role is missing", async () => {
    allowed = false;
    await request(app.getHttpServer()).get("/control/platform/security/overview").expect(403);
    expect(service.overview).not.toHaveBeenCalled();
  });
  it("enforces persisted IP blocks before an authorized security operator reaches the controller", async () => {
    database.blockedIp.findUnique.mockResolvedValue({ ipAddress: "127.0.0.1" });
    await request(app.getHttpServer()).get("/control/platform/security/overview").expect(403);
    expect(service.overview).not.toHaveBeenCalled();
  });
  it("validates bounded numeric pagination", async () => {
    await request(app.getHttpServer()).get("/control/platform/security/events?page=0&limit=1000").expect(400);
    await request(app.getHttpServer()).get("/control/platform/security/events?page=2&limit=10").expect(200);
    expect(service.events).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });
  it("rejects malformed or unexpected block input", async () => {
    await request(app.getHttpServer())
      .post("/control/platform/security/blocked-ips")
      .send({ ipAddress: "invalid" })
      .expect(400);
    await request(app.getHttpServer())
      .post("/control/platform/security/blocked-ips")
      .send({ ipAddress: "192.0.2.1", extra: true })
      .expect(400);
    expect(service.block).not.toHaveBeenCalled();
  });
  it("wires resolve, block and unblock to the authenticated actor and observed IP", async () => {
    const id = "13f88912-08fd-4c44-9008-31e50142bdbb";
    await request(app.getHttpServer()).post(`/control/platform/security/events/${id}/resolve`).expect(204);
    expect(service.resolve).toHaveBeenCalledWith(id, "admin");
    await request(app.getHttpServer())
      .post("/control/platform/security/blocked-ips")
      .send({ ipAddress: "192.0.2.1", reason: "WAF finding" })
      .expect(204);
    expect(service.block).toHaveBeenCalledWith("192.0.2.1", "admin", expect.any(String), { reason: "WAF finding" });
    await request(app.getHttpServer()).delete("/control/platform/security/blocked-ips/192.0.2.1").expect(204);
    expect(service.unblock).toHaveBeenCalledWith("192.0.2.1", "admin");
  });
  it("rejects invalid filters, empty reasons and malformed expiry dates", async () => {
    await request(app.getHttpServer()).get("/control/platform/security/events?severity=unknown").expect(400);
    await request(app.getHttpServer()).get("/control/platform/security/events?status=unknown").expect(400);
    await request(app.getHttpServer()).get("/control/platform/security/events?ipAddress=not-an-ip").expect(400);
    await request(app.getHttpServer()).get("/control/platform/security/events?from=yesterday").expect(400);
    await request(app.getHttpServer())
      .post("/control/platform/security/blocked-ips")
      .send({ ipAddress: "192.0.2.2", reason: " " })
      .expect(400);
    await request(app.getHttpServer())
      .post("/control/platform/security/blocked-ips")
      .send({ ipAddress: "192.0.2.2", reason: "Test", expiresAt: "never" })
      .expect(400);
  });
  it("exposes protected session, compliance, detail and integration endpoints", async () => {
    const id = "13f88912-08fd-4c44-9008-31e50142bdbb";
    await request(app.getHttpServer()).get("/control/platform/security/sessions?search=admin").expect(200);
    expect(operations.activeSessions).toHaveBeenCalledWith({ page: 1, limit: 20, search: "admin" }, "current");
    await request(app.getHttpServer())
      .post(`/control/platform/security/sessions/${id}/revoke`)
      .send({ reason: " " })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/control/platform/security/sessions/${id}/revoke`)
      .send({ reason: "Suspected compromise" })
      .expect(204);
    expect(operations.revoke).toHaveBeenCalledWith(id, "admin", "Suspected compromise");
    for (const path of ["compliance", "integrations", "deliveries", `events/${id}`]) {
      await request(app.getHttpServer()).get(`/control/platform/security/${path}`).expect(200);
    }
    expect(service.event).toHaveBeenCalledWith(id);
    await request(app.getHttpServer()).post(`/control/platform/security/deliveries/${id}/retry`).expect(204);
    expect(integrations.retry).toHaveBeenCalledWith(id, "admin");
    allowed = false;
    await request(app.getHttpServer()).get("/control/platform/security/sessions").expect(403);
  });
  it("allows requests immediately after a persisted block expires", async () => {
    database.blockedIp.findUnique.mockResolvedValue({ ipAddress: "127.0.0.1", expiresAt: new Date(Date.now() - 1) });
    await request(app.getHttpServer()).get("/control/platform/security/overview").expect(200);
  });
});
