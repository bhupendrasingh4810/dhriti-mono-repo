"use client";

import { FieldFrame, useFieldIdentity } from "./field-primitives";
import type { DhritiChoiceFieldProps } from "./choice-fields";

/** Controlled checkbox with switch semantics; read-only switches remain focusable and submit their value. */
export function DhritiSwitchField({
  checked,
  onChange,
  name,
  value,
  ...props
}: DhritiChoiceFieldProps) {
  const identity = useFieldIdentity(props);
  const blocked = props.disabled || props.readOnly;
  return (
    <FieldFrame {...props} id={identity.id} showLabel={false}>
      <label className={`inline-flex max-w-full items-center gap-2 text-sm text-text-primary ${blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
        <span className="relative inline-flex shrink-0">
          <input
            {...identity.input}
            type="checkbox"
            role="switch"
            aria-label={props.label}
            aria-readonly={props.readOnly || undefined}
            checked={checked}
            name={name}
            value={value}
            disabled={props.disabled}
            required={props.required}
            className="peer sr-only"
            onClick={(event) => {
              if (props.readOnly) event.preventDefault();
            }}
            onChange={(event) => {
              if (!blocked) onChange(event.target.checked);
            }}
          />
          <span aria-hidden="true" className={`h-6 w-11 rounded-full border transition-colors peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${props.error ? "border-error" : "border-border-strong"} bg-border-strong`} />
          <span aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-text-inverse shadow-sm transition-transform peer-checked:translate-x-5 motion-reduce:transition-none" />
        </span>
        {props.showLabel !== false && (
          <span className="min-w-0 break-words">
            {props.label}
            {props.required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
          </span>
        )}
      </label>
    </FieldFrame>
  );
}
