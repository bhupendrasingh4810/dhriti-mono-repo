"use client";

import { useRef, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  ClearFieldButton,
  FieldFrame,
  fieldInputClass,
  fieldSizes,
  fieldSurface,
  moveMenuFocus,
  useFieldIdentity,
  useFieldMenu,
  type FieldPresentationProps,
} from "./field-primitives";
import { FieldPopover } from "./field-popover";

export interface FieldOption {
  value: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
}
export interface DhritiSelectFieldProps extends FieldPresentationProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: readonly FieldOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function DhritiSelectMenu({
  options,
  value,
  onChange,
  open,
  onOpenChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search options...",
  emptyText = "No options found",
  ...props
}: DhritiSelectFieldProps) {
  const identity = useFieldIdentity(props);
  const size = fieldSizes[props.size ?? "md"];
  const blocked = props.disabled || props.readOnly;
  const panel = useRef<HTMLDivElement>(null);
  const root = useFieldMenu(open, onOpenChange, props.disabled, props.readOnly, panel);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);
  const filtered =
    search === undefined
      ? options
      : options.filter((option) =>
          `${option.label} ${option.description ?? ""}`.toLowerCase().includes(search.toLowerCase()),
        );
  return (
    <FieldFrame {...props} id={identity.id} labelActivatesControl={false}>
      <div
        ref={root}
        className="relative"
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            onOpenChange(false);
            trigger.current?.focus();
          } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (!open && !blocked) onOpenChange(true);
            else moveMenuFocus(panel, event.key);
          }
        }}
      >
        <div
          className={`${fieldSurface(props, open && !blocked)} flex cursor-pointer items-center gap-2 ${size.padding}`}
          onClick={(event) => {
            if (!blocked && event.target instanceof Element && !event.target.closest("button"))
              trigger.current?.click();
          }}
        >
          <button
            ref={trigger}
            {...identity.input}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open && !blocked}
            aria-controls={open && !blocked ? `${identity.id}-options` : undefined}
            aria-disabled={props.readOnly || undefined}
            disabled={props.disabled}
            onClick={() => {
              if (!blocked) onOpenChange(!open);
            }}
            className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left disabled:cursor-not-allowed ${size.text}`}
          >
            {props.startIcon && <span className="shrink-0 text-text-muted">{props.startIcon}</span>}
            {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
            <span className={`min-w-0 flex-1 break-words ${value !== null ? "text-text-primary" : "text-text-muted"}`}>
              {selected?.label ?? value ?? props.placeholder ?? "\u00a0"}
            </span>
            <ChevronDown
              className={`size-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
          {props.clearable && value !== null && (
            <ClearFieldButton label={props.label} disabled={blocked} onClear={() => onChange(null)} />
          )}
        </div>
        {open && !blocked && (
          <FieldPopover anchor={root} panel={panel} matchWidth>
            {onSearchChange && (
              <div className="border-b border-border p-2">
                <input
                  type="search"
                  aria-label={`Search ${props.label}`}
                  placeholder={searchPlaceholder}
                  value={search ?? ""}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className={`w-full rounded-lg bg-background px-3 py-2 text-sm ${fieldInputClass}`}
                />
              </div>
            )}
            <div
              id={`${identity.id}-options`}
              role="listbox"
              aria-label={props.label}
              className="max-h-56 overflow-y-auto p-1.5"
            >
              {!filtered.length && <p className="py-4 text-center text-xs text-text-muted">{emptyText}</p>}
              {filtered.map((option) => (
                <button
                  data-field-option
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  disabled={option.disabled}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${value === option.value ? "bg-brand-muted text-brand" : "text-text-primary hover:bg-background"}`}
                  onClick={() => {
                    onChange(option.value);
                    onOpenChange(false);
                    trigger.current?.focus();
                  }}
                >
                  {option.icon}
                  <span className="min-w-0 flex-1 break-words font-medium">{option.label}</span>
                  {option.description && <span className="shrink-0 text-xs text-text-muted">{option.description}</span>}
                  {value === option.value && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </FieldPopover>
        )}
      </div>
    </FieldFrame>
  );
}

export interface CountryOption {
  code: string;
  name: string;
  flag?: ReactNode;
  dialCode: string;
  disabled?: boolean;
}
export interface DhritiCountryFieldProps extends Omit<DhritiSelectFieldProps, "options"> {
  countries: readonly CountryOption[];
}
export function DhritiCountryField({ countries, ...props }: DhritiCountryFieldProps) {
  return (
    <DhritiSelectMenu
      {...props}
      options={countries.map((country) => ({
        value: country.code,
        label: country.name,
        icon: country.flag,
        disabled: country.disabled,
      }))}
    />
  );
}
