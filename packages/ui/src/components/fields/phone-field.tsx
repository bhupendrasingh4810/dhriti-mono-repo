"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  ClearFieldButton,
  FieldFrame,
  fieldInputClass,
  fieldMenuClass,
  fieldSizes,
  fieldSurface,
  moveMenuFocus,
  useFieldIdentity,
  useFieldMenu,
  type DhritiTextFieldProps,
} from "./field-primitives";
import type { CountryOption } from "./select-fields";

export interface DhritiPhoneFieldProps extends DhritiTextFieldProps {
  countries: readonly CountryOption[];
  countryCode: string | null;
  onCountryCodeChange: (code: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (search: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function DhritiPhoneField({
  countries,
  countryCode,
  onCountryCodeChange,
  open,
  onOpenChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search countries...",
  emptyText = "No countries found",
  ...props
}: DhritiPhoneFieldProps) {
  const identity = useFieldIdentity(props);
  const size = fieldSizes[props.size ?? "md"];
  const root = useFieldMenu(open, onOpenChange, props.disabled, props.readOnly);
  const country = countries.find((entry) => entry.code === countryCode);
  const blocked = props.disabled || props.readOnly;
  const filtered = countries.filter((entry) =>
    `${entry.name} ${entry.code} ${entry.dialCode}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <FieldFrame {...props} id={identity.id}>
      <div
        ref={root}
        className="relative"
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            onOpenChange(false);
            root.current?.querySelector<HTMLButtonElement>("[data-country-trigger]")?.focus();
          } else if (
            ["ArrowDown", "ArrowUp"].includes(event.key) &&
            (open || (event.target instanceof HTMLElement && event.target.hasAttribute("data-country-trigger")))
          ) {
            event.preventDefault();
            if (!open && !blocked) onOpenChange(true);
            else moveMenuFocus(root, event.key);
          }
        }}
      >
        <div className={`${fieldSurface(props, open && !blocked)} flex items-center`}>
          <button
            type="button"
            data-country-trigger
            aria-label={`Country code for ${props.label}`}
            aria-haspopup="listbox"
            aria-expanded={open && !blocked}
            aria-controls={open && !blocked ? `${identity.id}-countries` : undefined}
            disabled={blocked}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-l-md border-r border-border ${size.padding} text-text-secondary transition-colors hover:bg-background disabled:cursor-not-allowed`}
            onClick={() => onOpenChange(!open)}
          >
            {country?.flag && <span className="text-base">{country.flag}</span>}
            <span className={`${size.text} font-medium`}>{country?.dialCode ?? "Code"}</span>
            <ChevronDown className="size-3" aria-hidden="true" />
          </button>
          <input
            {...identity.input}
            type="tel"
            name={props.name}
            autoComplete={props.autoComplete}
            value={props.value}
            required={props.required}
            onChange={(event) => {
              if (!blocked) props.onChange(event.target.value);
            }}
            onBlur={props.onBlur}
            maxLength={props.maxLength}
            disabled={props.disabled}
            readOnly={props.readOnly}
            placeholder={props.placeholder}
            className={`${fieldInputClass} ${size.text} ${size.vertical} px-3`}
          />
          {props.clearable && props.value && (
            <span className="pr-3">
              <ClearFieldButton label={props.label} disabled={blocked} onClear={() => props.onChange("")} />
            </span>
          )}
        </div>
        {open && !blocked && (
          <div className={`${fieldMenuClass} max-w-full`} style={{ width: "var(--field-country-menu-width)" }}>
            <div className="border-b border-border p-2">
              <input
                type="search"
                aria-label={`Search country code for ${props.label}`}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className={`w-full rounded-lg bg-background px-3 py-2 text-sm ${fieldInputClass}`}
              />
            </div>
            <div
              id={`${identity.id}-countries`}
              role="listbox"
              aria-label="Calling countries"
              className="max-h-52 overflow-y-auto"
            >
              {!filtered.length && <p className="py-4 text-center text-xs text-text-muted">{emptyText}</p>}
              {filtered.map((entry) => (
                <button
                  key={entry.code}
                  type="button"
                  data-field-option
                  role="option"
                  aria-selected={countryCode === entry.code}
                  disabled={entry.disabled}
                  className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm text-text-primary hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    onCountryCodeChange(entry.code);
                    onOpenChange(false);
                    root.current?.querySelector<HTMLButtonElement>("[data-country-trigger]")?.focus();
                  }}
                >
                  <span className="text-lg">{entry.flag}</span>
                  <span className="min-w-0 flex-1 break-words">{entry.name}</span>
                  <span className="text-xs text-text-muted">{entry.dialCode}</span>
                  {countryCode === entry.code && <Check className="size-3.5 text-brand" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldFrame>
  );
}
