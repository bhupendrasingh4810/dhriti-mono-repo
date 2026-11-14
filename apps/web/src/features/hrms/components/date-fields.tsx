"use client";

import { useState } from "react";
import Popover from "@mui/material/Popover";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { MultiSectionDigitalClock } from "@mui/x-date-pickers/MultiSectionDigitalClock";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import dayjs, { type Dayjs } from "dayjs";

import { Icon } from "./ui-primitives";

/**
 * Date inputs: the calendar is MUI's DateCalendar (inside a Popover), but the field itself is a plain themed
 * button, so the whole field opens the calendar. MUI colours are overridden with the app's CSS theme variables.
 */
const calendarSx = {
  bgcolor: "var(--color-surface)",
  color: "var(--color-text-primary)",
  "& .MuiPickersCalendarHeader-label, & .MuiDayCalendar-weekDayLabel, & .MuiPickerDay-root, & .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton": {
    color: "var(--color-text-primary)",
    fontFamily: "inherit",
  },
  "& .MuiDayCalendar-weekDayLabel": { color: "var(--color-text-muted)" },
  "& .MuiIconButton-root": { color: "var(--color-text-secondary)" },
  "& .MuiPickerDay-root:hover": { bgcolor: "var(--color-surface-raised)" },
  "& .MuiPickerDay-root.Mui-selected, & .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersMonth-monthButton.Mui-selected": {
    bgcolor: "var(--color-brand)",
    color: "var(--color-surface)",
  },
  "& .MuiPickerDay-root.Mui-selected:hover": { bgcolor: "var(--color-brand-dark)" },
  "& .MuiPickerDay-today:not(.Mui-selected)": { borderColor: "var(--color-brand)" },
  "& .MuiMultiSectionDigitalClockSection-item": { color: "var(--color-text-primary)", fontFamily: "inherit" },
  "& .MuiMultiSectionDigitalClockSection-item:hover": { bgcolor: "var(--color-surface-raised)" },
  "& .MuiMultiSectionDigitalClockSection-item.Mui-selected": { bgcolor: "var(--color-brand)", color: "var(--color-surface)" },
  "& .MuiMultiSectionDigitalClockSection-root": { borderColor: "var(--color-border)" },
  "& .Mui-disabled": { color: "var(--color-text-muted)", opacity: 0.45 },
} as const;

const paperSx = {
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg, 12px)",
  bgcolor: "var(--color-surface)",
  backgroundImage: "none",
  mt: 0.5,
} as const;

const fieldClass =
  "flex min-w-[11rem] cursor-pointer items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-left text-sm text-text-primary hover:border-border-strong";

interface Bounds {
  minDate?: Dayjs;
  maxDate?: Dayjs;
}

/** Single date field; `label` is shown above the value. */
export function DateField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  labelOutside = false,
}: {
  label: string;
  value: Dayjs;
  onChange: (value: Dayjs) => void;
  /** Renders the label above the field instead of inside it. */
  labelOutside?: boolean;
} & Bounds) {
  const [element, setElement] = useState<HTMLButtonElement | null>(null);
  const [isOpen, setOpen] = useState(false);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  return (
    <div className={labelOutside ? "min-w-0" : undefined}>
      {labelOutside && <span className="mb-1 block text-sm font-medium text-text-secondary">{label}</span>}
      <button type="button" ref={setElement} aria-label={label} aria-haspopup="dialog" onClick={show} className={labelOutside ? `${fieldClass} w-full` : fieldClass}>
        <span>
          {!labelOutside && <span className="block text-xs text-text-muted">{label}</span>}
          {value.format("DD MMM YYYY")}
        </span>
        <Icon name="calendar" size={16} className="text-text-muted" />
      </button>
      <Popover open={isOpen} anchorEl={element} onClose={hide} slotProps={{ paper: { sx: paperSx } }}>
        <DateCalendar
          value={value}
          minDate={minDate}
          maxDate={maxDate}
          onChange={(next) => {
            if (next) {
              onChange(next);
              hide();
            }
          }}
          sx={calendarSx}
        />
      </Popover>
    </div>
  );
}

type RangeDayProps = PickerDayProps & { rangeStart?: Dayjs | null; rangeEnd?: Dayjs | null };

