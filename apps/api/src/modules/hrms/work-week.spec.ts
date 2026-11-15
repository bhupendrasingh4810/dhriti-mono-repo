import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ACCESS_REQUIREMENTS_KEY } from "../../common/decorators/access.decorator";
import { HrmsWorkWeekController } from "./controllers/hrms-work-week.controller";
import { AssignWorkWeekDto } from "./dto/hrms-work-week.dto";
import {
  legacyWorkWeekPattern,
  workWeekDate,
  workWeekLeaveAllocation,
  workWeekPattern,
  workWeekUnits,
} from "./work-week";

describe("work-week calendar semantics", () => {
  it("uses each weekday's first through fifth occurrence, resetting monthly", () => {
    const pattern = legacyWorkWeekPattern([1, 2, 3, 4, 5]);
    pattern.forEach((week, row) => {
      week[5] = row % 2 === 0 ? "HALF_DAY" : "OFF";
    });
    expect(workWeekUnits(pattern, new Date("2026-08-01"))).toEqual({ kind: "HALF_DAY", units: 0.5 });
    expect(workWeekUnits(pattern, new Date("2026-08-08"))).toEqual({ kind: "OFF", units: 0 });
    expect(workWeekUnits(pattern, new Date("2026-08-29"))).toEqual({ kind: "HALF_DAY", units: 0.5 });
    expect(workWeekUnits(pattern, new Date("2026-09-05"))).toEqual({ kind: "HALF_DAY", units: 0.5 });
    expect(workWeekUnits(pattern, new Date("2028-02-29"))).toEqual({ kind: "WORKING", units: 1 });
    expect(workWeekUnits(pattern, new Date("2026-08-02"))).toEqual({ kind: "OFF", units: 0 });
  });
  it.each(["2026-02-30", "2026-2-01", "not-a-date", "2026-01-01T10:00:00Z"])("rejects invalid date %s", (date) => {
    expect(() => workWeekDate(date)).toThrow("valid calendar date");
  });
  it.each(
    [
      [],
      [[1]],
      Array.from({ length: 5 }, () => ["WORKING"]),
      Array.from({ length: 5 }, () => Array(7).fill("BAD")),
    ].map((pattern) => ({ pattern })),
  )("rejects malformed matrices", ({ pattern }) => {
    expect(() => workWeekPattern(pattern)).toThrow("five rows");
  });
  it("charges a scheduled half-day independently of discretionary half-day permission", () => {
    const days = [
      {
        date: "2026-08-01",
        units: 0.5,
        kind: "HALF_DAY" as const,
        ruleId: "rule",
        ruleName: "Half Saturday",
        versionId: "v1",
      },
      {
        date: "2026-08-02",
        units: 0,
        kind: "OFF" as const,
        ruleId: "rule",
        ruleName: "Half Saturday",
        versionId: "v1",
      },
    ];
    expect(workWeekLeaveAllocation(days, 0.5, false).map((day) => day.units)).toEqual([0.5, 0]);
    expect(() => workWeekLeaveAllocation(days, 1, true)).toThrow("0.5 scheduled");
    const fullDay = [{ ...days[0], units: 1, kind: "WORKING" as const }];
    expect(workWeekLeaveAllocation(fullDay, 0.5, true)[0].units).toBe(0.5);
    expect(() => workWeekLeaveAllocation(fullDay, 0.5, false)).toThrow("1 scheduled");
    expect(() => workWeekLeaveAllocation([days[1]], 0.5, true)).toThrow("0 scheduled");
  });
});

describe("work-week access and contracts", () => {
  it("keeps all mutations and configuration history behind settings management", () => {
    for (const method of ["list", "create", "update", "default", "remove", "assign", "assignments"] as const) {
      expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsWorkWeekController.prototype[method])).toEqual({
        entitlement: "hrms.enabled",
        permission: "organization.settings.manage",
      });
    }
    expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsWorkWeekController.prototype.mine)).toEqual({
      entitlement: "hrms.enabled",
    });
    expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsWorkWeekController.prototype.employeeSchedule)).toEqual({
      entitlement: "hrms.enabled",
      permission: "hrms.leave.manage",
    });
  });
  it("allows explicit default-following but rejects missing rules and invalid employee selections", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const input = { effectiveFrom: "2099-01-01", employeeIds: [id], ruleId: null };
    expect(await validate(plainToInstance(AssignWorkWeekDto, input))).toEqual([]);
    for (const patch of [
      { ruleId: undefined },
      { employeeIds: [id, id] },
      { employeeIds: [] },
      { employeeIds: ["foreign"] },
    ]) {
      expect(await validate(plainToInstance(AssignWorkWeekDto, { ...input, ...patch }))).not.toEqual([]);
    }
  });
  it("supports all employees and selections larger than 100", async () => {
    const input = { effectiveFrom: "2099-01-01", ruleId: null };
    expect(await validate(plainToInstance(AssignWorkWeekDto, { ...input, allEmployees: true }))).toEqual([]);
    const employeeIds = Array.from(
      { length: 101 },
      (_, index) => `11111111-1111-4111-8111-${String(index).padStart(12, "0")}`,
    );
    expect(await validate(plainToInstance(AssignWorkWeekDto, { ...input, employeeIds }))).toEqual([]);
    for (const patch of [{}, { allEmployees: false }, { allEmployees: "true" }]) {
      expect(await validate(plainToInstance(AssignWorkWeekDto, { ...input, ...patch }))).not.toEqual([]);
    }
  });
});
