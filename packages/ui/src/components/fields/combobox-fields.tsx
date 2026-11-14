"use client";

import { useRef, type ReactNode } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import {
  ClearFieldButton,
  FieldFrame,
  fieldActionClass,
  fieldInputClass,
  fieldSurface,
  moveMenuFocus,
  useFieldIdentity,
  useFieldMenu,
  type FieldPresentationProps,
} from "./field-primitives";
import { FieldPopover } from "./field-popover";
import type { FieldOption } from "./select-fields";

export interface FieldOptionGroup {
  value: string;
  label: string;
  options: readonly FieldOption[];
}
export interface DhritiComboboxProps extends FieldPresentationProps {
  value: readonly string[];
  onChange: (value: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emptyText?: string;
}
export interface DhritiComboboxFlatProps extends DhritiComboboxProps {
  options: readonly FieldOption[];
  search: string;
  onSearchChange: (search: string) => void;
}
export interface DhritiComboboxGroupedProps extends DhritiComboboxProps {
  groups: readonly FieldOptionGroup[];
}
export interface DhritiComboboxHierarchyProps extends DhritiComboboxGroupedProps {
  expanded: readonly string[];
  onExpandedChange: (expanded: string[]) => void;
}

function toggle(values: readonly string[], value: string) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

function CheckboxMark({ checked, mixed = false }: { checked: boolean; mixed?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked ? "border-brand bg-brand text-text-inverse" : mixed ? "border-brand bg-brand-muted text-brand" : "border-border-strong bg-surface"}`}
    >
      {checked ? <Check className="size-2.5" /> : mixed ? <Minus className="size-2.5" /> : null}
    </span>
  );
}

function Avatar({ option, small = false }: { option: FieldOption; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-text-inverse ${small ? "size-4 text-field-caption" : "size-7 text-xs"}`}
    >
      {option.icon ?? option.label.charAt(0)}
    </span>
  );
}

function Choice({
  option,
  selected,
  onSelect,
  grouped = false,
}: {
  option: FieldOption;
  selected: boolean;
  onSelect: () => void;
  grouped?: boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      data-field-option
      aria-selected={selected}
      disabled={option.disabled}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "bg-brand-muted" : ""}`}
      onClick={onSelect}
    >
      <CheckboxMark checked={selected} />
      {grouped ? <Avatar option={option} /> : option.icon && <span className="text-sm">{option.icon}</span>}
      <span className="min-w-0">
        <span className="block break-words text-sm font-medium text-text-primary">{option.label}</span>
        {option.description && <span className="block truncate text-xs text-text-muted">{option.description}</span>}
      </span>
    </button>
  );
}

function ComboboxShell({
  options,
  children,
  search,
  onSearchChange,
  roundChips = false,
  hierarchy = false,
  ...props
}: DhritiComboboxProps & {
  options: readonly FieldOption[];
  children: ReactNode;
  search?: string;
  onSearchChange?: (search: string) => void;
  roundChips?: boolean;
  hierarchy?: boolean;
}) {
  const identity = useFieldIdentity(props);
  const panel = useRef<HTMLDivElement>(null);
  const root = useFieldMenu(props.open, props.onOpenChange, props.disabled, props.readOnly, panel);
  const input = useRef<HTMLInputElement>(null);
  const blocked = props.disabled || props.readOnly;
  const controls = `${identity.id}-options`;
  const selected = props.value.map(
    (value) => options.find((option) => option.value === value) ?? { value, label: value },
  );
  return (
    <FieldFrame {...props} id={identity.id} labelActivatesControl={false}>
      <div
        ref={root}
        className="relative"
        onKeyDown={(event) => {
          if (event.key === "Escape" && props.open) {
            event.preventDefault();
            props.onOpenChange(false);
            input.current?.focus();
          } else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            if (!props.open && !blocked) props.onOpenChange(true);
            else moveMenuFocus(panel, event.key);
          }
        }}
      >
        <div
          className={`${fieldSurface(props, props.open && !blocked)} flex min-h-field-control flex-wrap items-center gap-1.5 px-3 py-1.5`}
          onClick={() => {
            if (!blocked) {
              props.onOpenChange(true);
              input.current?.focus();
            }
          }}
        >
          {props.startIcon && !selected.length && <span className="text-text-muted">{props.startIcon}</span>}
          {selected.map((option) => (
            <span
              key={option.value}
              className={`flex max-w-full items-center gap-1 bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand ${roundChips ? "rounded-full" : "rounded-md"}`}
            >
              {roundChips ? <Avatar option={option} small /> : option.icon}
              <span className="min-w-0 break-words">{option.label}</span>
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                disabled={blocked || option.disabled}
                className={`${fieldActionClass} ml-0.5 hover:text-error`}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onChange(toggle(props.value, option.value));
                }}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <input
            ref={input}
            {...identity.input}
            role="combobox"
            aria-autocomplete={onSearchChange ? "list" : "none"}
            aria-haspopup={hierarchy ? "tree" : "listbox"}
            aria-expanded={props.open && !blocked}
            aria-controls={props.open && !blocked ? controls : undefined}
            value={search ?? ""}
            readOnly={!onSearchChange || props.readOnly}
            disabled={props.disabled}
            onChange={(event) => {
              if (!blocked) onSearchChange?.(event.target.value);
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (!blocked) props.onOpenChange(true);
            }}
            placeholder={!selected.length ? props.placeholder : undefined}
            className={`${fieldInputClass} ${onSearchChange ? "min-w-field-search" : "w-0"} text-sm`}
          />
          {props.clearable && props.value.length > 0 && (
            <span onClick={(event) => event.stopPropagation()}>
              <ClearFieldButton
                label={props.label}
                disabled={blocked}
                onClear={() =>
                  props.onChange(
                    props.value.filter((value) => options.find((option) => option.value === value)?.disabled),
                  )
                }
              />
            </span>
          )}
          {!hierarchy && !onSearchChange && (
            <ChevronDown
              className={`size-3.5 text-text-muted transition-transform ${props.open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          )}
        </div>
        {props.open && !blocked && (
          <FieldPopover anchor={root} panel={panel} matchWidth>
            <div
              id={controls}
              role={hierarchy ? "tree" : "listbox"}
              aria-label={props.label}
              aria-multiselectable="true"
              className="max-h-72 overflow-y-auto p-1.5"
            >
              {children}
            </div>
            {!hierarchy && onSearchChange && props.value.length > 0 && (
              <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-text-muted">
                <span>{props.value.length} selected</span>
                <button
                  type="button"
                  className={fieldActionClass}
                  onClick={() =>
                    props.onChange(
                      props.value.filter((value) => options.find((option) => option.value === value)?.disabled),
                    )
                  }
                >
                  Clear all
                </button>
              </div>
            )}
          </FieldPopover>
        )}
      </div>
    </FieldFrame>
  );
}

