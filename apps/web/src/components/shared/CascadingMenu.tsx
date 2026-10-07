"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ConnectCascadingMenuItem, SubmenuState } from "@/types/menu.types";

type ConnectCascadingMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: ConnectCascadingMenuItem[];
  minWidth?: number;
  heading?: string;
  maxDepth?: number;
};

const MENU_GAP = 4;
const VIEWPORT_GUTTER = 8;

export function ConnectCascadingMenu({
  anchorEl,
  open,
  onClose,
  items,
  minWidth = 220,
  heading,
  maxDepth = 4,
}: ConnectCascadingMenuProps) {
  const [submenuStates, setSubmenuStates] = useState<SubmenuState[]>([]);
  const safeMaxDepth = Math.min(Math.max(maxDepth, 1), 4);

  useEffect(() => {
    if (!open) setSubmenuStates([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;

      if (!target?.closest("[data-connect-cascading-menu]") && !anchorEl?.contains(target)) {
        closeAll();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorEl, open]);

  const itemsByLevel = useMemo(() => {
    const levels: ConnectCascadingMenuItem[][] = [items];

    for (let level = 0; level < submenuStates.length; level += 1) {
      const state = submenuStates[level];
      const parentItem = levels[level]?.find((item) => item.id === state.itemId);

      if (!parentItem?.children?.length) break;

      levels.push(parentItem.children);
    }

    return levels;
  }, [items, submenuStates]);

  function resetSubmenus() {
    setSubmenuStates([]);
  }

  function closeAll() {
    resetSubmenus();
    onClose();
  }

  function closeFromLevel(level: number) {
    if (level === 0) {
      closeAll();
      return;
    }

    setSubmenuStates((previous) => previous.slice(0, level - 1));
  }

  function shouldOpenLeft(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return window.innerWidth - rect.right < minWidth + MENU_GAP + VIEWPORT_GUTTER;
  }

  function openSubmenu(level: number, item: ConnectCascadingMenuItem, itemElement: HTMLElement) {
    setSubmenuStates((previous) => {
      const next = previous.slice(0, level);

      next[level] = {
        itemId: item.id,
        anchorEl: itemElement,
        openLeft: shouldOpenLeft(itemElement),
      };

      return next;
    });
  }

  function handleItemClick(level: number, item: ConnectCascadingMenuItem, event: MouseEvent<HTMLButtonElement>) {
    const itemElement = event.currentTarget;
    const hasChildren = Boolean(item.children?.length) && level < safeMaxDepth - 1;

    if (hasChildren) {
      openSubmenu(level, item, itemElement);
      item.onClick?.(event, item);
      return;
    }

    item.onClick?.(event, item);

    if (item.closeOnClick !== false) closeAll();
  }

  function rootMenuStyle(): CSSProperties {
    const rect = anchorEl?.getBoundingClientRect();
    if (!rect) return { visibility: "hidden" };

    return {
      left: Math.max(VIEWPORT_GUTTER, Math.min(rect.right - minWidth, window.innerWidth - minWidth - VIEWPORT_GUTTER)),
      minWidth,
      top: rect.bottom + MENU_GAP,
    };
  }

  function submenuStyle(state: SubmenuState): CSSProperties {
    const rect = state.anchorEl.getBoundingClientRect();
    const left = state.openLeft ? rect.left - minWidth - MENU_GAP : rect.right + MENU_GAP;

    return {
      left: Math.max(VIEWPORT_GUTTER, Math.min(left, window.innerWidth - minWidth - VIEWPORT_GUTTER)),
      minWidth,
      top: Math.max(VIEWPORT_GUTTER, rect.top),
    };
  }

  if (!open || !anchorEl || typeof document === "undefined") return null;

  return createPortal(
    <>
      <MenuSurface level={0} style={rootMenuStyle()} onEscape={() => closeFromLevel(0)}>
        {heading ? <p className="px-3.5 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{heading}</p> : null}
        <MenuItems items={itemsByLevel[0] ?? []} level={0} />
      </MenuSurface>

      {Array.from({ length: safeMaxDepth - 1 }).map((_, index) => {
        const level = index + 1;
        const submenuState = submenuStates[level - 1];
        const levelItems = itemsByLevel[level] ?? [];

        if (!submenuState || levelItems.length === 0) return null;

        return (
          <MenuSurface key={`cascading-menu-level-${level}`} level={level} style={submenuStyle(submenuState)} onEscape={() => closeFromLevel(level)}>
            <MenuItems items={levelItems} level={level} />
          </MenuSurface>
        );
      })}
    </>,
    document.body,
  );

  function MenuItems({ items: levelItems, level }: { items: ConnectCascadingMenuItem[]; level: number }) {
    return (
      <div className="py-1" role="menu">
        {levelItems.map((item) => {
          const hasChildren = Boolean(item.children?.length) && level < safeMaxDepth - 1;
          const selectedSubmenu = submenuStates[level];

          return (
            <div key={item.id}>
              {item.dividerAbove ? <div className="my-1 border-t border-slate-100" role="separator" /> : null}
              {item.sectionTitle ? <p className="px-3.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{item.sectionTitle}</p> : null}
              <button
                type="button"
                role="menuitem"
                aria-haspopup={hasChildren ? "menu" : undefined}
                aria-expanded={hasChildren ? selectedSubmenu?.itemId === item.id : undefined}
                onClick={(event) => handleItemClick(level, item, event)}
                className="flex w-full items-center gap-2 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
              >
                <span className={`flex w-5 shrink-0 items-center justify-center ${item.selected ? "text-emerald-600" : "text-slate-500"}`}>
                  {item.selected ? <CheckIcon /> : item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${item.danger ? "text-red-600" : "text-slate-900"} ${item.selected ? "font-bold" : "font-medium"}`}>
                    {item.label}
                  </span>
                  {item.description ? <span className="mt-0.5 block text-xs leading-[1.35] text-slate-500">{item.description}</span> : null}
                </span>
                {item.endAdornment ?? (hasChildren ? selectedSubmenu?.openLeft ? <ChevronLeftIcon /> : <ChevronRightIcon /> : null)}
              </button>
            </div>
          );
        })}
      </div>
    );
  }
}

function MenuSurface({ children, level, style, onEscape }: { children: ReactNode; level: number; style: CSSProperties; onEscape: () => void }) {
  return (
    <div
      data-connect-cascading-menu
      role="presentation"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onEscape();
        }
      }}
      className="fixed z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
      style={{ ...style, zIndex: 50 + level }}
    >
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg aria-hidden="true" className="shrink-0 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" className="shrink-0 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}