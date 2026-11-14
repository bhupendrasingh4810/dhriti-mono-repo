"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  useLayoutEffect(() => {
    if (!shown) return;
    const position = () => {
      const anchor = root.current,
        popup = panel.current;
      if (!anchor || !popup) return;
      const styles = getComputedStyle(popup);
      const gutter = Number.parseFloat(styles.getPropertyValue("--field-picker-gutter"));
      const gap = Number.parseFloat(styles.getPropertyValue("--field-picker-gap"));
      // Popovers live above scroll containers; geometry is transient, never selected-field state.
      const rect = anchor.getBoundingClientRect();
      popup.style.maxHeight = `${Math.max(0, window.innerHeight - gutter * 2)}px`;
      const bounds = popup.getBoundingClientRect();
      const below = rect.bottom + gap;
      const top =
        below + bounds.height <= window.innerHeight - gutter ? below : Math.max(gutter, rect.top - gap - bounds.height);
      popup.style.top = `${top}px`;
      popup.style.left = `${Math.max(gutter, Math.min(rect.left, window.innerWidth - gutter - bounds.width))}px`;
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [shown, widthClass, root]);
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
        {shown &&
          createPortal(
            <div
              ref={panel}
              id={`${identity.id}-picker`}
              role="dialog"
              aria-label={pickerLabel}
              style={{ maxWidth: "calc(100vw - var(--field-picker-gutter) * 2)" }}
              className={`fixed z-50 overflow-y-auto rounded-2xl border border-border bg-surface shadow-field-menu ${widthClass}`}
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
            </div>,
            document.body,
          )}
      </div>
    </FieldFrame>
  );
}

export const pickerOptionClass = `${fieldActionClass} w-full py-2 text-sm text-text-primary hover:bg-brand-muted hover:text-brand`;