export function DhritiComboboxFlat({ options, search, onSearchChange, ...props }: DhritiComboboxFlatProps) {
  const filtered = options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));
  return (
    <ComboboxShell {...props} options={options} search={search} onSearchChange={onSearchChange}>
      {!filtered.length && (
        <p className="py-4 text-center text-xs text-text-muted">{props.emptyText ?? "No options found"}</p>
      )}
      {filtered.map((option) => (
        <Choice
          key={option.value}
          option={option}
          selected={props.value.includes(option.value)}
          onSelect={() => props.onChange(toggle(props.value, option.value))}
        />
      ))}
    </ComboboxShell>
  );
}

export function DhritiComboboxGrouped({ groups, ...props }: DhritiComboboxGroupedProps) {
  const options = groups.flatMap((group) => group.options);
  return (
    <ComboboxShell {...props} options={options} roundChips>
      {!options.length && (
        <p className="py-4 text-center text-xs text-text-muted">{props.emptyText ?? "No options found"}</p>
      )}
      {groups.map((group) => (
        <div key={group.value} role="group" aria-label={group.label}>
          <p className="px-3 pb-1 pt-2 text-field-caption font-bold uppercase tracking-widest text-text-muted">
            {group.label}
          </p>
          {group.options.map((option) => (
            <Choice
              key={option.value}
              option={option}
              grouped
              selected={props.value.includes(option.value)}
              onSelect={() => props.onChange(toggle(props.value, option.value))}
            />
          ))}
        </div>
      ))}
    </ComboboxShell>
  );
}

export function DhritiComboboxHierarchy({
  groups,
  expanded,
  onExpandedChange,
  ...props
}: DhritiComboboxHierarchyProps) {
  const options = groups.flatMap((group) => group.options);
  return (
    <ComboboxShell {...props} options={options} hierarchy>
      {!options.length && (
        <p className="py-4 text-center text-xs text-text-muted">{props.emptyText ?? "No options found"}</p>
      )}
      {groups.map((group) => {
        const eligible = group.options.filter((option) => !option.disabled);
        const all = eligible.length > 0 && eligible.every((option) => props.value.includes(option.value));
        const some = group.options.some((option) => props.value.includes(option.value));
        const isExpanded = expanded.includes(group.value);
        return (
          <div
            key={group.value}
            role="treeitem"
            aria-label={group.label}
            aria-expanded={isExpanded}
            aria-selected={all}
            aria-checked={all ? true : some ? "mixed" : false}
          >
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-background">
              <button
                type="button"
                data-field-option
                aria-label={`Select all ${group.label}`}
                aria-pressed={all ? true : some ? "mixed" : false}
                disabled={!eligible.length}
                className={fieldActionClass}
                onClick={() => {
                  const values = eligible.map((option) => option.value);
                  props.onChange(
                    all
                      ? props.value.filter((value) => !values.includes(value))
                      : [...new Set([...props.value, ...values])],
                  );
                }}
              >
                <CheckboxMark checked={all} mixed={some && !all} />
              </button>
              <button
                type="button"
                data-field-option
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${group.label}`}
                aria-expanded={isExpanded}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                onClick={() => onExpandedChange(toggle(expanded, group.value))}
              >
                <span className="min-w-0 flex-1 break-words text-sm font-semibold text-text-secondary">
                  {group.label}
                </span>
                <span className="text-xs text-text-muted">{group.options.length}</span>
                <ChevronDown
                  className={`size-3 shrink-0 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>
            {isExpanded && (
              <div role="group">
                {group.options.map((option) => (
                  <div
                    key={option.value}
                    role="treeitem"
                    aria-label={option.label}
                    aria-selected={props.value.includes(option.value)}
                    aria-checked={props.value.includes(option.value)}
                  >
                    <button
                      type="button"
                      data-field-option
                      disabled={option.disabled}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl py-2 pl-8 pr-3 text-left hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => props.onChange(toggle(props.value, option.value))}
                    >
                      <CheckboxMark checked={props.value.includes(option.value)} />
                      <span className="break-words text-sm text-text-secondary">{option.label}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </ComboboxShell>
  );
}
