"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  columns?: 1 | 2 | 3;
  openToLeft?: boolean;
  anchorAlignment?: "end" | "start";
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
  columns = 1,
  openToLeft = false,
  anchorAlignment = "end",
  onMouseEnter,
  onMouseLeave,
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

    const left = openToLeft
      ? rect.left - minWidth - MENU_GAP
      : anchorAlignment === "start"
        ? rect.right + MENU_GAP
        : rect.right - minWidth;

    return {
      left: Math.max(VIEWPORT_GUTTER, Math.min(left, window.innerWidth - minWidth - VIEWPORT_GUTTER)),
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
      <MenuSurface
        level={0}
        style={rootMenuStyle()}
        onEscape={() => closeFromLevel(0)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {heading ? (
          <p className="px-3.5 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{heading}</p>
        ) : null}
        <MenuItems items={itemsByLevel[0] ?? []} level={0} columns={columns} />
      </MenuSurface>

      {Array.from({ length: safeMaxDepth - 1 }).map((_, index) => {
        const level = index + 1;
        const submenuState = submenuStates[level - 1];
        const levelItems = itemsByLevel[level] ?? [];

        if (!submenuState || levelItems.length === 0) return null;

        return (
          <MenuSurface
            key={`cascading-menu-level-${level}`}
            level={level}
            style={submenuStyle(submenuState)}
            onEscape={() => closeFromLevel(level)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <MenuItems items={levelItems} level={level} />
          </MenuSurface>
        );
      })}
    </>,
    document.body,
  );

  function MenuItems({
    items: levelItems,
    level,
    columns = 1,
  }: {
    items: ConnectCascadingMenuItem[];
    level: number;
    columns?: 1 | 2 | 3;
  }) {
    const useSectionGrid = columns > 1 && level === 0;
    const sections = useSectionGrid ? groupMenuItems(levelItems) : [];
    const sectionRows = sections.reduce<Array<typeof sections>>((rows, section, index) => {
      const rowIndex = Math.floor(index / columns);
      (rows[rowIndex] ??= []).push(section);
      return rows;
    }, []);

    if (useSectionGrid) {
      return (
        <div className="py-1" role="menu">
          {sectionRows.map((row, rowIndex) => (
            <div
              key={row[0]?.id ?? rowIndex}
              className={rowIndex > 0 ? "mt-2 border-t border-slate-100 pt-2" : undefined}
            >
              <div className={columns === 3 ? "grid grid-cols-3 gap-x-1" : "grid grid-cols-2 gap-x-1"}>
                {row.map((section) => (
                  <div key={section.id} className="min-w-0">
                    {section.title ? (
                      <p className="px-3.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {section.title}
                      </p>
                    ) : null}
                    {section.items.map(renderMenuItem)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        className={
          columns === 3 ? "grid grid-cols-3 gap-x-1 py-1" : columns === 2 ? "grid grid-cols-2 gap-x-1 py-1" : "py-1"
        }
        role="menu"
      >
        {levelItems.map(renderMenuItem)}
      </div>
    );

    function renderMenuItem(item: ConnectCascadingMenuItem) {
      if (item.content) {
        return <div key={item.id}>{item.content}</div>;
      }

      const hasChildren = Boolean(item.children?.length) && level < safeMaxDepth - 1;
      const selectedSubmenu = submenuStates[level];

      return (
        <div key={item.id} className={columns === 2 ? "contents" : undefined}>
          {!useSectionGrid && item.dividerAbove ? (
            <div
              className={columns === 2 ? "col-span-2 my-1 border-t border-slate-100" : "my-1 border-t border-slate-100"}
              role="separator"
            />
          ) : null}
          {!useSectionGrid && item.sectionTitle ? (
            <p
              className={
                columns === 2
                  ? "col-span-2 px-3.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
                  : "px-3.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
              }
            >
              {item.sectionTitle}
            </p>
          ) : null}
          <button
            type="button"
            role="menuitem"
            aria-haspopup={hasChildren ? "menu" : undefined}
            aria-expanded={hasChildren ? selectedSubmenu?.itemId === item.id : undefined}
            onClick={(event) => handleItemClick(level, item, event)}
            className="flex w-full min-w-0 cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
          >
            <span
              className={`flex shrink-0 items-center justify-center ${item.descriptionLayout === "stacked" ? "h-8 w-8" : "w-5"} ${item.selected ? "text-emerald-600" : "text-slate-500"}`}
            >
              {item.selected ? <CheckIcon /> : item.icon}
            </span>
            <span
              className={`flex min-w-0 flex-1 ${item.descriptionLayout === "stacked" ? "flex-col items-start gap-0.5" : "items-center gap-2"}`}
            >
              <span
                className={`min-w-0 truncate text-sm ${item.danger ? "text-red-600" : "text-slate-900"} ${item.selected ? "font-bold" : "font-medium"}`}
              >
                {item.label}
              </span>
              {item.description ? (
                <span className="min-w-0 truncate text-xs text-slate-500">{item.description}</span>
              ) : null}
            </span>
            {item.endAdornment ??
              (hasChildren ? selectedSubmenu?.openLeft ? <ChevronLeftIcon /> : <ChevronRightIcon /> : null)}
          </button>
        </div>
      );
    }
  }
}

function groupMenuItems(items: ConnectCascadingMenuItem[]) {
  return items.reduce<Array<{ id: string; title?: string; items: ConnectCascadingMenuItem[] }>>((sections, item) => {
    if (item.sectionTitle || sections.length === 0) {
      sections.push({ id: item.sectionTitle ?? item.id, title: item.sectionTitle, items: [] });
    }

    sections.at(-1)?.items.push(item);
    return sections;
  }, []);
}

function MenuSurface({
  children,
  level,
  style,
  onEscape,
  onMouseEnter,
  onMouseLeave,
}: {
  children: ReactNode;
  level: number;
  style: CSSProperties;
  onEscape: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    const requestedTop = typeof style.top === "number" ? style.top : VIEWPORT_GUTTER;

    if (!surface) return;

    const updateTop = () => {
      const maxTop = window.innerHeight - surface.offsetHeight - VIEWPORT_GUTTER;
      setTop(Math.max(VIEWPORT_GUTTER, Math.min(requestedTop, maxTop)));
    };

    updateTop();
    window.addEventListener("resize", updateTop);

    return () => window.removeEventListener("resize", updateTop);
  }, [style.top]);

  return (
    <div
      ref={surfaceRef}
      data-connect-cascading-menu
      role="presentation"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onEscape();
        }
      }}
      className="fixed z-50 max-h-[calc(100vh-16px)] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg"
      style={{ ...style, top: top ?? style.top, zIndex: 50 + level }}
    >
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-slate-400"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-slate-400"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
