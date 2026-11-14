"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { FieldPopover } from "./field-popover";
import {
  ClearFieldButton,
  FieldFrame,
  fieldActionClass,
  fieldSizes,
  fieldSurface,
  useFieldIdentity,
  useFieldMenu,
  type FieldPresentationProps,
} from "./field-primitives";

const subscribe = () => () => {};

export interface FieldPickerProps extends FieldPresentationProps {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name?: string;
}

export function PickerShell({
  displayValue,
  icon,
  children,
  pickerLabel,
  onOpen,
  widthClass,
  ...props
}: FieldPickerProps & {
  displayValue: string;
  icon: ReactNode;
  children: ReactNode;
  pickerLabel: string;
  onOpen?: () => void;
  widthClass: string;
}) {
  const identity = useFieldIdentity(props);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const root = useFieldMenu(props.open, props.onOpenChange, props.disabled, props.readOnly, panel);
  const clientReady = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const blocked = props.disabled || props.readOnly;
  const shown = props.open && !blocked && clientReady;
  useEffect(() => {
    if (shown) {
      const initial =
        panel.current?.querySelector<HTMLButtonElement>("[data-picker-initial]:not(:disabled)") ??
        panel.current?.querySelector<HTMLButtonElement>("[data-picker-option]:not(:disabled)");
      initial?.focus();
    }
  }, [shown]);
  return (
    <FieldFrame {...props} id={identity.id}>
      <div
        ref={root}
        className="relative"
        onKeyDown={(event) => {
          if (event.key === "Escape" && shown) {
            event.preventDefault();
            event.stopPropagation();
            props.onOpenChange(false);
            trigger.current?.focus();
          }
        }}
      >
        {props.name && <input type="hidden" name={props.name} value={props.value} disabled={props.disabled} />}
        <div
          className={`${fieldSurface(props, shown)} flex items-center gap-2 ${fieldSizes[props.size ?? "md"].padding}`}
        >
          <button
            ref={trigger}
            {...identity.input}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={shown}
            aria-controls={shown ? `${identity.id}-picker` : undefined}
            aria-disabled={props.readOnly || undefined}
            disabled={props.disabled}
            onClick={() => {
              if (!blocked) {
                if (!shown) onOpen?.();
                props.onOpenChange(!shown);
              }
            }}
            className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 text-left ${fieldSizes[props.size ?? "md"].text} disabled:cursor-not-allowed`}
          >
            <span className={props.value ? "text-text-primary" : "text-text-muted"}>
              {displayValue || props.placeholder || "\u00a0"}
            </span>
            <span className="shrink-0 text-text-muted">{icon}</span>
          </button>
          {props.clearable && props.value && (
            <ClearFieldButton label={props.label} disabled={blocked} onClear={() => props.onChange("")} />
          )}
        </div>
        {shown && (
          <FieldPopover
            anchor={root}
            panel={panel}
            id={`${identity.id}-picker`}
            role="dialog"
            aria-label={pickerLabel}
            className={widthClass}
            onClick={(event) => {
              if (event.target instanceof Element && event.target.closest("[data-picker-close]"))
                trigger.current?.focus();
            }}
            onBlur={(event) => {
              if (
                event.relatedTarget instanceof Node &&
                !root.current?.contains(event.relatedTarget) &&
                !panel.current?.contains(event.relatedTarget)
              )
                props.onOpenChange(false);
            }}
          >
            {children}
          </FieldPopover>
        )}
      </div>
    </FieldFrame>
  );
}

export const pickerOptionClass = `${fieldActionClass} w-full py-2 text-sm text-text-primary hover:bg-brand-muted hover:text-brand`;
