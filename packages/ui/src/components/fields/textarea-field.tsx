"use client";

import type { FocusEventHandler } from "react";
import {
  FieldFrame,
  fieldInputClass,
  fieldSizes,
  fieldSurface,
  useFieldIdentity,
  type FieldPresentationProps,
} from "./field-primitives";

export interface DhritiTextareaFieldProps extends FieldPresentationProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  rows?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  resize?: "none" | "vertical";
  onBlur?: FocusEventHandler<HTMLTextAreaElement>;
}

export function DhritiTextareaField({
  value,
  onChange,
  name,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  resize = "vertical",
  onBlur,
  ...props
}: DhritiTextareaFieldProps) {
  const identity = useFieldIdentity(props);
  const size = fieldSizes[props.size ?? "md"];
  return (
    <FieldFrame
      {...props}
      id={identity.id}
      details={
        showCharacterCount && (
          <p className="text-right text-xs text-text-muted" aria-label="Character count">
            {value.length}
            {maxLength === undefined ? " characters" : ` / ${maxLength}`}
          </p>
        )
      }
    >
      <textarea
        {...identity.input}
        value={value}
        name={name}
        rows={rows}
        maxLength={maxLength}
        required={props.required}
        disabled={props.disabled}
        readOnly={props.readOnly}
        placeholder={props.placeholder}
        onBlur={onBlur}
        onChange={(event) => {
          if (!props.disabled && !props.readOnly) onChange(event.target.value);
        }}
        className={`${fieldSurface(props)} ${fieldInputClass} ${size.padding} ${size.text} block ${resize === "none" ? "resize-none" : "resize-y"}`}
      />
    </FieldFrame>
  );
}
