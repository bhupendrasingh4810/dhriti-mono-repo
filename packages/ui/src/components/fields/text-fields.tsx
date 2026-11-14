"use client";

import { useRef, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import {
  ClearFieldButton,
  FieldFrame,
  fieldActionClass,
  fieldInputClass,
  fieldSizes,
  fieldSurface,
  useFieldIdentity,
  type DhritiTextFieldProps,
} from "./field-primitives";

function TextInput({
  type = "text",
  trailing,
  details,
  ...props
}: DhritiTextFieldProps & { type?: "text" | "email" | "password" | "tel"; trailing?: ReactNode; details?: ReactNode }) {
  const identity = useFieldIdentity(props);
  const size = fieldSizes[props.size ?? "md"];
  return (
    <FieldFrame {...props} id={identity.id} details={details}>
      <div className={`${fieldSurface(props)} flex items-center gap-2 ${size.padding}`}>
        {props.startIcon && <span className="shrink-0 text-text-muted">{props.startIcon}</span>}
        <input
          {...identity.input}
          type={type}
          name={props.name}
          autoComplete={props.autoComplete}
          maxLength={props.maxLength}
          value={props.value}
          onChange={(event) => {
            if (!props.disabled && !props.readOnly) props.onChange(event.target.value);
          }}
          onBlur={props.onBlur}
          disabled={props.disabled}
          readOnly={props.readOnly}
          required={props.required}
          placeholder={props.placeholder}
          className={`${fieldInputClass} ${size.text}`}
        />
        {props.clearable && props.value && (
          <ClearFieldButton
            label={props.label}
            disabled={props.disabled || props.readOnly}
            onClear={() => props.onChange("")}
          />
        )}
        {!props.clearable && props.endIcon && <span className="shrink-0 text-text-muted">{props.endIcon}</span>}
        {trailing}
      </div>
    </FieldFrame>
  );
}

export function DhritiTextField(props: DhritiTextFieldProps) {
  return <TextInput {...props} />;
}
/** Email format validation belongs to the parent; browser semantics remain type=email. */
export function DhritiEmailField(props: DhritiTextFieldProps) {
  return <TextInput {...props} type="email" />;
}

export interface DhritiNumberFieldProps extends DhritiTextFieldProps {
  min?: number;
  max?: number;
  step?: number;
}

export function DhritiNumberField(props: DhritiNumberFieldProps) {
  const identity = useFieldIdentity(props);
  const size = fieldSizes[props.size ?? "md"];
  const input = useRef<HTMLInputElement>(null);
  const blocked = props.disabled || props.readOnly;
  const numeric = props.value === "" ? undefined : Number(props.value);
  const invalid = numeric !== undefined && !Number.isFinite(numeric);
  function changeStep(direction: 1 | -1) {
    const element = input.current;
    if (!element || blocked || invalid) return;
    // Native stepping preserves decimal precision and min/max; restore the DOM until the parent updates value.
    element.value = props.value;
    if (direction === 1) element.stepUp();
    else element.stepDown();
    const next = element.value;
    element.value = props.value;
    if (next !== props.value) props.onChange(next);
  }
  return (
    <FieldFrame {...props} id={identity.id}>
      <div className={`${fieldSurface(props)} flex items-center gap-2`}>
        {props.startIcon && <span className="shrink-0 pl-3 text-text-muted">{props.startIcon}</span>}
        <input
          ref={input}
          {...identity.input}
          type="number"
          name={props.name}
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          value={props.value}
          onChange={(event) => {
            if (!blocked) props.onChange(event.target.value);
          }}
          onBlur={props.onBlur}
          disabled={props.disabled}
          readOnly={props.readOnly}
          required={props.required}
          placeholder={props.placeholder}
          className={`${fieldInputClass} ${size.text} ${size.vertical} ${props.startIcon ? "" : size.horizontal} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        {!blocked && (
          <div className="flex shrink-0 flex-col border-l border-border">
            <button
              type="button"
              aria-label={`Increase ${props.label}`}
              disabled={invalid || (props.max !== undefined && numeric !== undefined && numeric >= props.max)}
              className={`${fieldActionClass} border-b border-border px-2.5 py-1 hover:bg-background`}
              onClick={() => changeStep(1)}
            >
              <ChevronUp className="size-2.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Decrease ${props.label}`}
              disabled={invalid || (props.min !== undefined && numeric !== undefined && numeric <= props.min)}
              className={`${fieldActionClass} px-2.5 py-1 hover:bg-background`}
              onClick={() => changeStep(-1)}
            >
              <ChevronDown className="size-2.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </FieldFrame>
  );
}

export interface DhritiPasswordFieldProps extends DhritiTextFieldProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  strength?: { score: 0 | 1 | 2 | 3 | 4; label: string; tone: "error" | "warning" | "info" | "brand" };
}
const strengthClasses = {
  error: { background: "bg-error", text: "text-error" },
  warning: { background: "bg-warning", text: "text-warning" },
  info: { background: "bg-info", text: "text-info" },
  brand: { background: "bg-brand", text: "text-brand" },
};

export function DhritiPasswordField({ visible, onVisibleChange, strength, ...props }: DhritiPasswordFieldProps) {
  return (
    <TextInput
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          aria-label={visible ? `Hide ${props.label}` : `Show ${props.label}`}
          aria-pressed={visible}
          disabled={props.disabled || props.readOnly}
          className={fieldActionClass}
          onClick={() => onVisibleChange(!visible)}
        >
          {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      }
      details={
        strength && (
          <div
            role="meter"
            aria-label={`${props.label} strength`}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={strength.score}
            aria-valuetext={strength.label}
            className="space-y-1"
          >
            <div className="flex gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${index <= strength.score ? strengthClasses[strength.tone].background : "bg-border"}`}
                />
              ))}
            </div>
            <p className={`text-xs font-medium ${strengthClasses[strength.tone].text}`}>{strength.label}</p>
          </div>
        )
      }
    />
  );
}
