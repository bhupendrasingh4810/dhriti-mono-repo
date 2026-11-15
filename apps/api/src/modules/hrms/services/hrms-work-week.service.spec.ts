import { HrmsWorkWeekService } from "./hrms-work-week.service";

describe("work-week bulk assignment", () => {
  const employees = Array.from({ length: 1201 }, (_, index) => ({ id: `employee-${index}` }));
  const tx = {
    hrmsEmployee: { findMany: jest.fn() },
    hrmsWorkWeekAssignment: { updateMany: jest.fn(), createMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };
  const service = new HrmsWorkWeekService(prisma as never, {} as never);
  const effectiveFrom = "2099-01-01";
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation((operation: (client: typeof tx) => Promise<unknown>) => operation(tx));
    tx.hrmsEmployee.findMany.mockResolvedValue(employees);
  });

  it("assigns all non-archived tenant employees in bounded statements without a total-count cap", async () => {
    await service.assign("org", "actor", { ruleId: null, effectiveFrom, allEmployees: true });
    expect(tx.hrmsEmployee.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org", deletedAt: null },
      select: { id: true },
    });
    expect(tx.hrmsWorkWeekAssignment.createMany.mock.calls.map(([input]) => input.data.length)).toEqual([
      500, 500, 201,
    ]);
    expect(tx.hrmsWorkWeekAssignment.updateMany).toHaveBeenCalledTimes(3);
    for (const [input] of tx.hrmsWorkWeekAssignment.updateMany.mock.calls) {
      expect(input.where).toMatchObject({ organizationId: "org", effectiveFrom: new Date(effectiveFrom) });
      expect(input.data).toEqual({ ruleId: null });
    }
    expect(tx.hrmsWorkWeekAssignment.createMany.mock.calls.flatMap(([input]) => input.data)).toEqual(
      employees.map(({ id }) => ({
        organizationId: "org",
        employeeId: id,
        ruleId: null,
        effectiveFrom: new Date(effectiveFrom),
      })),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: { allEmployees: true, employeeCount: 1201, ruleId: null, effectiveFrom },
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });

  it("supports more than 100 specifically selected employees", async () => {
    const employeeIds = employees.map(({ id }) => id);
    await service.assign("org", "actor", { ruleId: null, effectiveFrom, employeeIds });
    expect(tx.hrmsEmployee.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org", deletedAt: null, id: { in: employeeIds } },
      select: { id: true },
    });
    expect(tx.hrmsWorkWeekAssignment.createMany).toHaveBeenCalledTimes(3);
  });

  it("rejects foreign/missing employees before writing any assignments", async () => {
    tx.hrmsEmployee.findMany.mockResolvedValue([{ id: "local" }]);
    await expect(
      service.assign("org", "actor", {
        ruleId: null,
        effectiveFrom,
        employeeIds: ["local", "foreign"],
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(tx.hrmsWorkWeekAssignment.createMany).not.toHaveBeenCalled();
  });

  it("rejects ambiguous targets and empty organizations explicitly", async () => {
    await expect(
      service.assign("org", "actor", {
        ruleId: null,
        effectiveFrom,
        allEmployees: true,
        employeeIds: ["local"],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(service.assign("org", "actor", { ruleId: null, effectiveFrom })).rejects.toMatchObject({
      status: 400,
    });
    tx.hrmsEmployee.findMany.mockResolvedValue([]);
    await expect(
      service.assign("org", "actor", {
        ruleId: null,
        effectiveFrom,
        allEmployees: true,
      }),
    ).rejects.toThrow("No employees");
    expect(tx.hrmsWorkWeekAssignment.createMany).not.toHaveBeenCalled();
  });
});
