import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { HrmsPayrollWorkspaceService } from "./hrms-payroll-workspace.service";
import { HrmsOperationsService } from "./hrms-operations.service";

// Opt-in only: exercise real constraints/outbox writes, then roll back every synthetic record.
const databaseTest = process.env.PAYROLL_DB_INTEGRATION === "true" ? describe : describe.skip;

databaseTest("payroll database integration", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());

  it("persists all calendar frequencies, disjoint same-month records and exact-period inputs with real overlap protection", async () => {
    const slug = `calendar-test-${randomUUID()}`;
    const rollback = new Error("Rollback calendar fixture");
    await expect(
      prisma.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return <T>(callback: (client: Prisma.TransactionClient) => Promise<T>) => callback(tx);
              }
              return Reflect.get(target, key);
            },
          });
          const audit = { record: jest.fn().mockResolvedValue(undefined) };
          const service = new HrmsPayrollWorkspaceService(transactional as never, audit as never);
          const legacy = new HrmsOperationsService(transactional as never, audit as never, {} as never);
          const org = await tx.organization.create({
            data: { name: "Synthetic calendar fixture", slug, countryCode: "IN" },
          });
          const preparer = await tx.user.create({
            data: { email: `${randomUUID()}@payroll.example.test`, name: "Calendar preparer" },
          });
          const approver = await tx.user.create({
            data: { email: `${randomUUID()}@payroll.example.test`, name: "Calendar approver" },
          });
          for (const frequency of ["WEEKLY", "BIWEEKLY", "SEMIMONTHLY"] as const) {
            const user = await tx.user.create({
              data: { email: `${randomUUID()}@payroll.example.test`, name: "Calendar employee" },
            });
            const employee = await tx.hrmsEmployee.create({
              data: {
                organizationId: org.id,
                userId: user.id,
                employeeNumber: frequency,
                status: "ACTIVE",
                startDate: new Date("2026-01-01"),
              },
            });
            const effectiveFrom = frequency === "SEMIMONTHLY" ? "2026-11-01" : "2026-11-02";
            const profile = await service.profile(org.id, preparer.id, {
              name: frequency,
              frequency,
              countryCode: "IN",
              currency: "INR",
              minorUnits: 2,
              effectiveFrom,
              calendarAnchor: frequency === "SEMIMONTHLY" ? undefined : effectiveFrom,
              payDateOffset: 2,
              employmentModel: "EMPLOYEE",
              rulesVerified: true,
            });
            const structure = await service.structure(org.id, preparer.id, {
              profileId: profile.id,
              name: "Calendar salary",
              components: [
                { code: "BASIC", name: "Basic", type: "EARNING", calculation: "REMAINDER", value: "0" },
                {
                  code: "DEDUCTION",
                  name: "Configured deduction",
                  type: "DEDUCTION",
                  calculation: "FIXED",
                  value: "100.25",
                },
              ],
            });
            await service.assign(org.id, preparer.id, {
              employeeId: employee.id,
              structureId: structure.id,
              monthlyGross: "10000",
              effectiveFrom,
            });
            const periods = await service.calendar(org.id, profile.id, 2026);
            const chosen = periods.filter((period) => period.start >= effectiveFrom).slice(0, 2);
            expect(chosen).toHaveLength(2);
            const snapshots = [];
            for (const period of chosen) {
              const draft = await service.createRun(org.id, preparer.id, {
                profileId: profile.id,
                period: period.key,
                payDate: period.payDate,
                prorationPolicy: "CALENDAR_DAYS",
              });
              const approved = await service.transition(org.id, approver.id, draft.id, "approve");
              const canonical = await tx.hrmsPayrollRecord.findFirstOrThrow({ where: { runId: approved.id } });
              expect(canonical.periodStart.toISOString().slice(0, 10)).toBe(period.start);
              expect(canonical.periodEnd.toISOString().slice(0, 10)).toBe(period.end);
              const processed = await service.transition(org.id, preparer.id, approved.id, "process");
              expect(processed.snapshot).toEqual(approved.snapshot);
              snapshots.push(canonical);
            }
            expect(
              await tx.hrmsPayrollRecord.count({ where: { organizationId: org.id, employeeId: employee.id } }),
            ).toBe(2);
            if (frequency === "SEMIMONTHLY") {
              expect(snapshots[0].grossSalary + snapshots[1].grossSalary).toBe(10000);
              expect(snapshots[0].totalDeductions + snapshots[1].totalDeductions).toBe(100.25);
            }
            await expect(
              legacy.createPayroll(org.id, preparer.id, {
                employeeId: employee.id,
                period: `Custom overlapping ${frequency}`,
                periodStart: chosen[0].start,
                periodEnd: chosen[0].end,
                payDate: chosen[0].payDate,
                grossSalary: 1,
                totalDeductions: 0,
                netPay: 1,
                currency: "INR",
              }),
            ).rejects.toMatchObject({ status: 409 });
            if (frequency === "BIWEEKLY") {
              const crossMonth = periods.find(
                (period) => period.start.slice(0, 7) === "2026-11" && period.end.slice(0, 7) === "2026-12",
              );
              expect(crossMonth).toBeDefined();
              if (!crossMonth) {
                throw new Error("Expected cross-month fixture period");
              }
              const variable = await service.variableInput(org.id, preparer.id, {
                employeeId: employee.id,
                profileId: profile.id,
                name: "Approved cross-month hours",
                type: "EARNING",
                calculation: "HOURS",
                quantity: "10.5",
                rate: "125.25",
                multiplier: "1.5",
                targetPeriod: crossMonth.key,
                startPeriod: crossMonth.start.slice(0, 7),
                endPeriod: crossMonth.end.slice(0, 7),
                reason: "Timesheet CAL-100",
              });
              const input = {
                profileId: profile.id,
                period: crossMonth.key,
                payDate: crossMonth.payDate,
                prorationPolicy: "CALENDAR_DAYS" as const,
              };
              const draft = await service.createRun(org.id, preparer.id, input);
              await expect(service.transition(org.id, approver.id, draft.id, "approve")).rejects.toThrow(
                "Pending variable",
              );
              await service.decideVariable(org.id, approver.id, variable.id, { action: "APPROVE" });
              const approved = await service.transition(org.id, approver.id, draft.id, "approve");
              expect(approved.snapshot).toMatchObject({
                periodStart: crossMonth.start,
                periodEnd: crossMonth.end,
                salaryAllocation: "MONTHLY_CALENDAR",
                items: [{ variableInputs: [{ id: variable.id, targetPeriod: crossMonth.key, amount: "1972.69" }] }],
              });
              // A legacy free-text date overlap must block the next approval too, not only duplicate month keys.
              const next = periods[periods.findIndex((period) => period.key === crossMonth.key) + 1];
              await legacy.createPayroll(org.id, preparer.id, {
                employeeId: employee.id,
                period: "Legacy custom dates",
                periodStart: next.start,
                periodEnd: next.end,
                payDate: next.payDate,
                grossSalary: 1,
                totalDeductions: 0,
                netPay: 1,
                currency: "INR",
              });
              const conflicting = await service.createRun(org.id, preparer.id, {
                ...input,
                period: next.key,
                payDate: next.payDate,
              });
              await expect(service.transition(org.id, approver.id, conflicting.id, "approve")).rejects.toMatchObject({
                status: 409,
              });
              expect(
                (await service.preview(org.id, { ...input, period: next.key, payDate: next.payDate })).items[0]
                  .variableInputs,
              ).toEqual([]);
            }
          }
          throw rollback;
        },
        { timeout: 60000 },
      ),
    ).rejects.toBe(rollback);
    expect(await prisma.organization.count({ where: { slug } })).toBe(0);
  }, 70000);

  it("persists configuration, approvals, canonical records, claims and sandbox states without moving funds", async () => {
    const slug = `payroll-test-${randomUUID()}`;
    const rollback = new Error("Rollback payroll integration fixture");
    await expect(
      prisma.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return <T>(callback: (client: Prisma.TransactionClient) => Promise<T>) => callback(tx);
              }
              return Reflect.get(target, key);
            },
          });
          const audit = { record: jest.fn().mockResolvedValue(undefined) };
          const service = new HrmsPayrollWorkspaceService(transactional as never, audit as never);
          const organization = await tx.organization.create({
            data: { name: "Payroll integration fixture", slug, countryCode: "IN" },
          });
          const employeeUser = await tx.user.create({
            data: { email: `${randomUUID()}@payroll.example.test`, name: "Synthetic Payroll Employee" },
          });
          const preparer = await tx.user.create({
            data: { email: `${randomUUID()}@payroll.example.test`, name: "Synthetic Preparer" },
          });
          const approver = await tx.user.create({
            data: { email: `${randomUUID()}@payroll.example.test`, name: "Synthetic Approver" },
          });
          const employee = await tx.hrmsEmployee.create({
            data: {
              organizationId: organization.id,
              userId: employeeUser.id,
              employeeNumber: "PAYROLL-TEST-1",
              status: "ACTIVE",
              startDate: new Date("2026-01-01"),
            },
          });
          const profile = await service.profile(organization.id, preparer.id, {
            name: "India test group",
            countryCode: "IN",
            currency: "INR",
            minorUnits: 2,
            frequency: "MONTHLY",
            employmentModel: "EMPLOYEE",
            rulesVerified: true,
            effectiveFrom: "2026-01-01",
          });
          const structure = await service.structure(organization.id, preparer.id, {
            profileId: profile.id,
            name: "Test salary",
            components: [
              { code: "BASIC", name: "Basic", type: "EARNING", calculation: "PERCENT_GROSS", value: "50" },
              { code: "ALLOWANCE", name: "Allowance", type: "EARNING", calculation: "REMAINDER", value: "0" },
              {
                code: "DEDUCTION",
                name: "Configured deduction",
                type: "DEDUCTION",
                calculation: "FIXED",
                value: "100.25",
              },
              {
                code: "EMPLOYER",
                name: "Employer contribution",
                type: "EMPLOYER",
                calculation: "PERCENT_COMPONENT",
                basis: "BASIC",
                value: "12",
              },
            ],
          });
          const salaryInput = {
            employeeId: employee.id,
            structureId: structure.id,
            monthlyGross: "10000",
            effectiveFrom: "2026-01-01",
          };
          await service.assign(organization.id, preparer.id, salaryInput);
          const claim = await service.claim(organization.id, preparer.id, {
            employeeId: employee.id,
            title: "Synthetic travel",
            amount: "25.10",
            currency: "INR",
            expenseDate: "2026-11-01",
            receiptReference: "TEST-RECEIPT",
          });
          await expect(service.approveClaim(organization.id, employeeUser.id, claim.id)).rejects.toThrow("own expense");
          await service.approveClaim(organization.id, approver.id, claim.id);
          const input = { profileId: profile.id, period: "2026-11", payDate: "2026-11-30" };
          // Closed drafts release only the active-scope key, never their retained snapshots.
          const correctionInput = { ...input, period: "2026-10", payDate: "2026-10-31" };
          const cancelled = await service.createRun(organization.id, preparer.id, correctionInput);
          await service.closeDraft(organization.id, preparer.id, cancelled.id, "cancel", "Correct salary inputs");
          const rejected = await service.createRun(organization.id, preparer.id, correctionInput);
          await service.closeDraft(
            organization.id,
            approver.id,
            rejected.id,
            "reject",
            "Finance needs corrected inputs",
          );
          const replacement = await service.createRun(organization.id, preparer.id, correctionInput);
          expect(replacement.id).not.toBe(rejected.id);
          await tx.$executeRaw`SAVEPOINT payroll_duplicate_draft`;
          await expect(service.createRun(organization.id, preparer.id, correctionInput)).rejects.toMatchObject({
            status: 409,
          });
          await tx.$executeRaw`ROLLBACK TO SAVEPOINT payroll_duplicate_draft`;
          expect(
            await tx.hrmsPayrollRun.findMany({
              where: { organizationId: organization.id, period: "2026-10" },
              orderBy: { createdAt: "asc" },
            }),
          ).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: cancelled.id,
                status: "CANCELLED",
                closureReason: "Correct salary inputs",
              }),
              expect.objectContaining({ id: rejected.id, status: "REJECTED", closedById: approver.id }),
              expect.objectContaining({ id: replacement.id, status: "DRAFT" }),
            ]),
          );

          // Exercise real date/type queries, including an inactive leaver, without modifying an approved run.
          const unpaidType = await tx.hrmsLeaveType.create({
            data: { organizationId: organization.id, name: "Synthetic unpaid", code: "TEST_UNPAID", isPaid: false },
          });
          await tx.hrmsLeaveRequest.create({
            data: {
              organizationId: organization.id,
              employeeId: employee.id,
              leaveTypeId: unpaidType.id,
              leaveType: "UNPAID_LEAVE",
              status: "APPROVED",
              startDate: new Date("2026-09-11"),
              endDate: new Date("2026-09-11"),
              totalDays: 1,
            },
          });
          await tx.hrmsEmployee.update({
            where: { id: employee.id },
            data: { status: "INACTIVE", endDate: new Date("2026-09-15") },
          });
          const leaver = await service.preview(organization.id, {
            ...input,
            period: "2026-09",
            payDate: "2026-09-30",
            prorationPolicy: "CALENDAR_DAYS",
          });
          expect(leaver.items[0]).toMatchObject({
            gross: "4666.66",
            deductions: "46.78",
            net: "4619.88",
            proration: { periodDays: 30, employmentDays: 15, unpaidDays: 1 },
          });
          expect(leaver.warnings).toEqual([]);
          await tx.hrmsEmployee.update({ where: { id: employee.id }, data: { status: "ACTIVE", endDate: null } });

          const preview = await service.preview(organization.id, input);
          expect(preview.totalNet).toBe("9924.85");
          expect(preview.items[0]).toMatchObject({ monthlyCtc: "10600.00", annualCtc: "127200.00" });
          const run = await service.createRun(organization.id, preparer.id, input);
          await expect(service.transition(organization.id, preparer.id, run.id, "approve")).rejects.toThrow(
            "different payroll approver",
          );
          const approved = await service.transition(organization.id, approver.id, run.id, "approve");
          expect(approved.status).toBe("APPROVED");
          await expect(
            service.closeDraft(organization.id, preparer.id, run.id, "cancel", "Too late to close"),
          ).rejects.toThrow("Only a draft");
          const canonical = await tx.hrmsPayrollRecord.findFirstOrThrow({
            where: { organizationId: organization.id, runId: run.id },
          });
          expect(canonical).toMatchObject({
            employeeId: employee.id,
            period: "2026-11",
            status: "APPROVED",
            netPay: 9924.85,
          });
          const legacy = new HrmsOperationsService(transactional as never, audit as never, {} as never);
          await expect(legacy.approvePayroll(organization.id, canonical.id, approver.id)).rejects.toThrow(
            "through its payroll run",
          );
          await expect(
            legacy.createPayroll(organization.id, preparer.id, {
              employeeId: employee.id,
              period: "November custom label",
              periodStart: "2026-11-01",
              periodEnd: "2026-11-30",
              payDate: "2026-11-30",
              grossSalary: 10000,
              totalDeductions: 100,
              netPay: 9900,
              currency: "INR",
            }),
          ).rejects.toMatchObject({ status: 409 });
          await expect(service.assign(organization.id, preparer.id, salaryInput)).rejects.toThrow("arrears");
          const processed = await service.transition(organization.id, preparer.id, run.id, "process");
          expect(processed.status).toBe("PROCESSED");
          expect(processed.snapshot).toEqual(approved.snapshot);
          expect(await tx.hrmsExpenseClaim.findUniqueOrThrow({ where: { id: claim.id } })).toMatchObject({
            status: "IN_PAYROLL",
            runId: run.id,
          });
          expect(
            await tx.notificationOutbox.count({
              where: { organizationId: organization.id, type: "HRMS_PAYROLL", recipientId: employeeUser.id },
            }),
          ).toBe(1);
          const submitted = await service.sandbox(organization.id, approver.id, run.id, {
            action: "SUBMIT",
            confirmSandbox: true,
          });
          const repeated = await service.sandbox(organization.id, approver.id, run.id, {
            action: "SUBMIT",
            confirmSandbox: true,
          });
          expect(repeated.sandboxReference).toBe(submitted.sandboxReference);
          expect(
            await service.sandbox(organization.id, approver.id, run.id, { action: "SETTLE", confirmSandbox: true }),
          ).toMatchObject({
            sandboxOnly: true,
            realFundsMoved: false,
            sandboxStatus: "SIMULATED_SETTLED",
            status: "PROCESSED",
          });
          const workspace = await service.workspace(organization.id);
          expect(workspace.assignments[0].breakdown.monthlyCtc).toBe("10600.00");
          expect(workspace.records).toHaveLength(1);
          expect(audit.record).toHaveBeenCalled();
          await tx.hrmsEmployee.update({
            where: { id: employee.id },
            data: { status: "INACTIVE", endDate: new Date("2026-09-15") },
          });
          const calendarRun = await service.createRun(organization.id, preparer.id, {
            ...input,
            period: "2026-09",
            payDate: "2026-09-30",
            prorationPolicy: "CALENDAR_DAYS",
          });
          const calendarApproved = await service.transition(organization.id, approver.id, calendarRun.id, "approve");
          expect(calendarApproved.totalNet.toFixed(2)).toBe("4619.88");
          await tx.hrmsEmployee.update({ where: { id: employee.id }, data: { status: "ACTIVE", endDate: null } });
          const calendarProcessed = await service.transition(organization.id, preparer.id, calendarRun.id, "process");
          expect(calendarProcessed.snapshot).toEqual(calendarApproved.snapshot);
          expect(calendarProcessed.totalNet.toFixed(2)).toBe("4619.88");
          // An existing legacy employee/month row must prevent a second approval, even via the new run API.
          await legacy.createPayroll(organization.id, preparer.id, {
            employeeId: employee.id,
            period: "December custom label",
            periodStart: "2026-12-01",
            periodEnd: "2026-12-31",
            payDate: "2026-12-31",
            grossSalary: 10000,
            totalDeductions: 100.25,
            netPay: 9899.75,
            currency: "INR",
          });
          const conflicting = await service.createRun(organization.id, preparer.id, {
            ...input,
            period: "2026-12",
            payDate: "2026-12-31",
          });
          await expect(
            service.transition(organization.id, approver.id, conflicting.id, "approve"),
          ).rejects.toMatchObject({ status: 409 });

          const variableBase = {
            employeeId: employee.id,
            profileId: profile.id,
            name: "Synthetic bonus",
            type: "EARNING" as const,
            calculation: "FIXED" as const,
            quantity: "1",
            rate: "1000",
            multiplier: "1",
            startPeriod: "2027-01",
            endPeriod: "2027-01",
            reason: "Synthetic approved award",
          };
          const bonus = await service.variableInput(organization.id, preparer.id, variableBase);
          const january = { ...input, period: "2027-01", payDate: "2027-01-31" };
          const variableDraft = await service.createRun(organization.id, preparer.id, january);
          await expect(service.transition(organization.id, approver.id, variableDraft.id, "approve")).rejects.toThrow(
            "Pending variable",
          );
          await expect(
            service.decideVariable(organization.id, preparer.id, bonus.id, { action: "APPROVE" }),
          ).rejects.toThrow("different");
          await expect(
            service.decideVariable(organization.id, employeeUser.id, bonus.id, { action: "APPROVE" }),
          ).rejects.toThrow("own variable");
          await expect(
            service.decideVariable(randomUUID(), approver.id, bonus.id, { action: "APPROVE" }),
          ).rejects.toThrow("Only a pending");
          await service.decideVariable(organization.id, approver.id, bonus.id, { action: "APPROVE" });
          for (const extra of [
            {
              name: "Synthetic overtime",
              type: "EARNING" as const,
              calculation: "HOURS" as const,
              quantity: "10.5",
              rate: "125.25",
              multiplier: "1.5",
            },
            { name: "Synthetic recovery", type: "DEDUCTION" as const, rate: "200" },
            { name: "Synthetic employer cost", type: "EMPLOYER" as const, rate: "50" },
          ]) {
            const created = await service.variableInput(organization.id, preparer.id, { ...variableBase, ...extra });
            await service.decideVariable(organization.id, approver.id, created.id, { action: "APPROVE" });
          }
          const variableApproved = await service.transition(organization.id, approver.id, variableDraft.id, "approve");
          expect(variableApproved.totalNet.toFixed(2)).toBe("12672.44");
          expect(variableApproved.snapshot).toMatchObject({
            items: [
              {
                gross: "12972.69",
                deductions: "300.25",
                monthlyCtc: "10600.00",
                variance: { previousPeriod: "2026-11", netDelta: "2747.59" },
              },
            ],
          });
          expect(variableApproved.snapshot).toHaveProperty("items.0.variableInputs.length", 4);
          await expect(service.variableInput(organization.id, preparer.id, variableBase)).rejects.toThrow("overlaps");
          await expect(
            service.decideVariable(organization.id, preparer.id, bonus.id, { action: "CANCEL" }),
          ).rejects.toThrow("Only a pending");
          const variableProcessed = await service.transition(organization.id, preparer.id, variableDraft.id, "process");
          expect(variableProcessed.snapshot).toEqual(variableApproved.snapshot);
          expect(
            (await service.preview(organization.id, { ...january, period: "2027-02", payDate: "2027-02-28" })).items[0]
              .variableInputs,
          ).toEqual([]);
          const recurring = await service.variableInput(organization.id, preparer.id, {
            ...variableBase,
            name: "Synthetic temporary allowance",
            rate: "300",
            startPeriod: "2027-02",
            endPeriod: "2027-03",
          });
          await service.decideVariable(organization.id, approver.id, recurring.id, { action: "APPROVE" });
          for (const [period, payDate] of [
            ["2027-02", "2027-02-28"],
            ["2027-03", "2027-03-31"],
          ]) {
            const result = await service.preview(organization.id, { ...january, period, payDate });
            expect(result.items[0].gross).toBe("10300.00");
            expect(result.items[0].variableInputs.map((entry) => entry.id)).toEqual([recurring.id]);
          }
          expect(
            (
              await service.preview(organization.id, {
                ...january,
                period: "2027-04",
                payDate: "2027-04-30",
              })
            ).items[0].variableInputs,
          ).toEqual([]);
          throw rollback;
        },
        { timeout: 30000 },
      ),
    ).rejects.toBe(rollback);
    expect(await prisma.organization.count({ where: { slug } })).toBe(0);
  }, 40000);
});
