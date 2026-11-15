import { hrmsEmployeeLifecycleSchema, updateHrmsLifecycleSchema } from "@dhriti/validation";
import { applyLifecycleAction, lifecycleSummary } from "./employee-lifecycle";

const blank = hrmsEmployeeLifecycleSchema.parse({});
const configured = {
  ...blank,
  probationEndDate: "2026-12-01",
  contractStartDate: "2026-01-01",
  contractEndDate: "2026-12-31",
  noticePeriodDays: 30,
};
const context = ["2026-01-01", "2026-11-15", "2026-11-15"] as const;
describe("HR-controlled employee lifecycle", () => {
  it("leaves all policy values unconfigured until HR sets them", () => {
    expect(Object.values(blank).every((value) => value === null)).toBe(true);
    expect(lifecycleSummary(blank, "2026-11-15", "2026-11-15")).toEqual({
      proposedLastWorkingDate: null,
      probationStatus: "UNCONFIGURED",
      contractStatus: "UNCONFIGURED",
    });
  });
  it("requires reasons, versions and strict calendar dates and rejects extra commands", () => {
    for (const patch of [
      { reason: "" },
      { version: -1 },
      { date: "2026-02-30" },
      { date: "2026-2-01" },
      { status: "INACTIVE" },
    ]) {
      expect(
        updateHrmsLifecycleSchema.safeParse({
          action: "CONFIRM_PROBATION",
          version: 0,
          date: "2026-11-15",
          reason: "Reviewed",
          ...patch,
        }).success,
      ).toBe(false);
    }
  });
  it("confirms explicitly, not from an overdue end date, without mutating input", () => {
    expect(lifecycleSummary(configured, null, "2027-01-01").probationStatus).toBe("OVERDUE");
    const confirmed = applyLifecycleAction(
      configured,
      { action: "CONFIRM_PROBATION", date: "2026-11-15", version: 0, reason: "Reviewed" },
      ...context,
    );
    expect(confirmed.probationConfirmedOn).toBe("2026-11-15");
    expect(configured.probationConfirmedOn).toBeNull();
    expect(() =>
      applyLifecycleAction(
        configured,
        { action: "CONFIRM_PROBATION", date: "2026-11-16", version: 0, reason: "Reviewed" },
        ...context,
      ),
    ).toThrow("future");
    expect(() =>
      applyLifecycleAction(
        confirmed,
        { action: "EXTEND_PROBATION", date: "2027-01-01", version: 1, reason: "Reviewed" },
        ...context,
      ),
    ).toThrow("ongoing");
  });
  it("extends probation and renews contracts only to later dates", () => {
    const probation = applyLifecycleAction(
      configured,
      { action: "EXTEND_PROBATION", date: "2027-01-01", version: 0, reason: "More assessment time" },
      ...context,
    );
    expect(probation.probationEndDate).toBe("2027-01-01");
    const contract = applyLifecycleAction(
      configured,
      { action: "RENEW_CONTRACT", date: "2027-12-31", version: 0, reason: "Renewal signed" },
      ...context,
    );
    expect(contract.contractEndDate).toBe("2027-12-31");
    for (const action of ["EXTEND_PROBATION", "RENEW_CONTRACT"] as const) {
      expect(() =>
        applyLifecycleAction(configured, { action, date: "2026-11-01", version: 0, reason: "Reviewed" }, ...context),
      ).toThrow();
    }
  });
  it("does not bypass extension/renewal decisions through configuration", () => {
    expect(() =>
      applyLifecycleAction(
        configured,
        {
          action: "CONFIGURE",
          version: 0,
          reason: "Correction",
          data: { ...configured, probationEndDate: "2027-01-01" },
        },
        ...context,
      ),
    ).toThrow("Extend");
    expect(() =>
      applyLifecycleAction(
        configured,
        { action: "CONFIGURE", version: 0, reason: "Correction", data: { ...configured, contractEndDate: null } },
        ...context,
      ),
    ).toThrow("Renew");
  });
  it("validates joining/contract order and requires resignation before approving exit tracking", () => {
    expect(() =>
      applyLifecycleAction(
        blank,
        {
          action: "CONFIGURE",
          version: 0,
          reason: "Setup",
          data: {
            probationEndDate: null,
            noticePeriodDays: null,
            contractStartDate: null,
            contractEndDate: "2026-12-31",
          },
        },
        ...context,
      ),
    ).toThrow("start date");
    expect(() =>
      applyLifecycleAction(
        blank,
        {
          action: "CONFIGURE",
          version: 0,
          reason: "Setup",
          data: {
            probationEndDate: "2025-01-01",
            noticePeriodDays: null,
            contractStartDate: null,
            contractEndDate: null,
          },
        },
        ...context,
      ),
    ).toThrow("joining");
    expect(() =>
      applyLifecycleAction(
        configured,
        { action: "APPROVE_LAST_WORKING_DATE", version: 0, reason: "Reviewed", date: "2026-12-15" },
        context[0],
        null,
        context[2],
      ),
    ).toThrow("resignation");
    expect(
      applyLifecycleAction(
        configured,
        { action: "APPROVE_LAST_WORKING_DATE", version: 0, reason: "Reviewed", date: "2026-12-15" },
        ...context,
      ),
    ).toMatchObject({ approvedLastWorkingDate: "2026-12-15" });
  });
  it("calculates calendar-day notice proposals, including explicit zero and leap/year boundaries", () => {
    expect(lifecycleSummary(configured, "2026-12-15", "2026-11-15").proposedLastWorkingDate).toBe("2027-01-14");
    expect(
      lifecycleSummary({ ...blank, noticePeriodDays: 1 }, "2028-02-28", "2028-02-28").proposedLastWorkingDate,
    ).toBe("2028-02-29");
    expect(
      lifecycleSummary({ ...blank, noticePeriodDays: 0 }, "2026-11-15", "2026-11-15").proposedLastWorkingDate,
    ).toBe("2026-11-15");
    expect(lifecycleSummary(configured, null, "2027-01-01").contractStatus).toBe("EXPIRED");
    expect(lifecycleSummary(configured, null, "2026-12-31").contractStatus).toBe("ACTIVE");
  });
});
