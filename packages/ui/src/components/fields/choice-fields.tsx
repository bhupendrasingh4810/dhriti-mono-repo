"use client";

import { useEffect, useRef } from "react";
import { FieldFrame, useFieldIdentity, type FieldPresentationProps } from "./field-primitives";

export interface DhritiChoiceFieldProps extends FieldPresentationProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
  value?: string;
}
export interface DhritiCheckboxFieldProps extends DhritiChoiceFieldProps {
  indeterminate?: boolean;
}

function ChoiceField({
  type,
  indeterminate,
  checked,
  onChange,
  name,
  value,
  ...props
}: DhritiCheckboxFieldProps & { type: "checkbox" | "radio" }) {
  const identity = useFieldIdentity(props);
  const input = useRef<HTMLInputElement>(null);
  const blocked = props.disabled || props.readOnly;
  useEffect(() => {
    if (input.current) input.current.indeterminate = type === "checkbox" && Boolean(indeterminate);
  }, [indeterminate, type]);
  return (
    <FieldFrame {...props} id={identity.id} showLabel={false}>
      <label
        className={`flex items-center gap-2 text-sm text-text-primary ${blocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <input
          ref={input}
          {...identity.input}
          type={type}
          role={type}
          checked={checked}
          name={name}
          value={value}
          disabled={blocked}
          required={props.required}
          aria-label={props.label}
          aria-checked={type === "checkbox" && indeterminate ? "mixed" : checked}
          className={`size-4 shrink-0 cursor-pointer accent-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed ${props.error ? "outline outline-1 outline-error" : ""}`}
          onChange={(event) => {
            if (!blocked) onChange(event.target.checked);
          }}
        />
        {props.showLabel !== false && (
          <span>
            {props.label}
            {props.required && (
              <span className="ml-1 text-error" aria-hidden="true">
                *
              </span>
            )}
          </span>
        )}
      </label>
    </FieldFrame>
  );
}
export function DhritiCheckboxField(props: DhritiCheckboxFieldProps) {
  return <ChoiceField {...props} type="checkbox" />;
}
export function DhritiRadioField(props: DhritiChoiceFieldProps) {
  return <ChoiceField {...props} type="radio" />;
}
