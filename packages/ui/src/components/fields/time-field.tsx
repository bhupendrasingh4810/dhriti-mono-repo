"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { Clock } from "lucide-react";
import { fieldActionClass } from "./field-primitives";
import { PickerShell, pickerOptionClass, type FieldPickerProps } from "./picker-shell";

export interface DhritiTimeFieldProps extends FieldPickerProps {
  /** Positive integer divisor of 60. Existing off-step minutes remain selectable. */
  minuteStep?: number;
  min?: string;
  max?: string;
  hourLabel?: string;
  minuteLabel?: string;
  doneLabel?: string;
}
function timeMinutes(value: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new RangeError("DhritiTimeField requires HH:mm (24-hour) values.");
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
const pad = (number: number) => String(number).padStart(2, "0");

/** Selections emit immediately; Done requests dismissal, rather than committing an internal draft. */
export function DhritiTimeField({
  minuteStep = 5,
  min,
  max,
  hourLabel = "Hours",
  minuteLabel = "Minutes",
  doneLabel = "Done",
  ...props
}: DhritiTimeFieldProps) {
  if (!Number.isInteger(minuteStep) || minuteStep < 1 || 60 % minuteStep !== 0)
    throw new RangeError("DhritiTimeField minuteStep must be a positive divisor of 60.");
  const minimum = min ? timeMinutes(min) : 0,
    maximum = max ? timeMinutes(max) : 1439;
  if (minimum > maximum) throw new RangeError("DhritiTimeField min must not be after max.");
  const selected = props.value ? timeMinutes(props.value) : null;
  const reference = selected ?? minimum;
  const hour = Math.floor(reference / 60),
    minute = reference % 60;
  const columns = useRef<HTMLDivElement>(null);
  const allowed = (hour: number, minute: number) => hour * 60 + minute >= minimum && hour * 60 + minute <= maximum;
  const minuteOptions = [
    ...new Set([...Array.from({ length: 60 / minuteStep }, (_, index) => index * minuteStep), minute]),
  ].sort((a, b) => a - b);
  useEffect(() => {
    if (!props.open) return;
    columns.current?.querySelectorAll<HTMLElement>('[aria-selected="true"]').forEach((element) => {
      if (typeof element.scrollIntoView === "function") element.scrollIntoView({ block: "nearest" });
    });
  }, [props.open, props.value]);
  function focusOption(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const options = Array.from(
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    );
    const index = options.indexOf(event.currentTarget);
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : event.key === "ArrowDown"
            ? (index + 1) % options.length
            : (index - 1 + options.length) % options.length;
    options[target]?.focus();
  }
  return (
    <PickerShell
      {...props}
      widthClass="w-field-time"
      displayValue={props.value}
      icon={<Clock className="size-4" aria-hidden="true" />}
      pickerLabel={`${props.label} time picker`}
    >
      <div className="border-b border-border bg-background px-4 py-3">
        <p className="text-xs text-text-muted">24-hour time</p>
        <p aria-live="polite" className="mt-1 font-mono text-xl font-semibold text-text-primary">
          {props.value || "--:--"}
        </p>
      </div>
      <div className="grid grid-cols-2">
        <p className="border-r border-border px-3 py-2 text-center text-xs font-semibold text-text-secondary">
          {hourLabel}
        </p>
        <p className="px-3 py-2 text-center text-xs font-semibold text-text-secondary">{minuteLabel}</p>
      </div>
      <div ref={columns} className="grid grid-cols-2 border-y border-border">
        <div
          role="listbox"
          aria-label={`${props.label} ${hourLabel}`}
          className="max-h-52 overflow-y-auto border-r border-border p-1.5"
        >
          {Array.from({ length: 24 }, (_, nextHour) => {
            const lower = Math.max(0, minimum - nextHour * 60),
              upper = Math.min(59, maximum - nextHour * 60);
            const disabled = lower > upper;
            const nextMinute = Math.min(Math.max(minute, lower), upper);
            return (
              <button
                key={nextHour}
                type="button"
                role="option"
                data-picker-option
                data-picker-initial={nextHour === hour ? "" : undefined}
                aria-selected={selected !== null && nextHour === hour}
                disabled={disabled}
                tabIndex={nextHour === hour ? 0 : -1}
                className={`${pickerOptionClass} ${selected !== null && nextHour === hour ? "bg-brand text-text-inverse hover:bg-brand-dark hover:text-text-inverse" : ""}`}
                onKeyDown={focusOption}
                onClick={() => props.onChange(`${pad(nextHour)}:${pad(nextMinute)}`)}
              >
                {pad(nextHour)}
              </button>
            );
          })}
        </div>
        <div role="listbox" aria-label={`${props.label} ${minuteLabel}`} className="max-h-52 overflow-y-auto p-1.5">
          {minuteOptions.map((nextMinute) => (
            <button
              key={nextMinute}
              type="button"
              role="option"
              data-picker-option
              aria-selected={selected !== null && nextMinute === minute}
              tabIndex={nextMinute === minute ? 0 : -1}
              disabled={!allowed(hour, nextMinute)}
              className={`${pickerOptionClass} ${selected !== null && nextMinute === minute ? "bg-brand text-text-inverse hover:bg-brand-dark hover:text-text-inverse" : ""}`}
              onKeyDown={focusOption}
              onClick={() => props.onChange(`${pad(hour)}:${pad(nextMinute)}`)}
            >
              {pad(nextMinute)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end px-3 py-2">
        <button
          type="button"
          data-picker-close
          className={`${fieldActionClass} px-3 py-1.5 font-semibold text-brand`}
          onClick={() => {
            props.onOpenChange(false);
          }}
        >
          {doneLabel}
        </button>
      </div>
    </PickerShell>
  );
}
