import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { AppSettingsService } from "../../settings/app-settings.service";
import { HrmsWorkWeekService } from "./hrms-work-week.service";
import { legacyWorkWeekPattern } from "../work-week";
import { HrmsLeaveCenterService } from "./hrms-leave-center.service";
import { HrmsOperationsService } from "./hrms-operations.service";

// Explicit opt-in; fixture organizations, settings, rules, assignments and audit history all roll back.
const databaseTest = process.env.HRMS_WORK_WEEK_DB_INTEGRATION === "true" ? describe : describe.skip;

databaseTest("work-week persistence", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());

  it("preserves historical defaults, resolves assignments and dated patterns, and audits atomically", async () => {
    const rollback = new Error("Rollback work-week fixture");
    await expect(
      prisma.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return <T>(operation: (client: Prisma.TransactionClient) => Promise<T>) => operation(tx);
              }
              return Reflect.get(target, key);
            },
          });
          const org = await tx.organization.create({
            data: { name: "Synthetic work-week fixture", slug: `work-week-${randomUUID()}` },
          });
          const actor = await tx.user.create({
            data: { name: "Synthetic HR", email: `${randomUUID()}@workweek.example.test` },
          });
          const employee = await tx.hrmsEmployee.create({
            data: { organizationId: org.id, userId: actor.id, employeeNumber: "WW-1", status: "ACTIVE" },
          });
          const foreign = await tx.organization.create({
            data: { name: "Other synthetic tenant", slug: `work-week-${randomUUID()}` },
          });
          const settings = new AppSettingsService(transactional as never);
          const service = new HrmsWorkWeekService(transactional as never, settings);
          const pattern = legacyWorkWeekPattern([1, 2, 3, 4, 5]);
          pattern.forEach((week) => {
            week[5] = "HALF_DAY";
          });
          await expect(
            service.create(org.id, actor.id, { name: "Invalid past rule", pattern, effectiveFrom: "2000-01-01" }),
          ).rejects.toMatchObject({ status: 400 });
          const rule = await service.create(org.id, actor.id, {
            name: "Saturday Half Day",
            pattern,
            effectiveFrom: "2099-01-01",
          });
          const baseline = (await service.list(org.id)).rules.find((item) => item.name === "Original work week");
          expect(baseline).toBeDefined();
          await service.setDefault(org.id, actor.id, rule.id, "2099-01-01");
          expect(
            (await service.schedule(org.id, employee.id, "2026-08-01", "2026-08-02")).days.map((day) => day.units),
          ).toEqual([0, 0]);
          const january = await service.schedule(org.id, employee.id, "2099-01-01", "2099-01-31");
          const saturday = january.days.find((day) => new Date(day.date).getUTCDay() === 6);
          expect(saturday?.units).toBe(0.5);
          if (!saturday) {
            throw new Error("Missing synthetic Saturday");
          }
          const audit = { record: jest.fn().mockResolvedValue(undefined) };
          const leave = new HrmsLeaveCenterService(transactional as never, audit as never, settings);
          const leaveType = await tx.hrmsLeaveType.create({
            data: {
              organizationId: org.id,
              name: "Synthetic unpaid",
              code: "SYNTHETIC_UNPAID",
              category: "UNPAID_LEAVE",
              annualDays: 0,
              allowHalfDay: false,
              isPaid: false,
            },
          });
          await tx.hrmsOrganizationSettings.update({
            where: { organizationId: org.id },
            data: { allowHalfDayLeave: false },
          });
          const savedLeave = await leave.apply(
            org.id,
            actor.id,
            {
              leaveTypeId: leaveType.id,
              startDate: saturday.date,
              endDate: saturday.date,
              totalDays: 0.5,
              reason: "Synthetic scheduled half-day",
            },
            false,
          );
          expect(savedLeave.totalDays).toBe(0.5);
          expect(savedLeave.dayAllocation).toEqual([
            { date: saturday.date, units: 0.5, ruleId: rule.id, versionId: saturday.versionId },
          ]);
          const fullDay = january.days.find((day) => day.units === 1);
          if (!fullDay) {
            throw new Error("Missing synthetic full day");
          }
          await expect(
            leave.apply(
              org.id,
              actor.id,
              {
                leaveTypeId: leaveType.id,
                startDate: fullDay.date,
                endDate: fullDay.date,
                totalDays: 0.5,
              },
              false,
            ),
          ).rejects.toMatchObject({ status: 400 });
          const operations = new HrmsOperationsService(transactional as never, audit as never, settings);
          const legacyLeave = await operations.createLeave(org.id, actor.id, {
            employeeId: employee.id,
            leaveType: "UNPAID_LEAVE",
            startDate: saturday.date,
            endDate: saturday.date,
            totalDays: 0.5,
          });
          expect(legacyLeave.dayAllocation).toEqual(savedLeave.dayAllocation);
          const laterPattern = legacyWorkWeekPattern([1, 2, 3, 4, 5, 6]);
          await service.update(org.id, actor.id, rule.id, {
            name: rule.name,
            revision: rule.revision,
            pattern: laterPattern,
            effectiveFrom: "2099-02-01",
          });
          expect((await service.schedule(org.id, employee.id, "2099-01-01", "2099-01-31")).days).toEqual(january.days);
          expect((await tx.hrmsLeaveRequest.findUniqueOrThrow({ where: { id: savedLeave.id } })).dayAllocation).toEqual(
            savedLeave.dayAllocation,
          );
          expect(
            (await service.schedule(org.id, employee.id, "2099-02-01", "2099-02-28")).days
              .filter((day) => new Date(day.date).getUTCDay() === 6)
              .every((day) => day.units === 1),
          ).toBe(true);
          await expect(
            service.update(org.id, actor.id, rule.id, {
              name: rule.name,
              revision: 1,
              pattern,
              effectiveFrom: "2099-03-01",
            }),
          ).rejects.toMatchObject({ status: 409 });
          const sunday = await service.create(org.id, actor.id, {
            name: "Sunday off",
            pattern: laterPattern,
            effectiveFrom: "2099-01-01",
          });
          await service.assign(org.id, actor.id, {
            ruleId: sunday.id,
            employeeIds: [employee.id],
            effectiveFrom: "2099-01-01",
          });
          expect(
            (await service.schedule(org.id, employee.id, "2099-01-01", "2099-01-31")).days.find(
              (day) => day.date === saturday?.date,
            )?.units,
          ).toBe(1);
          await service.assign(org.id, actor.id, {
            ruleId: null,
            employeeIds: [employee.id],
            effectiveFrom: "2099-01-15",
          });
          expect((await service.assignments(org.id, employee.id)).map((item) => item.ruleId)).toEqual([
            null,
            sunday.id,
          ]);
          expect(
            (await service.schedule(org.id, employee.id, "2099-01-15", "2099-01-31")).days
              .filter((day) => new Date(day.date).getUTCDay() === 6)
              .every((day) => day.units === 0.5),
          ).toBe(true);
          await expect(service.remove(org.id, actor.id, rule.id)).rejects.toMatchObject({ status: 409 });
          await expect(service.remove(org.id, actor.id, sunday.id)).rejects.toMatchObject({ status: 409 });
          const unused = await service.create(org.id, actor.id, {
            name: "Unused copy",
            pattern,
            effectiveFrom: "2099-01-01",
          });
          await service.remove(org.id, actor.id, unused.id);
          expect(await tx.hrmsWorkWeekRule.count({ where: { id: unused.id } })).toBe(0);
          await expect(service.schedule(foreign.id, employee.id, "2099-01-01", "2099-01-01")).rejects.toMatchObject({
            status: 404,
          });
          await expect(service.setDefault(foreign.id, actor.id, rule.id, "2099-01-01")).rejects.toMatchObject({
            status: 404,
          });
          await expect(
            service.assign(org.id, actor.id, {
              ruleId: sunday.id,
              employeeIds: [randomUUID()],
              effectiveFrom: "2099-01-01",
            }),
          ).rejects.toMatchObject({ status: 404 });
          expect((await service.list(foreign.id)).rules).toEqual([]);
          expect(
            await tx.auditLog.count({ where: { organizationId: org.id, action: { startsWith: "hrms.work_week." } } }),
          ).toBe(8);
          throw rollback;
        },
        { timeout: 30000 },
      ),
    ).rejects.toBe(rollback);
  });
});