function RangeDay({ rangeStart, rangeEnd, day, outsideCurrentMonth, ...rest }: RangeDayProps) {
  const inside = Boolean(rangeStart && rangeEnd && day.isAfter(rangeStart, "day") && day.isBefore(rangeEnd, "day"));
  const edge = Boolean((rangeStart && day.isSame(rangeStart, "day")) || (rangeEnd && day.isSame(rangeEnd, "day")));
  return (
    <PickerDay
      {...rest}
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      selected={edge}
      sx={inside ? { bgcolor: "var(--color-brand-muted)", borderRadius: 0 } : undefined}
    />
  );
}

/**
 * Date-range field: one input opens a popover with two consecutive months. The first click picks the start,
 * the second the end (swapped if earlier), which applies the range and closes the popover.
 */
export function DateRangeField({
  label,
  from,
  to,
  onChange,
  minDate,
  maxDate,
}: {
  label: string;
  from: Dayjs;
  to: Dayjs;
  onChange: (from: Dayjs, to: Dayjs) => void;
} & Bounds) {
  const [element, setElement] = useState<HTMLButtonElement | null>(null);
  const [isOpen, setOpen] = useState(false);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const [month, setMonth] = useState(() => from.startOf("month"));
  const [pending, setPending] = useState<Dayjs | null>(null);

  const open = () => {
    setPending(null);
    setMonth(from.startOf("month"));
    show();
  };
  const pick = (day: Dayjs | null) => {
    if (!day) return;
    if (!pending) {
      setPending(day);
      return;
    }
    const [start, end] = day.isBefore(pending, "day") ? [day, pending] : [pending, day];
    onChange(start, end);
    hide();
  };

  const shown = pending ? { start: pending, end: null } : { start: from, end: to };
  const calendar = (offset: 0 | 1) => {
    const reference = month.add(offset, "month");
    return (
      <DateCalendar
        key={`${offset}-${reference.format("YYYY-MM")}`}
        value={null}
        referenceDate={reference}
        minDate={minDate}
        maxDate={maxDate}
        onChange={pick}
        onMonthChange={(next) => setMonth(next.subtract(offset, "month").startOf("month"))}
        slots={{ day: RangeDay as never }}
        slotProps={{ day: { rangeStart: shown.start, rangeEnd: shown.end } as never }}
        sx={calendarSx}
      />
    );
  };

  return (
    <>
      <button type="button" ref={setElement} aria-label={label} aria-haspopup="dialog" onClick={open} className={`${fieldClass} min-w-[17rem]`}>
        <span>
          <span className="block text-xs text-text-muted">{label}</span>
          {from.format("DD MMM YYYY")} – {to.format("DD MMM YYYY")}
        </span>
        <Icon name="calendar" size={16} className="text-text-muted" />
      </button>
      <Popover open={isOpen} anchorEl={element} onClose={hide} slotProps={{ paper: { sx: paperSx } }}>
        <div className="flex flex-wrap">
          {calendar(0)}
          {calendar(1)}
        </div>
        {pending && <p className="px-4 pb-3 text-xs text-text-muted">Select the end date ({dayjs(pending).format("D MMM YYYY")} chosen as start)</p>}
      </Popover>
    </>
  );
}

/** 24-hour time field ("HH:mm"); the whole field opens a MUI digital clock in a themed popover. */
export function TimeField({
  label,
  value,
  onChange,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const [element, setElement] = useState<HTMLButtonElement | null>(null);
  const [isOpen, setOpen] = useState(false);
  const time = value ? dayjs(`2000-01-01T${value}`) : null;
  return (
    <>
      <button
        type="button"
        ref={setElement}
        aria-label={label}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`mt-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-surface px-3 py-2 text-left text-sm text-text-primary hover:border-border-strong ${invalid ? "border-error" : "border-border"}`}
      >
        <span className={value ? "" : "text-text-muted"}>{value || "--:--"}</span>
        <Icon name="clock" size={16} className="text-text-muted" />
      </button>
      <Popover open={isOpen} anchorEl={element} onClose={() => setOpen(false)} slotProps={{ paper: { sx: paperSx } }}>
        <MultiSectionDigitalClock
          ampm={false}
          value={time}
          onChange={(next) => next && onChange(next.format("HH:mm"))}
          sx={calendarSx}
        />
        <div className="flex justify-end border-t border-border p-2">
          <button type="button" onClick={() => setOpen(false)} className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold text-brand hover:bg-surface-raised">
            Done
          </button>
        </div>
      </Popover>
    </>
  );
}
