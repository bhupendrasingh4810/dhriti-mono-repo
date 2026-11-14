import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  ExpenseClaimDto,
  PayrollProfileDto,
  PayrollRunDecisionDto,
  PayrollRunDto,
  SalaryStructureDto,
  VariablePayInputDto,
} from "./hrms-payroll-workspace.dto";

describe("payroll request validation", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  it("accepts configured frequencies/exact start keys and rejects malformed calendar settings", async () => {
    const profile = {
      name: "Configured calendar",
      countryCode: "IN",
      currency: "INR",
      minorUnits: 2,
      effectiveFrom: "2026-01-05",
      calendarAnchor: "2026-01-05",
      payDateOffset: 2,
      employmentModel: "EMPLOYEE",
      rulesVerified: true,
    };
    for (const frequency of ["MONTHLY", "WEEKLY", "BIWEEKLY", "SEMIMONTHLY"]) {
      expect(await validate(plainToInstance(PayrollProfileDto, { ...profile, frequency }))).toHaveLength(0);
    }
    for (const patch of [
      { calendarAnchor: "2026-02-30" },
      { calendarAnchor: "2026-01-05T00:00:00Z" },
      { payDateOffset: -1 },
      { payDateOffset: 61 },
      { payDateOffset: 0.5 },
    ]) {
      expect(
        await validate(plainToInstance(PayrollProfileDto, { ...profile, frequency: "WEEKLY", ...patch })),
      ).not.toHaveLength(0);
    }
    expect(
      await validate(
        plainToInstance(PayrollRunDto, {
          profileId: id,
          period: "2026-11-02",
          payDate: "2026-11-10",
          prorationPolicy: "CALENDAR_DAYS",
        }),
      ),
    ).toHaveLength(0);
    for (const period of ["2026-11-00", "2026-11-32", "2026-13-01", "2026-11-02T00:00:00Z"]) {
      expect(
        await validate(plainToInstance(PayrollRunDto, { profileId: id, period, payDate: "2026-11-10" })),
      ).not.toHaveLength(0);
    }
  });
  it("validates variable-pay contracts without accepting arbitrary calculation expressions or malformed months", async () => {
    const input = {
      employeeId: id,
      profileId: id,
      name: "Approved overtime",
      type: "EARNING",
      calculation: "HOURS",
      quantity: "10.5",
      rate: "125.25",
      multiplier: "1.5",
      startPeriod: "2026-11",
      endPeriod: "2026-11",
      reason: "Approved timesheet TS-100",
    };
    expect(await validate(plainToInstance(VariablePayInputDto, input))).toHaveLength(0);
    for (const patch of [
      { employeeId: "other-tenant" },
      { name: " " },
      { type: "TAX_FORMULA" },
      { calculation: "EVAL" },
      { quantity: "100000000" },
      { rate: "-1" },
      { multiplier: "100" },
      { startPeriod: "2026-13" },
      { endPeriod: "0000-11" },
      { reason: "no" },
    ]) {
      expect(await validate(plainToInstance(VariablePayInputDto, { ...input, ...patch }))).not.toHaveLength(0);
    }
  });
  it("validates the explicit proration policy and draft closure reasons", async () => {
    for (const prorationPolicy of ["NONE", "CALENDAR_DAYS"]) {
      expect(
        await validate(
          plainToInstance(PayrollRunDto, {
            profileId: id,
            period: "2026-11",
            payDate: "2026-11-30",
            prorationPolicy,
          }),
        ),
      ).toHaveLength(0);
    }
    expect(
      await validate(
        plainToInstance(PayrollRunDto, {
          profileId: id,
          period: "2026-11",
          payDate: "2026-11-30",
          prorationPolicy: "GUESS",
        }),
      ),
    ).not.toHaveLength(0);
    for (const reason of ["", " ", "no", "x".repeat(1001)]) {
      expect(await validate(plainToInstance(PayrollRunDecisionDto, { reason }))).not.toHaveLength(0);
    }
    expect(await validate(plainToInstance(PayrollRunDecisionDto, { reason: "Wrong salary inputs" }))).toHaveLength(0);
  });
  it("accepts date-only monthly run inputs and rejects timestamps, invalid months, and cross-shaped IDs", async () => {
    expect(
      await validate(plainToInstance(PayrollRunDto, { profileId: id, period: "2026-11", payDate: "2026-11-30" })),
    ).toHaveLength(0);
    for (const patch of [
      { period: "2026-13" },
      { period: "0000-11" },
      { payDate: "2026-11-31" },
      { payDate: "2026-11-30T00:00:00Z" },
      { departmentId: "not-an-id" },
    ]) {
      expect(
        (
          await validate(
            plainToInstance(PayrollRunDto, { profileId: id, period: "2026-11", payDate: "2026-11-30", ...patch }),
          )
        ).length,
      ).toBeGreaterThan(0);
    }
  });
  it("rejects whitespace names and unsupported profile settings", async () => {
    const errors = await validate(
      plainToInstance(PayrollProfileDto, {
        name: " ",
        countryCode: "India",
        currency: "rupee",
        minorUnits: 5,
        frequency: "DAILY",
        employmentModel: "UNKNOWN",
        rulesVerified: "true",
        effectiveFrom: "2026-11-01",
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        "name",
        "countryCode",
        "currency",
        "minorUnits",
        "frequency",
        "employmentModel",
        "rulesVerified",
      ]),
    );
  });
  it("validates nested components and blocks arbitrary expressions", async () => {
    const errors = await validate(
      plainToInstance(SalaryStructureDto, {
        profileId: id,
        name: "Salary",
        components: [{ code: "BASIC", name: " ", type: "EARNING", calculation: "EVAL", value: "process.exit()" }],
      }),
    );
    expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ property: "components" })]));
  });
  it("requires nonblank receipt references and positive-shaped decimal strings", async () => {
    const errors = await validate(
      plainToInstance(ExpenseClaimDto, {
        employeeId: id,
        title: " ",
        amount: "-1",
        currency: "INR",
        expenseDate: "2026-11-01",
        receiptReference: " ",
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["title", "amount", "receiptReference"]),
    );
  });
});
