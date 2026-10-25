import type { CalendarEvent, EventTone } from "./pulse-calendar.types";

export type WorkingDayCount = 4 | 5 | 6;
export type WorkingHours = {
  startHour: number;
  endHour: number;
};
export const myCalendarNames = ["Calendar", "Birthdays", "Holidays"] as const;
export type MyCalendarName = (typeof myCalendarNames)[number];
export type CompanyHoliday = {
  id: string;
  date: string;
  name: string;
};

export const pulseOrganizationPolicy = {
  workingDays: 4 as WorkingDayCount,
  workingHours: {
    startHour: 9,
    endHour: 18,
  },
};

export const pulseCompanyPolicy = {
  holidays: [
    { id: "company-foundation-day-2025", date: "2025-08-25", name: "Company Foundation Day" },
    { id: "independence-day-2025", date: "2025-08-15", name: "Independence Day" },
  ] satisfies CompanyHoliday[],
};

export const birthdays = [
  { id: "priya-nair-birthday-2025", date: "2025-08-27", name: "Priya Nair Birthday" },
];

export function getWorkingDays(workingDayCount: WorkingDayCount): number[] {
  return Array.from({ length: workingDayCount }, (_, index) => index + 1);
}

export function getWorkingWeek(date: Date, workingDays: number[]): Date[] {
  const monday = new Date(date);
  const dayOffset = (date.getDay() + 6) % 7;
  monday.setDate(date.getDate() - dayOffset);
  monday.setHours(0, 0, 0, 0);

  return [...workingDays]
    .sort((left, right) => left - right)
    .map((day) => {
      const workingDay = new Date(monday);
      workingDay.setDate(monday.getDate() + day - 1);
      return workingDay;
    });
}

export function getTimeSlots({ startHour, endHour }: WorkingHours): string[] {
  if (!Number.isInteger(startHour) || !Number.isInteger(endHour) || startHour < 0 || endHour > 24 || startHour >= endHour) {
    throw new Error("Working hours must be whole hours between 00:00 and 24:00, with an end time after the start time.");
  }

  return Array.from({ length: endHour - startHour + 1 }, (_, index) => formatHour(startHour + index));
}

function formatHour(hour: number): string {
  const period = hour < 12 || hour === 24 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;

  return `${displayHour} ${period}`;
}

export function isSameCalendarDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export const events: CalendarEvent[] = [
  { id: "e1", day: 0, startHour: 9.5, durationHours: 0.75, title: "Daily Standup", time: "9:30 - 10:00", location: "Room 2B", tone: "secondary" },
  { id: "e2", day: 1, startHour: 10, durationHours: 2, title: "Sprint Planning", time: "10:00 - 12:00", location: "Room 2B", tone: "success" },
  { id: "e3", day: 2, startHour: 11, durationHours: 1.25, title: "Product Discussion", time: "11:00 - 12:15", location: "Room 3A", tone: "info" },
  { id: "e4", day: 3, startHour: 10, durationHours: 1.5, title: "Architecture Review", time: "10:00 - 11:30", location: "Room 2B", tone: "secondary" },
  { id: "e5", day: 4, startHour: 9.5, durationHours: 1, title: "Product Roadmap", time: "9:30 - 10:30", location: "Room 3A", tone: "warning" },
  { id: "e6", day: 0, startHour: 14, durationHours: 1.5, title: "Architecture Review", time: "2:00 - 3:30", location: "Room 3A", tone: "warning" },
  { id: "e7", day: 1, startHour: 15, durationHours: 2, title: "Focus Time", time: "3:00 - 5:00", location: "Heads down", tone: "error" },
  { id: "e8", day: 4, startHour: 15, durationHours: 1, title: "Team Sync", time: "3:00 - 4:00", location: "Room 2B", tone: "secondary" },
];

export const eventToneClasses: Record<EventTone, string> = {
  success: "border-success bg-success/10 text-success",
  warning: "border-warning bg-warning/10 text-warning",
  secondary: "border-brand bg-brand-muted text-brand",
  error: "border-error bg-error/10 text-error",
  info: "border-info bg-info/10 text-info",
};
