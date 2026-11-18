import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import { MetricsService } from "../../../../common/metrics/metrics.service";
import { SystemHealthServiceProvider } from "./system-health.service";

const databaseTest = process.env.SYSTEM_HEALTH_DB_INTEGRATION === "true" ? describe : describe.skip;
databaseTest("Read-only System Health database probe", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());
  it("runs the actual bounded PostgreSQL transaction without writing health fixtures", async () => {
    const service = new SystemHealthServiceProvider(
      prisma as never,
      { raw: { ping: async () => "PONG" } } as never,
      new MetricsService(),
      { checkHealth: async () => undefined } as never,
      { jwtAccessSecret: "test-secret-for-system-health-probe-only", brevo: null } as never,
      new JwtService(),
    );
    const snapshot = await service.getSnapshot();
    const database = snapshot.services.find((row) => row.id === "database");
    if (!database || database.latencyMs === null) {
      throw new Error("Primary database probe did not return a measured latency");
    }
    expect(database).toMatchObject({ samples: 1, uptimePercent: 100 });
    expect(database.status).toBe(database.latencyMs >= 500 ? "degraded" : "operational");
    expect(snapshot.services.find((row) => row.id === "auth")?.status).toBe("operational");
    expect(snapshot.services.find((row) => row.id === "replica")?.status).toBe("unavailable");
  });
});
