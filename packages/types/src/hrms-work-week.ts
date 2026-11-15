export type WorkWeekDay = "WORKING" | "HALF_DAY" | "OFF";
/** Five weekday-occurrence rows per calendar month; columns are Monday through Sunday. */
export type WorkWeekPattern = WorkWeekDay[][];
export type WorkWeekVersion = {
  id: string;
  effectiveFrom: string;
  pattern: WorkWeekPattern;
};
export type WorkWeekRule = {
  id: string;
  name: string;
  description: string;
  revision: number;
  versions: WorkWeekVersion[];
};
export type WorkWeekDefault = { id: string; effectiveFrom: string; ruleId: string };
export type WorkWeekAssignment = {
  id: string;
  employeeId: string;
  ruleId: string | null;
  effectiveFrom: string;
};
/** All employees means the organization's non-archived employees at save time, not future joiners. */
export type AssignWorkWeekInput = {
  ruleId: string | null;
  effectiveFrom: string;
} & ({ allEmployees: true; employeeIds?: never } | { allEmployees?: false; employeeIds: string[] });
export type WorkWeekWorkspace = {
  rules: WorkWeekRule[];
  defaults: WorkWeekDefault[];
};
export type WorkWeekScheduleDay = {
  date: string;
  units: number;
  kind: WorkWeekDay;
  ruleId: string | null;
  ruleName: string | null;
  versionId: string | null;
};
export type WorkWeekSchedule = { days: WorkWeekScheduleDay[] };
