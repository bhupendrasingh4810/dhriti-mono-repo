import { formatDate } from "../profile-format";
import { profileInputClass } from "./ProfileSection";

export function ProfileField({
  label,
  name,
  value,
  editing,
  disabled,
  onChange,
  type = "text",
  options,
  maxLength,
  max,
  pattern,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  editing: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "date";
  options?: string[];
  maxLength?: number;
  max?: string;
  pattern?: string;
  placeholder?: string;
}) {
  if (!editing) {
    return (
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className={`mt-2 break-words text-sm ${value ? "text-text-primary" : "text-text-secondary"}`}>
          {value ? (type === "date" ? formatDate(value) : value) : "Not provided"}
        </p>
      </div>
    );
  }
  return (
    <label className="space-y-2 text-sm font-medium">
      <span className="block">{label}</span>
      {options ? (
        <select
          name={name}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={profileInputClass}
        >
          <option value="">Not provided</option>
          {value && !options.includes(value) ? <option value={value}>{value}</option> : null}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          max={max}
          pattern={pattern}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={profileInputClass}
        />
      )}
    </label>
  );
}
