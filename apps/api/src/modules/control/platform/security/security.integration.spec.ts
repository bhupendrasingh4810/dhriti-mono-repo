import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { SecurityService } from "./security.service";
import { IpBlockGuard } from "./ip-block.guard";
import { SecurityPageDto } from "./security.dto";
import { canonicalIp } from "./ip-address";
import { SecurityIntegrationsService } from "./security-integrations.service";
import { SecurityOperationsService } from "./security-operations.service";

const databaseTest = process.env.SECURITY_CENTER_DB_INTEGRATION === "true" ? describe : describe.skip;
databaseTest("Security Center connected persistence", () => {
  const db = new PrismaClient();
  afterAll(() => db.$disconnect());
  it("calculates real metrics and persists detection, resolution, IP enforcement and audit entries without retaining fixtures", async () => {
    const rollback = new Error("Rollback Security Center fixtures");
    await expect(
      db.$transaction(
        async (tx) => {
          const scoped = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return async <T>(operation: Promise<unknown>[] | ((client: Prisma.TransactionClient) => Promise<T>)) =>
                  Array.isArray(operation) ? Promise.all(operation) : operation(tx);
              }
              return Reflect.get(target, key);
            },
          });
          const redis = { incrementWithExpiry: jest.fn().mockResolvedValue(5) };
          const integrations = new SecurityIntegrationsService(
            scoped as never,
            redis as never,
            { securityIntegrations: { emails: [] } } as never,
            {} as never,
          );
          const service = new SecurityService(scoped as never, redis as never, integrations);
          const before = await service.overview();
          const orgs = await Promise.all(
            ["enforced", "optional", "none"].map((kind) =>
              tx.organization.create({
                data: {
                  name: `Security test ${kind}`,
                  slug: `security-test-${randomUUID()}`,
                  ...(kind === "enforced" ? { settings: { create: { mfaEnforced: true } } } : {}),
                },
              }),
            ),
          );
          const user = await tx.user.create({
            data: {
              name: "Synthetic security member",
              email: `${randomUUID()}@security.example.test`,
              status: "ACTIVE",
              auth: { create: { mfaEnabled: true } },
            },
          });
          await tx.organizationMember.create({
            data: { organizationId: orgs[1].id, userId: user.id, status: "ACTIVE" },
          });
          await tx.organizationOidc.create({
            data: {
              organizationId: orgs[1].id,
              issuer: "https://idp.example.test",
              clientId: "synthetic-client",
              clientSecretEncrypted: "synthetic-never-used",
              enabled: true,
            },
          });
          const after = await service.overview();
          expect(after.mfaStatus).toEqual({
            enforced: before.mfaStatus.enforced + 1,
            optional: before.mfaStatus.optional + 1,
            none: before.mfaStatus.none + 1,
            total: before.mfaStatus.total + 3,
          });
          expect(after.ssoOrgs).toBe(before.ssoOrgs + 1);
          const ip = canonicalIp(`2001:db8:${randomUUID().slice(0, 4)}:${randomUUID().slice(0, 4)}::1`);
          await service.failedLogin(ip);
          const detected = await tx.securityEvent.findFirstOrThrow({ where: { ipAddress: ip } });
          expect((await service.overview()).activeThreats).toBe(before.activeThreats + 1);
          await service.resolve(detected.id, user.id);
          expect((await tx.securityEvent.findUniqueOrThrow({ where: { id: detected.id } })).resolvedById).toBe(user.id);
          await service.block(ip, user.id, "192.0.2.1", { reason: "Integration test" });
          const guard = new IpBlockGuard(scoped as never);
          const context = { getType: () => "http", switchToHttp: () => ({ getRequest: () => ({ ip }) }) };
          await expect(guard.canActivate(context as never)).rejects.toThrow("Access from this IP address is blocked");
          expect((await service.blocked(new SecurityPageDto())).items.some((entry) => entry.ipAddress === ip)).toBe(
            true,
          );
          await service.unblock(ip, user.id);
          await expect(guard.canActivate(context as never)).resolves.toBe(true);
          await service.block(ip, user.id, "192.0.2.1", { reason: "Expires" });
          await tx.blockedIp.update({ where: { ipAddress: ip }, data: { expiresAt: new Date(Date.now() - 1000) } });
          await expect(guard.canActivate(context as never)).resolves.toBe(true);
          expect((await service.blocked(new SecurityPageDto())).items.some((entry) => entry.ipAddress === ip)).toBe(
            false,
          );
          const operations = new SecurityOperationsService(scoped as never, {} as never);
          const compliance = await operations.compliance(Object.assign(new SecurityPageDto(), { limit: 100 }));
          expect(compliance.items.find((entry) => entry.id === orgs[1].id)).toMatchObject({
            ssoStatus: "configured",
            activeMembers: 1,
            mfaEnabledMembers: 1,
            mfaGap: 0,
          });
          expect((await service.event(detected.id)).timeline).toHaveLength(4);
          expect(
            await tx.auditLog.count({ where: { actorUserId: user.id, action: { startsWith: "security." } } }),
          ).toBe(4);
          const writer = new SecurityIntegrationsService(
            scoped as never,
            redis as never,
            {
              securityIntegrations: {
                emails: ["security@example.test"],
                webhookUrl: "https://collector.example.test/events",
              },
            } as never,
            {} as never,
          );
          const providerEvent = {
            source: "waf-test",
            externalId: randomUUID(),
            severity: "critical" as const,
            type: "WAF finding",
            description: "Synthetic finding",
            ipAddress: ip,
          };
          const first = await writer.recordEvent(providerEvent);
          const repeated = await writer.recordEvent(providerEvent);
          expect(first.id).toBe(repeated.id);
          expect(await tx.securityAlertDelivery.count({ where: { eventId: first.id } })).toBe(2);
          throw rollback;
        },
        { timeout: 20000 },
      ),
    ).rejects.toBe(rollback);
  });
});
