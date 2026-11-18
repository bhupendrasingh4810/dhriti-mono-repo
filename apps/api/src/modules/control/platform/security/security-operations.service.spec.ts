import { NotFoundException } from "@nestjs/common";
import { SecurityOperationsService } from "./security-operations.service";
import { SecurityPageDto, SecuritySessionsDto } from "./security.dto";

function setup() {
  const prisma = {
    userSession: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
    organization: { findMany: jest.fn(), count: jest.fn() },
    organizationMember: { groupBy: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) => Promise.all(operations));
  const sessions = { revokeSession: jest.fn() };
  return { prisma, sessions, service: new SecurityOperationsService(prisma as never, sessions as never) };
}
describe("Security session and compliance operations", () => {
  it("lists only active sessions with no refresh token hashes, and marks the current session", async () => {
    const { prisma, service } = setup();
    prisma.userSession.findMany.mockResolvedValue([{ id: "current", user: { email: "user@example.test" } }]);
    prisma.userSession.count.mockResolvedValue(1);
    const result = await service.activeSessions(
      Object.assign(new SecuritySessionsDto(), { search: "user" }),
      "current",
    );
    expect(result.items[0].current).toBe(true);
    const query = prisma.userSession.findMany.mock.calls[0][0];
    expect(query.where).toMatchObject({ revokedAt: null, rotatedAt: null, expiresAt: { gt: expect.any(Date) } });
    expect(query.select.refreshTokenHash).toBeUndefined();
    expect(prisma.userSession.count).toHaveBeenCalledWith({ where: query.where });
  });
  it("reuses revocation to evict auth caches and sockets, with an audited reason", async () => {
    const { prisma, sessions, service } = setup();
    prisma.userSession.findUnique.mockResolvedValue({ id: "session" });
    await service.revoke("session", "admin", "Suspicious session");
    expect(sessions.revokeSession).toHaveBeenCalledWith("session", { rejectRotated: true });
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(2);
    expect(prisma.auditLog.create).toHaveBeenLastCalledWith({
      data: {
        action: "security.session.revoked",
        actorUserId: "admin",
        resourceType: "UserSession",
        resourceId: "session",
        metadata: { reason: "Suspicious session" },
      },
    });
    prisma.userSession.findUnique.mockResolvedValue(null);
    await expect(service.revoke("missing", "admin", "Test")).rejects.toThrow(NotFoundException);
  });
  it("does not claim successful revocation when cache invalidation fails", async () => {
    const { prisma, sessions, service } = setup();
    prisma.userSession.findUnique.mockResolvedValue({ id: "session" });
    sessions.revokeSession.mockRejectedValue(new Error("Redis unavailable"));
    await expect(service.revoke("session", "admin", "Test")).rejects.toThrow("Redis unavailable");
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });
  it("distinguishes configured from verified SSO and reports local MFA gaps without counting inactive users", async () => {
    const { prisma, service } = setup();
    prisma.organization.findMany.mockResolvedValue([
      {
        id: "configured",
        name: "Configured",
        slug: "configured",
        oidc: { enabled: true, lastVerifiedAt: null },
        settings: { mfaEnforced: true },
      },
      {
        id: "verified",
        name: "Verified",
        slug: "verified",
        oidc: { enabled: true, lastVerifiedAt: new Date() },
        settings: null,
      },
      {
        id: "disabled",
        name: "Disabled",
        slug: "disabled",
        oidc: { enabled: false, lastVerifiedAt: null },
        settings: null,
      },
      { id: "none", name: "None", slug: "none", oidc: null, settings: null },
    ]);
    prisma.organization.count.mockResolvedValue(4);
    prisma.organizationMember.groupBy
      .mockResolvedValueOnce([{ organizationId: "configured", _count: { _all: 5 } }])
      .mockResolvedValueOnce([{ organizationId: "configured", _count: { _all: 2 } }]);
    const result = await service.compliance(new SecurityPageDto());
    expect(result.items.map((row) => row.ssoStatus)).toEqual(["configured", "verified", "disabled", "not_configured"]);
    expect(result.items[0]).toMatchObject({ activeMembers: 5, mfaEnabledMembers: 2, mfaGap: 3, mfaEnforced: true });
    expect(prisma.organizationMember.groupBy.mock.calls[0][0].where).toMatchObject({
      status: "ACTIVE",
      deletedAt: null,
      user: { status: "ACTIVE", deletedAt: null },
    });
  });
});
