import type { SettingsOption } from "../settings-schema";

export function SettingsChipSelect({
  value,
  options,
  disabled,
  maxItems,
  emptyLabel,
  label,
  onChange,
}: {
  value: string[];
  options: SettingsOption[];
  disabled?: boolean;
  maxItems: number;
  emptyLabel: string;
  label: string;
  onChange: (value: string[]) => void;
}) {
  // Keep saved values that are no longer offered visible so they can be removed.
  const missing = value
    .filter((entry) => !options.some((option) => option.value === entry))
    .map((entry) => ({ value: entry, label: "Unavailable" }));
  const allOptions = [...options, ...missing];
  if (allOptions.length === 0) {
    return <p className="text-xs text-text-secondary">{emptyLabel}</p>;
  }
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {allOptions.map((option) => {
        const selected = value.includes(option.value);
        const blocked = !selected && value.length >= maxItems;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled || blocked}
            onClick={() =>
              onChange(selected ? value.filter((entry) => entry !== option.value) : [...value, option.value])
            }
            className={`max-w-full truncate rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-brand bg-brand-muted text-brand-dark"
                : "border-border-strong bg-surface text-text-secondary hover:bg-surface-raised"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
