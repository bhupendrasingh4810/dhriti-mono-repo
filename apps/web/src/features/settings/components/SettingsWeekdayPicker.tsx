import { WEEKDAY_OPTIONS } from "../settings-schema";

export function SettingsWeekdayPicker({
  value,
  disabled,
  label,
  onChange,
}: {
  value: number[];
  disabled?: boolean;
  label: string;
  onChange: (value: number[]) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {WEEKDAY_OPTIONS.map((day) => {
        const selected = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() =>
              onChange(
                selected
                  ? value.filter((entry) => entry !== day.value)
                  : [...value, day.value].sort((left, right) => left - right),
              )
            }
            className={`min-w-11 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-brand bg-brand text-text-inverse"
                : "border-border-strong bg-surface text-text-secondary hover:bg-surface-raised"
            }`}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
