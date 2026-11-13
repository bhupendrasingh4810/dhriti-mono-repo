export interface ShiftTimes {
  startTime: string;
  endTime: string;
}

const toMinutes = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Shift times are "HH:mm"; an end at or before the start means the shift crosses midnight. */
export const isOvernightShift = (shift: ShiftTimes) => toMinutes(shift.endTime) <= toMinutes(shift.startTime);

function formatClock(value: string) {
  const minutes = toMinutes(value);
  const hours24 = Math.floor(minutes / 60) % 24;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

export function formatShiftRange(shift: ShiftTimes) {
  return `${formatClock(shift.startTime)}–${formatClock(shift.endTime)}${isOvernightShift(shift) ? " (+1 day)" : ""}`;
}

/** Calendar grid hours for a shift; overnight shifts show the whole day because a grid column cannot wrap. */
export function shiftToHourRange(shift: ShiftTimes) {
  if (isOvernightShift(shift)) {
    return { startHour: 0, endHour: 24 };
  }
  return { startHour: Math.floor(toMinutes(shift.startTime) / 60), endHour: Math.ceil(toMinutes(shift.endTime) / 60) };
}
