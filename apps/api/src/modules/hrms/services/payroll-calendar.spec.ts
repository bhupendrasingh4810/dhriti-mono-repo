import { payrollCalendar, payrollPeriod } from "./payroll-calendar";

describe("payroll calendars", () => {
  const profile = { frequency: "MONTHLY", effectiveFrom: new Date("2024-01-01"), payDateOffset: 3 };
  it("preserves monthly keys and resolves leap-year ends and pay-date calendar offsets", () => {
    expect(payrollPeriod(profile, "2024-02")).toMatchObject({
      key: "2024-02",
      start: "2024-02-01",
      end: "2024-02-29",
      payDate: "2024-03-03",
    });
    expect(payrollPeriod(profile, "2026-02").end).toBe("2026-02-28");
    expect(payrollCalendar(profile, 2026)).toHaveLength(12);
  });
  it("lists twice-monthly boundaries without assuming half of a monthly salary or holiday shifting", () => {
    const calendar = { ...profile, frequency: "SEMIMONTHLY" };
    expect(payrollCalendar(calendar, 2024)).toHaveLength(24);
    expect(payrollPeriod(calendar, "2024-02-16")).toMatchObject({
      start: "2024-02-16",
      end: "2024-02-29",
      payDate: "2024-03-03",
    });
    expect(payrollPeriod(calendar, "2026-11-01")).toMatchObject({ end: "2026-11-15", payDate: "2026-11-18" });
    expect(() => payrollPeriod(calendar, "2026-11-15")).toThrow("day 1 or 16");
  });
  it.each([
    ["WEEKLY", 7],
    ["BIWEEKLY", 14],
  ] as const)("anchors %s cycles across year boundaries without gaps or overlaps", (frequency, length) => {
    const calendar = { ...profile, frequency, calendarAnchor: new Date("2026-12-28") };
    const periods = payrollCalendar(calendar, 2027);
    expect(periods[0].start).toBe("2026-12-28");
    expect(periods[0].end).toBe(frequency === "WEEKLY" ? "2027-01-03" : "2027-01-10");
    for (let index = 0; index < periods.length; index++) {
      const current = periods[index];
      expect((new Date(current.end).getTime() - new Date(current.start).getTime()) / 86400000 + 1).toBe(length);
      if (index) {
        expect(new Date(current.start).getTime() - new Date(periods[index - 1].end).getTime()).toBe(86400000);
      }
    }
    expect(() => payrollPeriod(calendar, "2027-01-01")).toThrow("align");
    expect(payrollCalendar({ ...calendar, effectiveFrom: new Date("2027-01-01") }, 2027)[0].start > "2027-01-01").toBe(
      true,
    );
  });
  it("rejects malformed or impossible periods, unsupported frequencies and unbounded offsets/years", () => {
    for (const key of ["2026-13", "2026-02-01", "0000-11", "junk"]) {
      expect(() => payrollPeriod(profile, key)).toThrow();
    }
    expect(() => payrollPeriod({ ...profile, frequency: "SEMIMONTHLY" }, "2026-02-30")).toThrow();
    expect(() => payrollPeriod({ ...profile, frequency: "DAILY" }, "2026-11")).toThrow("Unsupported");
    expect(() => payrollPeriod({ ...profile, frequency: "WEEKLY" }, "2026-11-01")).toThrow("anchor");
    for (const payDateOffset of [-1, 61, 0.5]) {
      expect(() => payrollPeriod({ ...profile, payDateOffset }, "2026-11")).toThrow("offset");
    }
    for (const year of [999, 9999, NaN, 2026.5]) {
      expect(() => payrollCalendar(profile, year)).toThrow("year");
    }
  });
});
