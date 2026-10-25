"use client";

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";
import { styled } from "@mui/material/styles";
import { DateCalendar, LocalizationProvider, PickerDay, type PickerDayProps } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { getWorkingWeek, isSameCalendarDay, myCalendarNames, type MyCalendarName } from "./pulse-calendar.data";

dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 1 });

type PulseCalendarSidebarProps = {
  selectedDate: Date;
  workingDays: number[];
  onSelectDate: (date: Date) => void;
  visibleCalendars: MyCalendarName[];
  onToggleCalendar: (calendar: MyCalendarName) => void;
};

export function PulseCalendarSidebar({
  selectedDate,
  workingDays,
  onSelectDate,
  visibleCalendars,
  onToggleCalendar,
}: PulseCalendarSidebarProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const selectedWeek = getWorkingWeek(selectedDate, workingDays);
  const hoveredWeek = hoveredDate ? getWorkingWeek(hoveredDate, workingDays) : [];

  return (
    <aside className="w-[312px] overflow-y-auto rounded-xl border border-brand bg-brand">
      <div className="p-5">
        <div onMouseLeave={() => setHoveredDate(null)}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
            <DateCalendar
              value={dayjs(selectedDate)}
              onChange={(date) => date && onSelectDate(date.toDate())}
              shouldDisableDate={(date) => date.day() === 0}
              showDaysOutsideCurrentMonth
              slots={{
                day: (props) => (
                  <WorkingWeekDay
                    {...props}
                    selectedDate={selectedDate}
                    selectedWeek={selectedWeek}
                    hoveredWeek={hoveredWeek}
                    onDateHover={setHoveredDate}
                  />
                ),
              }}
              sx={{
                width: "100%",
                "& .MuiPickersCalendarHeader-root": { paddingInline: 0 },
                "& .MuiPickersCalendarHeader-label, & .MuiPickersCalendarHeader-switchViewButton, & .MuiPickersArrowSwitcher-button, & .MuiDayCalendar-weekDayLabel": {
                  color: "var(--app-color-text-inverse)",
                },
                "& .MuiPickerDay-root": { color: "var(--app-color-text-inverse)" },
                "& .MuiPickerDay-root.Mui-disabled": { color: "var(--app-color-on-brand-muted)" },
                "& .MuiPickerDay-root:not(.Mui-disabled):hover": {
                  backgroundColor: "var(--app-color-on-brand-hover)",
                },
              }}
            />
          </LocalizationProvider>
        </div>
      </div>
      <div className="border-t border-on-brand-border" />
      <div className="flex flex-col gap-6 p-5">
        <CalendarList selectedCalendars={visibleCalendars} onToggleCalendar={onToggleCalendar} />
        <TeamCalendarList />
      </div>
    </aside>
  );
}

type WorkingWeekDayProps = PickerDayProps & {
  selectedDate: Date;
  selectedWeek: Date[];
  hoveredWeek: Date[];
  onDateHover: (date: Date) => void;
};

type ThemedPickerDayProps = PickerDayProps & {
  inSelectedWeek: boolean;
  inHoveredWeek: boolean;
  isSelectedDate: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
};

