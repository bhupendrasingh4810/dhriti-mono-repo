import type { SettingsFieldConfig, SettingsOption } from "../settings-schema";
import { validateSettingsField } from "../settings-schema";
import { SettingsChipSelect } from "./SettingsChipSelect";
import { SettingsNumberInput } from "./SettingsNumberInput";
import { SettingsRow, settingsInputClass } from "./SettingsSection";
import { SettingsTagsInput } from "./SettingsTagsInput";
import { SettingsToggle } from "./SettingsToggle";
import { SettingsWeekdayPicker } from "./SettingsWeekdayPicker";

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/** Renders one config-driven setting with the right control for its kind. */
export function SettingsField({
  field,
  value,
  disabled,
  dynamicOptions = [],
  onChange,
}: {
  field: SettingsFieldConfig;
  value: unknown;
  disabled: boolean;
  dynamicOptions?: SettingsOption[];
  onChange: (value: unknown) => void;
}) {
  const id = `setting-${field.key}`;
  const error = disabled ? null : validateSettingsField(field, value);

  switch (field.kind) {
    case "toggle":
      return (
        <SettingsRow label={field.label} description={field.description}>
          <div className="flex sm:justify-end">
            <SettingsToggle
              id={id}
              label={field.label}
              checked={Boolean(value)}
              disabled={disabled}
              onChange={onChange}
            />
          </div>
        </SettingsRow>
      );
    case "number":
      return (
        <SettingsRow label={field.label} description={field.description} htmlFor={id} error={error}>
          <SettingsNumberInput
            id={id}
            value={value as number | null}
            disabled={disabled}
            min={field.min}
            max={field.max}
            unit={field.unit}
            noLimitLabel={field.noLimitLabel}
            onChange={onChange}
          />
        </SettingsRow>
      );
    case "select":
      return (
        <SettingsRow label={field.label} description={field.description} htmlFor={id}>
          <select
            id={id}
            value={String(value ?? "")}
            disabled={disabled}
            onChange={(event) => onChange(field.nullLabel && !event.target.value ? null : event.target.value)}
            className={settingsInputClass}
          >
            {field.nullLabel ? <option value="">{field.nullLabel}</option> : null}
            {[...field.options, ...dynamicOptions].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsRow>
      );
    case "hour":
      return (
        <SettingsRow label={field.label} description={field.description} htmlFor={id}>
          <select
            id={id}
            value={Number(value)}
            disabled={disabled}
            onChange={(event) => onChange(Number(event.target.value))}
            className={settingsInputClass}
          >
            {Array.from({ length: field.max - field.min + 1 }, (_, index) => field.min + index).map((hour) => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </select>
        </SettingsRow>
      );
    case "time":
      return (
        <SettingsRow label={field.label} description={field.description} htmlFor={id}>
          <input
            id={id}
            type="time"
            value={String(value ?? "")}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            className={settingsInputClass}
          />
        </SettingsRow>
      );
    case "text":
      return (
        <SettingsRow label={field.label} description={field.description} htmlFor={id} error={error}>
          <input
            id={id}
            value={String(value ?? "")}
            disabled={disabled}
            maxLength={field.maxLength}
            onChange={(event) => onChange(field.uppercase ? event.target.value.toUpperCase() : event.target.value)}
            className={settingsInputClass}
          />
        </SettingsRow>
      );
    case "weekdays":
      return (
        <SettingsRow label={field.label} description={field.description} error={error}>
          <SettingsWeekdayPicker
            label={field.label}
            value={(value as number[]) ?? []}
            disabled={disabled}
            onChange={onChange}
          />
        </SettingsRow>
      );
    case "tags":
      return (
        <SettingsRow label={field.label} description={field.description} htmlFor={id} error={error} stacked>
          <SettingsTagsInput
            id={id}
            label={field.label}
            value={(value as string[]) ?? []}
            disabled={disabled}
            maxItems={field.maxItems}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            pattern={field.pattern}
            patternHint={field.patternHint}
            onChange={onChange}
          />
        </SettingsRow>
      );
    case "multiselect":
      return (
        <SettingsRow label={field.label} description={field.description} stacked>
          <SettingsChipSelect
            label={field.label}
            value={(value as string[]) ?? []}
            options={dynamicOptions}
            disabled={disabled}
            maxItems={field.maxItems}
            emptyLabel={field.emptyLabel}
            onChange={onChange}
          />
        </SettingsRow>
      );
  }
}
