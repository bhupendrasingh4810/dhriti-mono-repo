import { calculateCalendarSalary, calculateSalary, readComponents } from "./payroll-calculation";
import { Prisma } from "@prisma/client";
import { payrollCalendar } from "./payroll-calendar";
import type { SalaryComponentDto } from "../dto/hrms-payroll-workspace.dto";

const basic: SalaryComponentDto = {
  code: "BASIC",
  name: "Basic",
  type: "EARNING",
  calculation: "PERCENT_GROSS",
  value: "50",
};
const remainder: SalaryComponentDto = {
  code: "ALLOWANCE",
  name: "Allowance",
  type: "EARNING",
  calculation: "REMAINDER",
  value: "0",
};

describe("payroll calculation", () => {
  it("calculates ordered percentages, reimbursements-independent net, and employer contributions using decimals", () => {
    const result = calculateSalary(
      "10000",
      [
        basic,
        remainder,
        {
          code: "PF",
          name: "Employee contribution",
          type: "DEDUCTION",
          calculation: "PERCENT_COMPONENT",
          basis: "BASIC",
          value: "12",
        },
        {
          code: "EMPLOYER_PF",
          name: "Employer contribution",
          type: "EMPLOYER",
          calculation: "PERCENT_COMPONENT",
          basis: "BASIC",
          value: "12",
        },
        { code: "TAX", name: "Configured tax", type: "DEDUCTION", calculation: "FIXED", value: "100.25" },
      ],
      2,
    );
    expect(result).toMatchObject({ gross: "10000.00", deductions: "700.25", employer: "600.00", net: "9299.75" });
    expect(result.lines.map((line) => line.amount)).toEqual(["5000.00", "5000.00", "600.00", "600.00", "100.25"]);
  });

  describe("calendar-day payroll", () => {
    const revision = {
      id: "salary-a",
      effectiveFrom: new Date("2026-01-01"),
      monthlyGross: "30000",
      profileId: "profile-a",
      components: [
        basic,
        remainder,
        {
          code: "FIXED",
          name: "Fixed deduction",
          type: "DEDUCTION",
          calculation: "FIXED",
          value: "300",
        } satisfies SalaryComponentDto,
      ],
    };
    const input = {
      start: new Date("2026-11-01"),
      end: new Date("2026-11-30"),
      employmentStart: null,
      employmentEnd: null,
      profileId: "profile-a",
      precision: 2,
      revisions: [revision],
      unpaidLeave: [],
    };
    it("preserves full-month amounts exactly", () => {
      const result = calculateCalendarSalary(input);
      expect(result).toMatchObject({
        gross: "30000.00",
        deductions: "300.00",
        net: "29700.00",
        proration: { periodDays: 30, employmentDays: 30, unpaidDays: 0 },
      });
      expect(result.lines).toEqual(calculateSalary("30000", revision.components, 2).lines);
    });
    it.each([0, 2, 3])("allocates split periods with exact monthly component totals at precision %s", (precision) => {
      for (const frequency of ["WEEKLY", "BIWEEKLY", "SEMIMONTHLY"]) {
        const periods = payrollCalendar(
          { frequency, calendarAnchor: new Date("2024-01-01"), effectiveFrom: new Date("2023-01-01") },
          2024,
        );
        const totals = new Map<string, Prisma.Decimal>();
        for (const period of periods) {
          // Clip each calendar intersection to February to prove partition-independent month totals.
          const start = period.start < "2024-02-01" ? "2024-02-01" : period.start;
          const end = period.end > "2024-02-29" ? "2024-02-29" : period.end;
          if (start > end) {
            continue;
          }
          const result = calculateCalendarSalary({
            ...input,
            start: new Date(start),
            end: new Date(end),
            precision,
            allocation: "MONTHLY_CALENDAR",
            revisions: [{ ...revision, monthlyGross: "10000", effectiveFrom: new Date("2023-01-01") }],
          });
          for (const line of result.lines) {
            totals.set(line.code, (totals.get(line.code) ?? new Prisma.Decimal(0)).plus(line.amount));
          }
        }
        for (const line of calculateSalary("10000", revision.components, precision).lines) {
          expect(totals.get(line.code)?.toFixed(precision)).toBe(line.amount);
        }
      }
    });
    it("allocates cross-month periods by each month's denominator and saves both month bases", () => {
      const result = calculateCalendarSalary({
        ...input,
        start: new Date("2026-11-23"),
        end: new Date("2026-12-06"),
        allocation: "MONTHLY_CALENDAR",
      });
      expect(result.gross).toBe("13806.46"); // 8/30 of November + cumulative 6/31 of December, per component.
      expect(
        result.proration.segments.map((segment) => [segment.month, segment.monthDays, segment.calendarDays]),
      ).toEqual([
        ["2026-11", 30, 8],
        ["2026-12", 31, 6],
      ]);
      expect(result.monthlyCtc).toBe("30000.00");
    });
    it("applies joining, leaving, half-day leave and revisions within a short calendar period", () => {
      const result = calculateCalendarSalary({
        ...input,
        start: new Date("2026-11-09"),
        end: new Date("2026-11-15"),
        allocation: "MONTHLY_CALENDAR",
        employmentStart: new Date("2026-11-10"),
        employmentEnd: new Date("2026-11-14"),
        revisions: [
          revision,
          { ...revision, id: "revision-b", effectiveFrom: new Date("2026-11-12"), monthlyGross: "60000" },
        ],
        unpaidLeave: [{ startDate: new Date("2026-11-13"), endDate: new Date("2026-11-13"), totalDays: 0.5 }],
      });
      expect(result).toMatchObject({
        gross: "7000.00",
        deductions: "45.00",
        net: "6955.00",
        proration: { periodDays: 7, employmentDays: 5, unpaidDays: 0.5, allocation: "MONTHLY_CALENDAR" },
      });
    });
    it("includes joining and leaving dates, prorating fixed deductions too", () => {
      expect(
        calculateCalendarSalary({
          ...input,
          employmentStart: new Date("2026-11-11"),
          employmentEnd: new Date("2026-11-20"),
        }),
      ).toMatchObject({ gross: "10000.00", deductions: "100.00", net: "9900.00", proration: { employmentDays: 10 } });
    });
    it("uses each salary revision only for its effective calendar days", () => {
      const result = calculateCalendarSalary({
        ...input,
        revisions: [
          revision,
          { ...revision, id: "salary-b", effectiveFrom: new Date("2026-11-16"), monthlyGross: "60000" },
        ],
      });
      expect(result).toMatchObject({ gross: "45000.00", deductions: "300.00", net: "44700.00" });
      expect(result.proration.segments.map((segment) => segment.payableDays)).toEqual([15, 15]);
      expect(result.monthlyCtc).toBe("60000.00");
    });
    it("clips full-calendar leave to the month and supports explicit single half-days", () => {
      const result = calculateCalendarSalary({
        ...input,
        unpaidLeave: [
          { startDate: new Date("2026-10-30"), endDate: new Date("2026-11-02"), totalDays: 4 },
          { startDate: new Date("2026-11-04"), endDate: new Date("2026-11-04"), totalDays: 0.5 },
        ],
      });
      expect(result).toMatchObject({
        gross: "27500.00",
        deductions: "275.00",
        net: "27225.00",
        proration: { unpaidDays: 2.5 },
      });
      expect(result.unpaidDates).toHaveLength(2);
    });
    it("does not charge leave outside employment, and allows a fully unpaid zero run", () => {
      const result = calculateCalendarSalary({
        ...input,
        employmentStart: new Date("2026-11-16"),
        unpaidLeave: [{ startDate: input.start, endDate: input.end, totalDays: 30 }],
      });
      expect(result).toMatchObject({ gross: "0.00", deductions: "0.00", net: "0.00", proration: { unpaidDays: 15 } });
    });
    it("does not invent dates for ambiguous working-day or multi-day half-day leave", () => {
      expect(() =>
        calculateCalendarSalary({
          ...input,
          unpaidLeave: [{ startDate: input.start, endDate: new Date("2026-11-07"), totalDays: 5 }],
        }),
      ).toThrow("explicit calendar-date allocation");
    });
    it("rejects overlapping leave, missing salary coverage and mid-month pay-group transfers", () => {
      const leave = { startDate: input.start, endDate: input.start, totalDays: 1 };
      expect(() => calculateCalendarSalary({ ...input, unpaidLeave: [leave, leave] })).toThrow("Overlapping");
      expect(() =>
        calculateCalendarSalary({ ...input, revisions: [{ ...revision, effectiveFrom: new Date("2026-11-05") }] }),
      ).toThrow("missing");
      expect(() =>
        calculateCalendarSalary({
          ...input,
          revisions: [
            revision,
            { ...revision, id: "transfer", effectiveFrom: new Date("2026-11-15"), profileId: "profile-b" },
          ],
        }),
      ).toThrow("pay-group transfers");
    });
    it.each([
      ["2028-02-01", "2028-02-29", 29, 0],
      ["2026-02-01", "2026-02-28", 28, 2],
      ["2026-12-01", "2026-12-31", 31, 3],
    ] as const)("uses actual month length and ISO precision for %s", (start, end, days, precision) => {
      const result = calculateCalendarSalary({ ...input, start: new Date(start), end: new Date(end), precision });
      expect(result.proration.periodDays).toBe(days);
      expect(result.gross).toBe(precision ? `30000.${"0".repeat(precision)}` : "30000");
    });
  });

  it.each([0, 2, 3])("balances rounded earnings at precision %i", (precision) => {
    const result = calculateSalary("1.005", [{ ...basic, value: "33.3333" }, remainder], precision);
    expect(Number(result.gross)).toBe(Number(result.net));
    expect(result.net.split(".")[1]?.length ?? 0).toBe(precision);
  });

  it("uses HALF_UP rounding and a remainder instead of losing cents", () => {
    expect(calculateSalary("0.03", [basic, remainder], 2).lines.map((line) => line.amount)).toEqual(["0.02", "0.01"]);
    expect(calculateSalary("0.1", [{ ...remainder }], 2).net).toBe("0.10");
  });

  it.each(["0", "-1", "NaN", "Infinity", "0.0001"])("rejects nonpositive or nonfinite gross %s", (gross) => {
    expect(() => calculateSalary(gross, [remainder], 2)).toThrow();
  });

  it("rejects unsupported precision, negative values, duplicate codes and forward references", () => {
    expect(() => calculateSalary("100", [remainder], 4)).toThrow("precision");
    expect(() => calculateSalary("100", [{ ...basic, value: "-1" }], 2)).toThrow("nonnegative");
    expect(() => calculateSalary("100", [basic, basic], 2)).toThrow("Duplicate");
    expect(() =>
      calculateSalary("100", [{ ...basic, calculation: "PERCENT_COMPONENT", basis: "LATER" }, remainder], 2),
    ).toThrow("earlier");
  });

  it("rejects unbalanced earnings, negative remainders and excessive deductions", () => {
    expect(() => calculateSalary("100", [basic], 2)).toThrow("equal monthly gross");
    expect(() => calculateSalary("100", [{ ...basic, value: "101" }, remainder], 2)).toThrow("Negative");
    expect(() =>
      calculateSalary("100", [remainder, { ...basic, code: "DEDUCTION", type: "DEDUCTION", value: "101" }], 2),
    ).toThrow("exceed");
    expect(() => calculateSalary("100", [{ ...remainder, type: "DEDUCTION" }], 2)).toThrow("Only earnings");
  });

  it("validates stored JSON before evaluating components", () => {
    expect(readComponents([{ ...basic }])).toEqual([basic]);
    for (const invalid of [null, {}, [null], [{ ...basic, type: "SCRIPT" }], [{ ...basic, basis: 42 }]]) {
      expect(() => readComponents(invalid)).toThrow();
    }
  });
});
