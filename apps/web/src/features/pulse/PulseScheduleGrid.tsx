import {
  birthdays,
  events,
  eventToneClasses,
  getDateKey,
  pulseCompanyPolicy,
} from "./pulse-calendar.data";

type PulseScheduleGridProps = {
  nowLinePosition: number;
  workingWeek: Date[];
  currentDayIndex: number;
  timeSlots: string[];
  workingDayStartHour: number;
  showCalendarEvents: boolean;
  showBirthdays: boolean;
  showHolidays: boolean;
};

export function PulseScheduleGrid({
  nowLinePosition,
  workingWeek,
  currentDayIndex,
  timeSlots,
  workingDayStartHour,
  showCalendarEvents,
  showBirthdays,
  showHolidays,
}: PulseScheduleGridProps) {
  return (
    <div className="relative min-h-0 flex-1 overflow-auto">
      <div
        className="grid min-w-[980px] grid-rows-[56px_44px] auto-rows-[80px] bg-surface"
        style={{ gridTemplateColumns: `80px repeat(${workingWeek.length}, minmax(160px, 1fr))` }}
      >
        <div className="sticky top-0 z-3 grid place-items-center border-b border-r border-border bg-surface">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-secondary">Time</span>
        </div>
        {workingWeek.map((date, index) => (
          <div
            key={date.toISOString()}
            className={`sticky top-0 z-3 grid place-items-center border-b border-border bg-surface ${
              index === currentDayIndex ? "text-brand" : "text-text-secondary"
            }`}
          >
            <span className="text-[13px] font-extrabold">
              {date.toLocaleDateString("default", { weekday: "short", day: "numeric" })}
            </span>
          </div>
        ))}

        <div className="grid place-items-center border-b border-r border-border">
          <span className="text-[11px] font-bold text-text-secondary">All Day</span>
        </div>
        {workingWeek.map((date, index) => {
          const dateKey = getDateKey(date);
          const holidays = showHolidays ? pulseCompanyPolicy.holidays.filter((holiday) => holiday.date === dateKey) : [];
          const birthdayEntries = showBirthdays ? birthdays.filter((birthday) => birthday.date === dateKey) : [];

          return (
            <div key={`all-day-${date.toISOString()}`} className={`border-b border-border p-0.75 ${index < workingWeek.length - 1 ? "border-r" : ""}`}>
              {holidays.map((holiday) => (
                <p key={holiday.id} className="border border-warning bg-warning/10 px-1 py-0.65 text-[11px] font-bold text-warning">
                  {holiday.name}
                </p>
              ))}
              {birthdayEntries.map((birthday) => (
                <p key={birthday.id} className="border border-border bg-background px-1 py-0.65 text-[11px] font-bold">
                  {birthday.name}
                </p>
              ))}
            </div>
          );
        })}

        {timeSlots.map((slot) => (
          <div key={slot} className="contents">
            <div className="border-b border-r border-border p-1">
              <span className="text-[11px] font-bold text-text-secondary">{slot}</span>
            </div>
            {workingWeek.map((date, columnIndex) => (
              <div
                key={`${slot}-${date.toISOString()}`}
                className={`relative border-b border-border ${columnIndex < workingWeek.length - 1 ? "border-r" : ""}`}
              />
            ))}
          </div>
        ))}

        {showCalendarEvents && events.filter((event) => event.day < workingWeek.length).map((event) => {
          const top = 56 + 44 + (event.startHour - workingDayStartHour) * 80;
          return (
            <div
              key={event.id}
              className={`absolute z-2 overflow-hidden rounded-md border-l-4 p-1 ${eventToneClasses[event.tone]}`}
              style={{
                top,
                left: `calc(80px + (${event.day} * (100% - 80px) / ${workingWeek.length}) + 8px)`,
                width: `calc((100% - 80px) / ${workingWeek.length} - 16px)`,
                height: Math.max(event.durationHours * 80 - 8, 48),
              }}
            >
              <p className="truncate text-[11px] font-extrabold leading-[1.25]">{event.title}</p>
              <p className="mt-0.25 text-[10px] text-text-secondary">{event.time}</p>
              <p className="mt-0.2 truncate text-[10px] text-text-muted">{event.location}</p>
            </div>
          );
        })}

        {currentDayIndex >= 0 ? <div
          className="absolute z-4 h-0.5 bg-error"
          style={{
            left: `calc(80px + (${currentDayIndex} * (100% - 80px) / ${workingWeek.length}))`,
            width: `calc((100% - 80px) / ${workingWeek.length})`,
            top: 56 + 44 + nowLinePosition,
          }}
        >
          <span className="absolute -left-1 -top-1 size-2 rounded-full bg-error" />
        </div> : null}
      </div>
    </div>
  );
}