const ThemedPickerDay = styled(PickerDay, {
  shouldForwardProp: (prop) =>
    !["inSelectedWeek", "inHoveredWeek", "isSelectedDate", "isRangeStart", "isRangeEnd"].includes(prop as string),
})<ThemedPickerDayProps>(({ inSelectedWeek, inHoveredWeek, isSelectedDate, isRangeStart, isRangeEnd }) => {
  const inWorkingWeekRange = inSelectedWeek || inHoveredWeek;
  const rangeColor = inSelectedWeek ? "var(--app-color-brand-light)" : "var(--app-color-brand-muted)";
  const rangeTextColor = inSelectedWeek ? "var(--app-color-text-inverse)" : "var(--app-color-text-on-brand-muted)";

  return {
    "--PickerDay-horizontalMargin": "0px",
    ...(inWorkingWeekRange
      ? {
          borderRadius: 0,
          backgroundColor: rangeColor,
          color: rangeTextColor,
          "&:hover, &:focus": { backgroundColor: rangeColor, color: rangeTextColor },
        }
      : {}),
    ...(inSelectedWeek
      ? {
          "&&": { color: "var(--app-color-text-inverse)" },
          "@media (pointer: fine)": {
            "&&:hover": { color: "var(--app-color-text-inverse)" },
          },
          "&&:focus": { color: "var(--app-color-text-inverse)" },
        }
      : {}),
    ...(inHoveredWeek
      ? {
          "&&": { color: "var(--app-color-text-on-brand-muted)" },
          "@media (pointer: fine)": {
            "&&:hover": { color: "var(--app-color-text-on-brand-muted)" },
          },
          "&&:focus": { color: "var(--app-color-text-on-brand-muted)" },
        }
      : {}),
    ...(isRangeStart ? { borderTopLeftRadius: "50%", borderBottomLeftRadius: "50%" } : {}),
    ...(isRangeEnd ? { borderTopRightRadius: "50%", borderBottomRightRadius: "50%" } : {}),
    ...(isSelectedDate
      ? {
          backgroundColor: "var(--app-color-brand-dark)",
          "&:hover, &:focus": { backgroundColor: "var(--app-color-brand-dark)" },
        }
      : {}),
  };
});

function WorkingWeekDay({
  day,
  selectedDate,
  selectedWeek,
  hoveredWeek,
  onDateHover,
  onMouseEnter,
  ...props
}: WorkingWeekDayProps) {
  const date = (day as Dayjs).toDate();
  const selectedIndex = selectedWeek.findIndex((workingDay) => isSameCalendarDay(workingDay, date));
  const hoveredIndex = hoveredWeek.findIndex((workingDay) => isSameCalendarDay(workingDay, date));
  const inSelectedWeek = selectedIndex !== -1;
  const inHoveredWeek = !inSelectedWeek && hoveredIndex !== -1;
  const isSelectedDate = isSameCalendarDay(date, selectedDate);
  const rangeStart = (inSelectedWeek && selectedIndex === 0) || (inHoveredWeek && hoveredIndex === 0);
  const rangeEnd =
    (inSelectedWeek && selectedIndex === selectedWeek.length - 1) ||
    (inHoveredWeek && hoveredIndex === hoveredWeek.length - 1);

  return (
    <ThemedPickerDay
      {...props}
      day={day}
      selected={false}
      inSelectedWeek={inSelectedWeek}
      inHoveredWeek={inHoveredWeek}
      isSelectedDate={isSelectedDate}
      isRangeStart={rangeStart}
      isRangeEnd={rangeEnd}
      onMouseEnter={(event, hoveredDay) => {
        onDateHover((day as Dayjs).toDate());
        onMouseEnter?.(event, hoveredDay);
      }}
    />
  );
}

function CalendarList({
  selectedCalendars,
  onToggleCalendar,
}: {
  selectedCalendars: MyCalendarName[];
  onToggleCalendar: (calendar: MyCalendarName) => void;
}) {
  return (
    <section>
      <h2 className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-on-brand-muted">My Calendars</h2>
      <div className="flex flex-col gap-1.5">
        {myCalendarNames.map((item) => (
          <label key={item} className="flex items-center gap-2 text-sm font-semibold text-text-inverse">
            <input
              checked={selectedCalendars.includes(item)}
              onChange={() => onToggleCalendar(item)}
              type="checkbox"
              className="accent-surface"
            />
            {item}
          </label>
        ))}
      </div>
    </section>
  );
}

function TeamCalendarList() {
  const members = ["Rahul Sharma (You)", "Amit Verma", "Priya Nair", "Neha Joshi", "Karan Mehta"];

  return (
    <section>
      <h2 className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-on-brand-muted">Team: Rahul Sharma</h2>
      <div className="flex flex-col gap-1">
        {members.map((name, index) => (
          <label key={name} className="flex items-center gap-2 text-sm font-semibold text-text-inverse">
            <input checked={index === 0} readOnly type="checkbox" className="accent-surface" />
            <span className="flex size-5 items-center justify-center rounded-full bg-surface text-[10px] text-brand">
              {name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
            </span>
            {name}
          </label>
        ))}
      </div>
    </section>
  );
}
