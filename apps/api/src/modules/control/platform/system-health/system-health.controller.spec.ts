import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { PlatformRolesGuard } from "../../../../common/guards/platform-roles.guard";
import { PLATFORM_ROLES_KEY } from "../../../../common/decorators/platform-roles.decorator";
import { SystemHealthController } from "./system-health.controller";
import { SystemHealthServiceProvider } from "./system-health.service";

describe("Platform System Health HTTP API", () => {
  let app: INestApplication;
  let allowed = true;
  const health = { getSnapshot: jest.fn().mockResolvedValue({ timestamp: "2026-11-18T00:00:00Z", services: [] }) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SystemHealthController],
      providers: [{ provide: SystemHealthServiceProvider, useValue: health }],
    })
      .overrideGuard(PlatformRolesGuard)
      .useValue({ canActivate: () => allowed })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    allowed = true;
    jest.clearAllMocks();
  });
  afterAll(() => app.close());
  it("protects health readings and report downloads with platform role authorization", async () => {
    expect(Reflect.getMetadata(PLATFORM_ROLES_KEY, SystemHealthController)).toEqual([
      "PLATFORM_ADMIN",
      "ENGINEERING",
      "SECURITY",
    ]);
    allowed = false;
    for (const suffix of ["", "/report"]) {
      await request(app.getHttpServer()).get(`/control/platform/system-health${suffix}`).expect(403);
    }
    expect(health.getSnapshot).not.toHaveBeenCalled();
  });
  it("returns no-store snapshots and a real JSON report attachment", async () => {
    const snapshot = await request(app.getHttpServer())
      .get("/control/platform/system-health")
      .expect(200)
      .expect("Cache-Control", "no-store");
    const report = await request(app.getHttpServer())
      .get("/control/platform/system-health/report")
      .expect(200)
      .expect("Content-Disposition", 'attachment; filename="dhriti-system-health.json"')
      .expect("Cache-Control", "no-store");
    expect(report.body).toEqual(snapshot.body);
  });
});
