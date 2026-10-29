import { settingsInputClass } from "./SettingsSection";

/** Integer input with an optional "no limit" switch that stores `null`. */
export function SettingsNumberInput({
  id,
  value,
  disabled,
  min,
  max,
  unit,
  noLimitLabel,
  onChange,
}: {
  id: string;
  value: number | null;
  disabled?: boolean;
  min: number;
  max: number;
  unit?: string;
  noLimitLabel?: string;
  onChange: (value: number | null) => void;
}) {
  const unlimited = value === null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={unlimited ? "" : value}
          disabled={disabled || unlimited}
          placeholder={unlimited ? noLimitLabel : undefined}
          onChange={(event) => {
            const next = event.target.valueAsNumber;
            onChange(Number.isNaN(next) ? (noLimitLabel ? null : min) : next);
          }}
          className={settingsInputClass}
        />
        {unit ? <span className="shrink-0 text-xs text-text-secondary">{unit}</span> : null}
      </div>
      {noLimitLabel ? (
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={unlimited}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked ? null : min)}
            className="size-4 accent-brand"
          />
          {noLimitLabel}
        </label>
      ) : null}
    </div>
  );
}
