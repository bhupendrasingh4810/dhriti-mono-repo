import type { WorkWeekDay, WorkWeekPattern } from "@dhriti/types";

export const workWeekDayLabels: Record<WorkWeekDay, string> = {
  WORKING: "Working day",
  HALF_DAY: "Half day",
  OFF: "Weekly off",
};
export const workWeekDayClasses: Record<WorkWeekDay, string> = {
  WORKING: "bg-success text-text-inverse",
  HALF_DAY: "bg-warning text-text-primary",
  OFF: "bg-error text-text-inverse",
};
export const workWeekPresets = [
  "Saturday Sunday Off",
  "Sunday Off",
  "Even Saturday Off",
  "Odd Saturday Off",
  "Saturday Half Day",
  "Custom Rule",
];
export function presetWorkWeek(name: string): WorkWeekPattern {
  return Array.from({ length: 5 }, (_, week) =>
    Array.from({ length: 7 }, (_, day): WorkWeekDay => {
      if (day === 6) return "OFF";
      if (day !== 5) return "WORKING";
      if (name === "Saturday Sunday Off") return "OFF";
      if (name === "Even Saturday Off") return (week + 1) % 2 === 0 ? "OFF" : "WORKING";
      if (name === "Odd Saturday Off") return (week + 1) % 2 === 1 ? "OFF" : "WORKING";
      if (name === "Saturday Half Day") return "HALF_DAY";
      return "WORKING";
    }),
  );
}
export const nextWorkWeekDay = (day: WorkWeekDay): WorkWeekDay =>
  day === "WORKING" ? "HALF_DAY" : day === "HALF_DAY" ? "OFF" : "WORKING";
