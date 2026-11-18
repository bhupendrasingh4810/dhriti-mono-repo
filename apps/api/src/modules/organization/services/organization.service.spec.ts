import { AppError } from "../../../common/errors/app-error";
import { OrganizationService } from "./organization.service";
import * as bcrypt from "bcryptjs";

describe("OrganizationService membership lifecycle", () => {
  const activeOwner = {
    id: "owner-a",
    organizationId: "org-a",
    userId: "user-a",
    isOwner: true,
    status: "ACTIVE",
    deletedAt: null,
  };

  function serviceWith(transaction: Record<string, unknown>) {
    const prisma = {
      organizationMember: { findFirst: jest.fn().mockResolvedValue(activeOwner) },
      $transaction: jest.fn(async (callback: (client: Record<string, unknown>) => Promise<unknown>) =>
        callback(transaction),
      ),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const entitlements = {};
    return {
      service: new OrganizationService(
        prisma as never,
        { lockoutDurationMinutes: 60 } as never,
        audit as never,
        entitlements as never,
        { sendTemporaryPasswordEmail: jest.fn().mockResolvedValue(undefined) } as never,
      ),
      audit,
    };
  }

  it("prevents removal of the last active owner", async () => {
    const transaction = {
      organizationMember: { count: jest.fn().mockResolvedValue(1), update: jest.fn() },
      teamMember: { deleteMany: jest.fn() },
      groupMember: { deleteMany: jest.fn() },
    };
    const { service, audit } = serviceWith(transaction);

    await expect(service.removeMember("org-a", "owner-a", "actor-a")).rejects.toBeInstanceOf(AppError);
    expect(transaction.organizationMember.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it("transfers ownership between active members before the former owner is removed", async () => {
    const transaction = {
      organizationMember: {
        findFirst: jest.fn().mockResolvedValueOnce({ id: "owner-a" }).mockResolvedValueOnce({ id: "owner-b" }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const { service, audit } = serviceWith(transaction);

    await expect(service.transferOwnership("org-a", "owner-a", "owner-b", "actor-a")).resolves.toBeUndefined();
    expect(transaction.organizationMember.update).toHaveBeenNthCalledWith(1, {
      where: { id: "owner-b" },
      data: { isOwner: true },
    });
    expect(transaction.organizationMember.update).toHaveBeenNthCalledWith(2, {
      where: { id: "owner-a" },
      data: { isOwner: false },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "iam.member.ownership_transferred", organizationId: "org-a" }),
    );
  });

  it("creates three metadata-backed default groups and grants the creator administrator access", async () => {
    const organization = { id: "org-new", name: "Northwind" };
    const administratorGroup = { id: "administrator-group" };
    const transaction = {
      organization: { create: jest.fn().mockResolvedValue(organization) },
      organizationMember: { findFirst: jest.fn().mockResolvedValue(null) },
      onBoardingProfile: { upsert: jest.fn().mockResolvedValue({}) },
      permission: {
        findUnique: jest.fn().mockResolvedValue({ id: "manage-permission" }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      organizationPermissionGroup: {
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirstOrThrow: jest.fn().mockResolvedValue(administratorGroup),
      },
      organizationPermissionGroupPermission: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
      organizationPermissionGroupAssignment: { create: jest.fn().mockResolvedValue({}) },
      hrmsShift: { createMany: jest.fn().mockResolvedValue({ count: 4 }) },
      hrmsWorkflowDefinition: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      organization: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
      ),
    };
    const service = new OrganizationService(
      prisma as never,
      { lockoutDurationMinutes: 60 } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.createOrganization("owner-1", { name: " Northwind ", slug: "northwind" })).resolves.toEqual(
      organization,
    );

    const createdGroups = transaction.organizationPermissionGroup.createMany.mock.calls[0][0].data as Array<{
      name: string;
      isSystem: boolean;
      systemRole: string;
    }>;
    expect(createdGroups.map(({ name }) => name)).toEqual(["Administrators", "Members", "Guests"]);
    expect(createdGroups.every(({ isSystem }) => isSystem)).toBe(true);
    expect(createdGroups.map(({ systemRole }) => systemRole)).toEqual(["ADMINISTRATORS", "MEMBERS", "GUESTS"]);
    expect(transaction.organizationPermissionGroupAssignment.create).toHaveBeenCalledWith({
      data: {
        organizationId: organization.id,
        permissionGroupId: administratorGroup.id,
        userId: "owner-1",
        scopeType: "ORGANIZATION",
        assignedByUserId: "owner-1",
      },
    });
  });

  it("creates a member account with a temporary password that must be reset", async () => {
    const newUser = {
      id: "new-user",
      email: "jane@example.test",
      name: "Jane Doe",
      avatarUrl: null,
      status: "ACTIVE",
      role: "EMPLOYEE",
    };
    const membership = { id: "member-new", organizationId: "org-a", userId: newUser.id, user: newUser };
    const transaction = {
      user: {
        create: jest.fn().mockResolvedValue(newUser),
      },
      organizationMember: {
        create: jest.fn().mockResolvedValue(membership),
      },
      organizationPermissionGroup: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      notificationOutbox: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      organizationMember: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn(async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
      ),
    };
    const email = { sendTemporaryPasswordEmail: jest.fn().mockResolvedValue(undefined) };
    const service = new OrganizationService(
      prisma as never,
      { bcryptRounds: 4 } as never,
      { record: jest.fn().mockResolvedValue(undefined) } as never,
      { assertWithinLimit: jest.fn().mockResolvedValue(undefined) } as never,
      email as never,
    );

    await expect(service.addMember("org-a", "owner-a", newUser.email, "ADMIN", newUser.name)).resolves.toBe(membership);

    const createData = transaction.user.create.mock.calls[0][0].data;
    expect(createData).toMatchObject({
      email: newUser.email,
      name: newUser.name,
      role: "EMPLOYEE",
      auth: { create: { emailVerifiedAt: expect.any(Date), mustResetPassword: true } },
    });
    const [sentEmail, sentName, temporaryPassword] = email.sendTemporaryPasswordEmail.mock.calls[0];
    expect([sentEmail, sentName]).toEqual([newUser.email, newUser.name]);
    expect(temporaryPassword).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/);
    expect(await bcrypt.compare(temporaryPassword, createData.auth.create.passwordHash)).toBe(true);
    expect(JSON.stringify(createData)).not.toContain(temporaryPassword);
  });
});
