"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { DhritiTextField } from "./text-fields";
import type { DhritiTextFieldProps } from "./field-primitives";

export interface DhritiSearchFieldProps extends DhritiTextFieldProps {
  onSearch: (value: string) => void;
  debounceMs?: number;
}

/** onChange updates the parent's draft immediately; onSearch emits only after the controlled value settles. */
export function DhritiSearchField({ onSearch, debounceMs = 300, ...props }: DhritiSearchFieldProps) {
  if (!Number.isFinite(debounceMs) || debounceMs < 0)
    throw new RangeError("DhritiSearchField debounceMs must be a non-negative finite number.");
  const callback = useRef(onSearch);
  const emitted = useRef(props.value);
  useEffect(() => {
    callback.current = onSearch;
  }, [onSearch]);
  useEffect(() => {
    if (props.disabled || props.readOnly || props.value === emitted.current) return;
    const timer = window.setTimeout(() => {
      emitted.current = props.value;
      callback.current(props.value);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [props.value, props.disabled, props.readOnly, debounceMs]);
  return (
    <DhritiTextField
      {...props}
      startIcon={props.startIcon ?? <Search className="size-4" aria-hidden="true" />}
      clearable={props.clearable ?? true}
    />
  );
}
