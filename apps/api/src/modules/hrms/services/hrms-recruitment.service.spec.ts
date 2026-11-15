import { HrmsRecruitmentService } from "./hrms-recruitment.service";

function setup() {
  const db = {
    hrmsRecruitmentGrant: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
    organizationMember: { findFirst: jest.fn(), findMany: jest.fn() },
    hrmsJobOpening: {
      updateMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    hrmsRecruitmentCandidate: { count: jest.fn() },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation(async (run: unknown) =>
    Array.isArray(run) ? Promise.all(run) : (run as (tx: typeof db) => unknown)(db),
  );
  const permissions = { isOrganizationAdministrator: jest.fn().mockResolvedValue(false) };
  return { db, permissions, service: new HrmsRecruitmentService(db as never, permissions as never) };
}

describe("HrmsRecruitmentService", () => {
  it("finds interviewers only among active employees with active tenant membership", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentGrant.findUnique.mockResolvedValue({ role: "MANAGER" });
    db.organizationMember.findMany.mockResolvedValue([]);
    await service.interviewers("org", "manager", "Alex", 1);
    expect(db.organizationMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org",
          status: "ACTIVE",
          deletedAt: null,
          user: expect.objectContaining({
            status: "ACTIVE",
            deletedAt: null,
            hrmsEmployees: { some: { organizationId: "org", status: "ACTIVE", deletedAt: null } },
          }),
        }),
      }),
    );
  });
  it("denies unrestricted opening operations to an interviewer", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentGrant.findUnique.mockResolvedValue({ role: "INTERVIEWER" });
    await expect(service.openings("org", "interviewer", 1)).rejects.toThrow("Recruitment manager access is required");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("only lets organization administrators assign grants", async () => {
    const { db, service } = setup();
    await expect(
      service.setGrant("org", "actor", { userId: "5f65bd02-7086-40a8-919a-7cc6e083400a", role: "MANAGER" }),
    ).rejects.toThrow("Only organization administrators");
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("validates target membership in the current tenant before granting access", async () => {
    const { db, permissions, service } = setup();
    permissions.isOrganizationAdministrator.mockResolvedValue(true);
    db.organizationMember.findFirst.mockResolvedValue(null);
    const userId = "5f65bd02-7086-40a8-919a-7cc6e083400a";
    await expect(service.setGrant("org", "actor", { userId, role: "MANAGER" })).rejects.toThrow(
      "active organization member",
    );
    expect(db.organizationMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org", userId }) }),
    );
    expect(db.hrmsRecruitmentGrant.upsert).not.toHaveBeenCalled();
  });
  it("checks tenant and revision when changing an opening status", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentGrant.findUnique.mockResolvedValue({ role: "MANAGER" });
    db.hrmsJobOpening.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.changeStatus("org", "manager", "opening", { status: "OPEN", revision: 3 })).rejects.toThrow(
      "changed or was not found",
    );
    expect(db.hrmsJobOpening.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "opening", organizationId: "org", revision: 3 } }),
    );
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it("calculates recruitment KPIs for the tenant without counting declined offers as hires", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentGrant.findUnique.mockResolvedValue({ role: "MANAGER" });
    db.hrmsJobOpening.findMany.mockResolvedValue([]);
    db.hrmsJobOpening.count.mockResolvedValueOnce(8).mockResolvedValueOnce(4);
    db.hrmsRecruitmentCandidate.count.mockResolvedValueOnce(20).mockResolvedValueOnce(5).mockResolvedValueOnce(3);
    await expect(service.openings("org", "manager", 1)).resolves.toEqual({
      items: [],
      total: 8,
      open: 4,
      applied: 20,
      interviews: 5,
      hired: 3,
    });
    expect(db.hrmsRecruitmentCandidate.count).toHaveBeenLastCalledWith({
      where: { organizationId: "org", stage: { systemKey: "HIRED" }, OR: [{ outcome: null }, { outcome: "JOINED" }] },
    });
  });
  it("persists opening fields with a date-only value and a private compensation range", async () => {
    const { db, service } = setup();
    db.hrmsRecruitmentGrant.findUnique.mockResolvedValue({ role: "MANAGER" });
    db.hrmsJobOpening.create.mockResolvedValue({ id: "opening" });
    const input = {
      title: "Engineer",
      department: "Product",
      location: "Remote",
      employmentType: "FULL_TIME",
      workMode: "REMOTE",
      description: "Build products\nand services",
      companyName: "Example",
      experienceMin: 2,
      experienceMax: 5,
      ctcMin: "120.50",
      ctcMax: "240.75",
      ctcCurrency: "INR",
      ctcPeriod: "YEAR",
      ctcNotDisclosed: true,
      postedDate: "2026-11-15",
      openingsCount: 3,
      highlights: "Flexible schedule",
      keySkills: ["TypeScript", "React"],
    };
    await service.createOpening("org", "manager", input);
    expect(db.hrmsJobOpening.create).toHaveBeenCalledWith({
      data: {
        ...input,
        postedDate: new Date("2026-11-15T00:00:00.000Z"),
        organizationId: "org",
        createdById: "manager",
      },
    });
  });
  it.each([
    { experienceMin: 5, experienceMax: 2 },
    { ctcMin: "500.00", ctcMax: "200.00" },
    { ctcNotDisclosed: false, ctcMin: null, ctcMax: null },
    { postedDate: "2026-02-30" },
    { openingsCount: 0 },
  ])("rejects invalid opening data: %p", async (changes) => {
    const { db, service } = setup();
    db.hrmsRecruitmentGrant.findUnique.mockResolvedValue({ role: "MANAGER" });
    await expect(
      service.createOpening("org", "manager", {
        title: "Engineer",
        department: "Product",
        location: "Remote",
        employmentType: "FULL_TIME",
        workMode: "REMOTE",
        description: "Build products",
        ...changes,
      }),
    ).rejects.toThrow();
    expect(db.hrmsJobOpening.create).not.toHaveBeenCalled();
  });
});
