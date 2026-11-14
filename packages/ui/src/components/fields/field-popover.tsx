"use client";

import { useEffect, useSyncExternalStore, type HTMLAttributes, type RefObject } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/** Keep native-dialog menus in its top layer; body portals become inert outside showModal(). */
export function FieldPopover({
  anchor,
  panel,
  matchWidth = false,
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  anchor: RefObject<HTMLDivElement | null>;
  panel: RefObject<HTMLDivElement | null>;
  matchWidth?: boolean;
}) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  useEffect(() => {
    if (!ready) return;
    const position = () => {
      const control = anchor.current,
        popup = panel.current;
      if (!control || !popup) return;
      const styles = getComputedStyle(popup);
      const gutter = Number.parseFloat(styles.getPropertyValue("--field-picker-gutter"));
      const gap = Number.parseFloat(styles.getPropertyValue("--field-picker-gap"));
      const rect = control.getBoundingClientRect();
      if (matchWidth) popup.style.width = `${rect.width}px`;
      popup.style.maxHeight = `${Math.max(0, window.innerHeight - gutter * 2)}px`;
      const bounds = popup.getBoundingClientRect();
      const belowSpace = Math.max(0, window.innerHeight - gutter - rect.bottom - gap);
      const aboveSpace = Math.max(0, rect.top - gutter - gap);
      const above = bounds.height > belowSpace && aboveSpace > belowSpace;
      const available = above ? aboveSpace : belowSpace;
      popup.style.maxHeight = `${available}px`;
      const height = Math.min(bounds.height, available);
      popup.style.top = `${Math.max(gutter, above ? rect.top - gap - height : rect.bottom + gap)}px`;
      popup.style.left = `${Math.max(gutter, Math.min(rect.left, window.innerWidth - gutter - bounds.width))}px`;
      popup.style.visibility = "visible";
    };
    position();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(position);
    if (anchor.current) observer?.observe(anchor.current);
    if (panel.current) observer?.observe(panel.current);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [ready, anchor, panel, matchWidth]);
  return ready
    ? createPortal(
        <div
          {...props}
          ref={panel}
          style={{ visibility: "hidden", maxWidth: "calc(100vw - var(--field-picker-gutter) * 2)", ...props.style }}
          className={`fixed z-50 overflow-y-auto rounded-2xl border border-border bg-surface shadow-field-menu ${className}`}
        >
          {children}
        </div>,
        anchor.current?.closest("dialog") ?? document.body,
      )
    : null;
}
