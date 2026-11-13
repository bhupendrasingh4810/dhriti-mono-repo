/** Shifts every organization starts with; admins can edit times, rename, or deactivate them. */
export const DEFAULT_HRMS_SHIFTS = [
  { name: "Morning", startTime: "06:00", endTime: "14:00" },
  { name: "Day", startTime: "09:00", endTime: "18:00" },
  { name: "Evening", startTime: "14:00", endTime: "22:00" },
  { name: "Night", startTime: "22:00", endTime: "06:00" },
] as const;
