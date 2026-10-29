import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { settingsInputClass } from "./SettingsSection";

export function SettingsTagsInput({
  id,
  value,
  disabled,
  maxItems,
  maxLength,
  placeholder,
  pattern,
  patternHint,
  label,
  onChange,
}: {
  id: string;
  value: string[];
  disabled?: boolean;
  maxItems: number;
  maxLength: number;
  placeholder: string;
  pattern?: RegExp;
  patternHint?: string;
  label: string;
  onChange: (value: string[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const full = value.length >= maxItems;

  function add() {
    const next = text.trim();
    if (!next) return;
    if (pattern && !pattern.test(next)) {
      setError(patternHint ?? "Invalid value.");
      return;
    }
    if (!value.includes(next)) {
      onChange([...value, next]);
    }
    setText("");
    setError("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && !text && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={label}>
          {value.map((item) => (
            <li
              key={item}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-brand-muted py-1 pl-2.5 pr-1 text-xs font-medium text-brand-dark"
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value.filter((entry) => entry !== item))}
                aria-label={`Remove ${item}`}
                className="grid size-4 place-items-center rounded-full hover:bg-brand/20 disabled:cursor-not-allowed"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={id}
        value={text}
        disabled={disabled || full}
        maxLength={maxLength}
        placeholder={full ? `Limit of ${maxItems} reached` : placeholder}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          setText(event.target.value);
          setError("");
        }}
        onKeyDown={onKeyDown}
        onBlur={add}
        className={settingsInputClass}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
