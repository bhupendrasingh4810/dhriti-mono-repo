import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { HrmsEmployeeFoundationService } from "./hrms-employee-foundation.service";
import { HrmsEmployeeService } from "./hrms-employee.service";

// Explicit opt-in; all fixture employees and history roll back, including failed writes.
const databaseTest = process.env.HRMS_EMPLOYEE_FOUNDATION_DB_INTEGRATION === "true" ? describe : describe.skip;
databaseTest("employee foundation persistence", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());
  it("persists manual decisions and career events without changing employment/payroll and isolates tenants", async () => {
    const rollback = new Error("Rollback employee foundation fixture");
    const today = new Date().toISOString().slice(0, 10);
    await expect(
      prisma.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return <T>(operation: ((client: Prisma.TransactionClient) => Promise<T>) | Promise<unknown>[]) =>
                  Array.isArray(operation) ? Promise.all(operation) : operation(tx);
              }
              return Reflect.get(target, key);
            },
          });
          const org = await tx.organization.create({
            data: { name: "Synthetic foundations", slug: `foundations-${randomUUID()}` },
          });
          const foreign = await tx.organization.create({
            data: { name: "Other synthetic tenant", slug: `foundations-${randomUUID()}` },
          });
          const user = await tx.user.create({
            data: { name: "Synthetic HR", email: `${randomUUID()}@foundation.example.test` },
          });
          const employee = await tx.hrmsEmployee.create({
            data: {
              organizationId: org.id,
              userId: user.id,
              employeeNumber: "FOUNDATION-1",
              status: "ACTIVE",
              startDate: new Date(today),
              resignationDate: new Date(today),
            },
          });
          const employees = new HrmsEmployeeService(transactional as never, {} as never);
          const foundations = new HrmsEmployeeFoundationService(transactional as never, employees);
          const initial = await foundations.lifecycle(org.id, employee.id);
          expect(initial.data.noticePeriodDays).toBeNull();
          const input = {
            action: "CONFIGURE",
            version: 0,
            reason: "Approved initial tracking",
            data: {
              probationEndDate: "2099-01-01",
              contractStartDate: today,
              contractEndDate: "2099-12-31",
              noticePeriodDays: 30,
            },
          };
          const configured = await foundations.updateLifecycle(org.id, employee.id, user.id, input);
          expect(configured.version).toBe(1);
          expect(configured.proposedLastWorkingDate).not.toBeNull();
          await expect(foundations.updateLifecycle(org.id, employee.id, user.id, input)).rejects.toMatchObject({
            status: 409,
          });
          const confirmed = await foundations.updateLifecycle(org.id, employee.id, user.id, {
            action: "CONFIRM_PROBATION",
            version: 1,
            reason: "HR reviewed probation",
            date: today,
          });
          expect(confirmed.probationStatus).toBe("CONFIRMED");
          expect(confirmed.history).toHaveLength(2);
          expect(confirmed.history[0].actor?.id).toBe(user.id);
          const stored = await tx.hrmsEmployee.findUniqueOrThrow({ where: { id: employee.id } });
          expect(stored.status).toBe("ACTIVE");
          expect(stored.endDate).toBeNull();
          expect(await tx.hrmsPayrollRecord.count({ where: { employeeId: employee.id } })).toBe(0);
          expect((await employees.timeline(org.id, employee.id, { page: 1, pageSize: 20 })).items).toHaveLength(2);
          const readiness = await foundations.readiness(org.id, employee.id);
          expect(readiness.checks.find((check) => check.key === "manager")?.status).toBe("ATTENTION");
          expect(readiness.checks.find((check) => check.key === "requiredProfile")?.status).toBe("COMPLETE");
          await expect(foundations.lifecycle(foreign.id, employee.id)).rejects.toMatchObject({ status: 404 });
          await expect(foundations.readiness(foreign.id, employee.id)).rejects.toMatchObject({ status: 404 });
          await expect(foundations.updateLifecycle(foreign.id, employee.id, user.id, input)).rejects.toMatchObject({
            status: 404,
          });
          await expect(
            employees.update(org.id, employee.id, user.id, { reportingManagerId: employee.id }),
          ).rejects.toMatchObject({ status: 400 });
          throw rollback;
        },
        { timeout: 30000 },
      ),
    ).rejects.toBe(rollback);
  });
});
