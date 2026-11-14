"use client";

import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode, type RefObject } from "react";
import { Check, CircleAlert, X } from "lucide-react";

export type FieldSize = "sm" | "md" | "lg";
export type FieldVariant = "outlined" | "filled" | "underline";
export interface FieldPresentationProps {
  id?: string;
  label: string;
  showLabel?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  success?: boolean;
  successText?: string;
  helperText?: string;
  size?: FieldSize;
  variant?: FieldVariant;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  clearable?: boolean;
  placeholder?: string;
}

export interface DhritiTextFieldProps extends FieldPresentationProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  onBlur?: InputHTMLAttributes<HTMLInputElement>["onBlur"];
}

export const fieldSizes = {
  sm: { padding: "px-3 py-1.5", vertical: "py-1.5", horizontal: "px-3", text: "text-xs" },
  md: { padding: "px-4 py-2.5", vertical: "py-2.5", horizontal: "px-4", text: "text-sm" },
  lg: { padding: "px-5 py-3.5", vertical: "py-3.5", horizontal: "px-5", text: "text-base" },
} as const;

export const fieldActionClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded text-text-muted transition-colors hover:text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";
export const fieldInputClass =
  "min-w-0 flex-1 bg-transparent text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:text-text-muted";
export const fieldMenuClass =
  "absolute top-full z-50 mt-1.5 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-field-menu";

export function fieldSurface(props: FieldPresentationProps, open = false) {
  const { variant = "outlined", error, success, disabled } = props;
  const border = error
    ? "border-error focus-within:border-error"
    : success
      ? "border-success focus-within:border-success"
      : open
        ? "border-brand"
        : "border-border focus-within:border-brand";
  const shadow = error ? "focus-within:shadow-field-error" : "focus-within:shadow-field-focus";
  return `w-full transition-colors ${border} ${
    variant === "underline"
      ? "rounded-none border-0 border-b-2 bg-transparent"
      : `rounded-md border ${shadow} ${open ? (error ? "shadow-field-error" : "shadow-field-focus") : ""} ${disabled ? "bg-background" : variant === "filled" ? "bg-surface-raised focus-within:bg-surface" : "bg-surface"}`
  }`;
}

export function useFieldIdentity(props: FieldPresentationProps) {
  const generated = useId();
  const id = props.id ?? generated;
  const hasMessage = Boolean(
    props.error || props.helperText || (props.success && (props.successText ?? "Looks good!")),
  );
  return {
    id,
    descriptionId: hasMessage ? `${id}-help` : undefined,
    input: {
      id,
      "aria-label": props.showLabel === false ? props.label : undefined,
      "aria-describedby": hasMessage ? `${id}-help` : undefined,
      "aria-invalid": Boolean(props.error),
      "aria-required": props.required || undefined,
    },
  };
}

export function FieldFrame({
  children,
  details,
  ...props
}: FieldPresentationProps & { children: ReactNode; details?: ReactNode }) {
  const { id, label, showLabel = true, required, error, success, successText = "Looks good!", helperText } = props;
  const message = (error || helperText || (success && successText)) && (
    <p
      id={`${id}-help`}
      role={error ? "alert" : undefined}
      className={`flex items-center gap-1 text-xs ${error ? "text-error" : success ? "text-success" : "text-text-muted"}`}
    >
      {error ? (
        <CircleAlert className="size-3 shrink-0" aria-hidden="true" />
      ) : success ? (
        <Check className="size-3 shrink-0" aria-hidden="true" />
      ) : null}
      {error || (success ? successText : helperText)}
    </p>
  );
  return (
    <div className="min-w-0 space-y-1.5">
      {showLabel && (
        <label htmlFor={id} className="flex items-center gap-1 text-sm font-semibold text-text-secondary">
          {label}
          {required && (
            <span className="text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {/* Errors stay directly below the control, before optional detail indicators. */}
      {error && message}
      {details}
      {!error && message}
    </div>
  );
}

export function ClearFieldButton({
  label,
  onClear,
  disabled,
}: {
  label: string;
  onClear: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={`Clear ${label}`}
      className={fieldActionClass}
      disabled={disabled}
      onClick={onClear}
    >
      <X className="size-3.5" aria-hidden="true" />
    </button>
  );
}

/** Menu state is controlled; dismissal only requests a change from the parent. */
export function useFieldMenu(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  disabled?: boolean,
  readOnly?: boolean,
  popup?: RefObject<HTMLElement | null>,
) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || disabled || readOnly) return;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        root.current &&
        !root.current.contains(event.target) &&
        !popup?.current?.contains(event.target)
      )
        onOpenChange(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, onOpenChange, disabled, readOnly, popup]);
  return root;
}

export function moveMenuFocus(root: RefObject<HTMLDivElement | null>, key: string) {
  const options = Array.from(
    root.current?.querySelectorAll<HTMLButtonElement>("[data-field-option]:not(:disabled)") ?? [],
  );
  if (!options.length) return;
  const index = options.findIndex((option) => option === document.activeElement);
  const next =
    key === "Home"
      ? 0
      : key === "End"
        ? options.length - 1
        : key === "ArrowDown"
          ? (index + 1) % options.length
          : (index - 1 + options.length) % options.length;
  options[next]?.focus();
}

export function DhritiFieldGroup({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-2xl border border-border bg-surface p-6">
      <div className="mb-5">
        <h3 id={id} className="mb-0.5 font-display text-base font-bold text-text-primary">
          {title}
        </h3>
        {description && <p className="text-xs text-text-secondary">{description}</p>}
      </div>
      <div className={wide ? "w-full" : "max-w-sm"}>{children}</div>
    </section>
  );
}
