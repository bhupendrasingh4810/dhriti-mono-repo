export type EventTone = "info" | "success" | "warning" | "secondary" | "error";

export type CalendarEvent = {
  id: string;
  day: number;
  startHour: number;
  durationHours: number;
  title: string;
  time: string;
  location: string;
  tone: EventTone;
};
