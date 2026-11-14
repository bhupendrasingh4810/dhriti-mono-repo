"use client";

import { useRef } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { fieldActionClass } from "./field-primitives";
import { PickerShell, type FieldPickerProps } from "./picker-shell";

export interface DhritiDateFieldProps extends FieldPickerProps {
  /** Selected value and bounds use YYYY-MM-DD, YYYY-MM, or YYYY for the chosen mode. */
  mode?: "date" | "month" | "year";
  /** YYYY-MM navigation anchor, controlled independently of selection in every mode. */
  month: string;
  onMonthChange: (month: string) => void;
  min?: string;
  max?: string;
  locale?: string;
  weekStartsOn?: 0 | 1;
}

function parseDate(value: string): Date {
  const date = new Date(`${value}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new RangeError("DhritiDateField requires valid YYYY-MM-DD dates.");
  }
  return date;
}
function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function DhritiDateField({
  mode = "date",
  month,
  onMonthChange,
  min,
  max,
  locale = "en-GB",
  weekStartsOn = 0,
  ...props
}: DhritiDateFieldProps) {
  if (!["date", "month", "year"].includes(mode))
    throw new RangeError("DhritiDateField mode must be date, month, or year.");
  if (mode !== "date") {
    return (
      <PeriodPicker
        {...props}
        mode={mode}
        month={month}
        onMonthChange={onMonthChange}
        min={min}
        max={max}
        locale={locale}
      />
    );
  }
  return (
    <DayPicker
      {...props}
      month={month}
      onMonthChange={onMonthChange}
      min={min}
      max={max}
      locale={locale}
      weekStartsOn={weekStartsOn}
    />
  );
}

function PeriodPicker({
  mode,
  month,
  onMonthChange,
  min,
  max,
  locale = "en-GB",
  ...props
}: DhritiDateFieldProps & { mode: "month" | "year" }) {
  const first = parseDate(`${month}-01`);
  const parse = (value: string) => {
    if (!(mode === "month" ? /^\d{4}-\d{2}$/ : /^\d{4}$/).test(value)) {
      throw new RangeError(
        `DhritiDateField ${mode} mode requires valid ${mode === "month" ? "YYYY-MM" : "YYYY"} values.`,
      );
    }
    return parseDate(mode === "month" ? `${value}-01` : `${value}-01-01`);
  };
  const selected = props.value ? parse(props.value) : null;
  if (min) parse(min);
  if (max) parse(max);
  if (min && max && min > max) throw new RangeError("DhritiDateField min must not be after max.");
  const year = first.getUTCFullYear();
  const start = mode === "month" ? year : Math.floor(year / 12) * 12;
  const padYear = (value: number) => String(value).padStart(4, "0");
  const values = Array.from({ length: mode === "month" ? 12 : Math.min(12, 10000 - start) }, (_, index) =>
    mode === "month" ? `${padYear(year)}-${String(index + 1).padStart(2, "0")}` : padYear(start + index),
  );
  const allowed = (value: string) => (!min || value >= min) && (!max || value <= max);
  const preferred = values.includes(props.value) && allowed(props.value) ? props.value : values.find(allowed);
  const grid = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
  const previousYear = mode === "month" ? year - 1 : start - 12;
  const nextYear = mode === "month" ? year + 1 : start + 12;
  const lowerYear = min ? parse(min).getUTCFullYear() : 0;
  const upperYear = max ? parse(max).getUTCFullYear() : 9999;
  const heading = mode === "month" ? padYear(year) : `${padYear(start)} – ${padYear(start + values.length - 1)}`;
  return (
    <PickerShell
      {...props}
      widthClass="w-field-calendar"
      icon={<CalendarDays className="size-4" aria-hidden="true" />}
      pickerLabel={`${props.label} ${mode} picker`}
      displayValue={
        selected ? format(selected, mode === "month" ? { month: "long", year: "numeric" } : { year: "numeric" }) : ""
      }
      onOpen={() => {
        if (props.value) onMonthChange(mode === "month" ? props.value : `${props.value}-01`);
      }}
    >
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p aria-live="polite" className="text-sm font-semibold text-text-primary">
            {heading}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={mode === "month" ? "Previous year" : "Previous years"}
              disabled={previousYear < 0 || (mode === "month" ? previousYear : start - 1) < lowerYear}
              className={`${fieldActionClass} p-2`}
              onClick={() => onMonthChange(`${padYear(previousYear)}-01`)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={mode === "month" ? "Next year" : "Next years"}
              disabled={nextYear > 9999 || nextYear > upperYear}
              className={`${fieldActionClass} p-2`}
              onClick={() => onMonthChange(`${padYear(nextYear)}-01`)}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div ref={grid} role="grid" aria-label={heading}>
          {Array.from({ length: Math.ceil(values.length / 3) }, (_, row) => (
            <div key={row} role="row" className="grid grid-cols-3 gap-2">
              {values.slice(row * 3, row * 3 + 3).map((value) => (
                <div key={value} role="gridcell" aria-selected={props.value === value} className="py-1">
                  <button
                    type="button"
                    data-picker-option
                    data-picker-close
                    data-period={value}
                    data-picker-initial={preferred === value ? "" : undefined}
                    ref={(node) => {
                      if (node && pendingFocus.current === value) {
                        node.focus();
                        pendingFocus.current = null;
                      }
                    }}
                    disabled={!allowed(value)}
                    tabIndex={preferred === value ? 0 : -1}
                    aria-label={mode === "month" ? format(parse(value), { month: "long", year: "numeric" }) : value}
                    className={`${fieldActionClass} w-full rounded-md py-3 text-xs ${props.value === value ? "bg-brand text-text-inverse hover:bg-brand-dark hover:text-text-inverse" : "text-text-primary hover:bg-background"}`}
                    onClick={() => {
                      props.onChange(value);
                      props.onOpenChange(false);
                    }}
                    onKeyDown={(event) => {
                      const index = values.indexOf(value);
                      const directions: Record<string, number> = {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -3,
                        ArrowDown: 3,
                      };
                      const delta = directions[event.key];
                      const targetIndex =
                        event.key === "Home"
                          ? index - (index % 3)
                          : event.key === "End"
                            ? Math.min(index - (index % 3) + 2, values.length - 1)
                            : delta === undefined
                              ? null
                              : index + delta;
                      if (targetIndex === null) return;
                      event.preventDefault();
                      const date = parse(value);
                      if (mode === "month") date.setUTCMonth(date.getUTCMonth() + targetIndex - index);
                      else date.setUTCFullYear(date.getUTCFullYear() + targetIndex - index);
                      if (date.getUTCFullYear() < 0 || date.getUTCFullYear() > 9999) return;
                      const target = dateString(date).slice(0, mode === "month" ? 7 : 4);
                      if (!allowed(target)) return;
                      if (values.includes(target))
                        grid.current?.querySelector<HTMLButtonElement>(`[data-period="${target}"]`)?.focus();
                      else {
                        pendingFocus.current = target;
                        onMonthChange(dateString(date).slice(0, 7));
                      }
                    }}
                  >
                    {mode === "month" ? format(parse(value), { month: "short" }) : value}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </PickerShell>
  );
}
function DayPicker({
  month,
  onMonthChange,
  min,
  max,
  locale = "en-GB",
  weekStartsOn = 0,
  ...props
}: DhritiDateFieldProps) {
  const first = parseDate(`${month}-01`);
  const selected = props.value ? parseDate(props.value) : null;
  if (min) parseDate(min);
  if (max) parseDate(max);
  if (min && max && min > max) throw new RangeError("DhritiDateField min must not be after max.");
  const last = new Date(first);
  last.setUTCMonth(last.getUTCMonth() + 1);
  last.setUTCDate(0);
  const days = last.getUTCDate();
  const offset = (first.getUTCDay() - weekStartsOn + 7) % 7;
  const grid = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const allowed = (date: string) => (!min || date >= min) && (!max || date <= max);
  const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
  function shiftMonth(amount: number) {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + amount);
    return dateString(next).slice(0, 7);
  }
  const previous = shiftMonth(-1),
    next = shiftMonth(1);
  const previousDisabled = month === "0000-01" || Boolean(min && previous < min.slice(0, 7));
  const nextDisabled = month === "9999-12" || Boolean(max && next > max.slice(0, 7));
  const preferred =
    props.value.startsWith(month) && allowed(props.value)
      ? props.value
      : Array.from({ length: days }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`).find(allowed);
  return (
    <PickerShell
      {...props}
      widthClass="w-field-calendar"
      icon={<CalendarDays className="size-4" aria-hidden="true" />}
      pickerLabel={`${props.label} calendar`}
      displayValue={selected ? format(selected, { day: "2-digit", month: "short", year: "numeric" }) : ""}
      onOpen={() => {
        if (props.value) onMonthChange(props.value.slice(0, 7));
      }}
    >
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p aria-live="polite" className="text-sm font-semibold text-text-primary">
            {format(first, { month: "long", year: "numeric" })}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous month"
              disabled={previousDisabled}
              className={`${fieldActionClass} p-2`}
              onClick={() => onMonthChange(previous)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={nextDisabled}
              className={`${fieldActionClass} p-2`}
              onClick={() => onMonthChange(next)}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div ref={grid} role="grid" aria-label={format(first, { month: "long", year: "numeric" })}>
          <div role="row" className="grid grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => {
              const date = addDays(parseDate("2026-11-01"), index + weekStartsOn);
              return (
                <span
                  key={index}
                  role="columnheader"
                  aria-label={format(date, { weekday: "long" })}
                  className="py-2 text-center text-xs text-text-muted"
                >
                  {format(date, { weekday: "narrow" })}
                </span>
              );
            })}
          </div>
          {Array.from({ length: Math.ceil((offset + days) / 7) }, (_, week) => (
            <div key={week} role="row" className="grid grid-cols-7">
              {Array.from({ length: 7 }, (_, column) => {
                const day = week * 7 + column - offset + 1;
                if (day < 1 || day > days) return <span role="gridcell" key={column} />;
                const value = `${month}-${String(day).padStart(2, "0")}`;
                const date = parseDate(value);
                return (
                  <div
                    role="gridcell"
                    aria-selected={props.value === value}
                    key={column}
                    className="flex justify-center py-0.5"
                  >
                    <button
                      type="button"
                      data-picker-option
                      data-picker-close
                      data-picker-initial={preferred === value ? "" : undefined}
                      data-date={value}
                      ref={(node) => {
                        if (node && pendingFocus.current === value) {
                          node.focus();
                          pendingFocus.current = null;
                        }
                      }}
                      disabled={!allowed(value)}
                      tabIndex={preferred === value ? 0 : -1}
                      aria-label={format(date, { dateStyle: "full" })}
                      className={`${fieldActionClass} size-9 max-w-full rounded-full text-xs ${props.value === value ? "bg-brand text-text-inverse hover:bg-brand-dark hover:text-text-inverse" : "text-text-primary hover:bg-background"}`}
                      onClick={() => {
                        props.onChange(value);
                        props.onOpenChange(false);
                      }}
                      onKeyDown={(event) => {
                        let target: Date;
                        if (event.key === "ArrowLeft") target = addDays(date, -1);
                        else if (event.key === "ArrowRight") target = addDays(date, 1);
                        else if (event.key === "ArrowUp") target = addDays(date, -7);
                        else if (event.key === "ArrowDown") target = addDays(date, 7);
                        else if (event.key === "Home")
                          target = addDays(date, -((date.getUTCDay() - weekStartsOn + 7) % 7));
                        else if (event.key === "End")
                          target = addDays(date, 6 - ((date.getUTCDay() - weekStartsOn + 7) % 7));
                        else return;
                        event.preventDefault();
                        if (target.getUTCFullYear() < 0 || target.getUTCFullYear() > 9999) return;
                        const targetValue = dateString(target);
                        if (!allowed(targetValue)) return;
                        if (!targetValue.startsWith(month)) {
                          pendingFocus.current = targetValue;
                          onMonthChange(targetValue.slice(0, 7));
                        } else grid.current?.querySelector<HTMLButtonElement>(`[data-date="${targetValue}"]`)?.focus();
                      }}
                    >
                      {day}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </PickerShell>
  );
}
