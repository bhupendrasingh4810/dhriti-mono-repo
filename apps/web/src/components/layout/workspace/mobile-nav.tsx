"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { useMobileNav } from "@/contexts/mobile-nav-context";
import { useAuth } from "@/hooks/use-auth";
import type { AppView } from "@/types/app.types";
import { NAV_ITEMS, getNavHref } from "./sidebar";

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onClose]);
}

/** Apps grid dialog and the left drawer that hosts the current page's sidebar (tablet/mobile only). */
export function MobileNavOverlays({ activeView, organizationSlug }: { activeView: AppView; organizationSlug: string }) {
  const { appsOpen, menuOpen, setAppsOpen, setMenuOpen, setDrawerEl } = useMobileNav();
  const { user } = useAuth();
  const closeApps = () => setAppsOpen(false);
  const closeMenu = () => setMenuOpen(false);
  const appsCloseRef = useRef<HTMLButtonElement>(null);

  useEscape(appsOpen, closeApps);
  useEscape(menuOpen, closeMenu);
  useEffect(() => {
    if (appsOpen) appsCloseRef.current?.focus();
  }, [appsOpen]);

  return (
    <div className="lg:hidden">
      {appsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close apps"
            onClick={closeApps}
            className="absolute inset-0 cursor-pointer bg-text-primary/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Apps"
            className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-text-primary">Apps</h2>
              <button
                ref={appsCloseRef}
                type="button"
                aria-label="Close apps"
                onClick={closeApps}
                className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised hover:text-text-primary"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {NAV_ITEMS.map((item) => {
                const active = item.id === activeView;
                return (
                  <Link
                    key={item.id}
                    href={getNavHref(item, organizationSlug, user?.isPlatformUser)}
                    onClick={closeApps}
                    aria-current={active ? "page" : undefined}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold ${
                      active ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-raised"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-50 ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close menu"
          onClick={closeMenu}
          className={`absolute inset-0 cursor-pointer bg-text-primary/40 transition-opacity duration-200 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Page menu"
          inert={!menuOpen}
          className={`absolute inset-y-0 left-0 flex w-[min(320px,85vw)] flex-col bg-surface shadow-xl transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Page sidebars are portaled here; force their desktop-only styles off inside the drawer. */}
          <div
            ref={setDrawerEl}
            onClick={(event) => {
              // Selecting an item closes the drawer; expanders and menu/create triggers keep it open.
              const selectable =
                'a[href], button:not([aria-haspopup]):not([aria-expanded]):not([aria-label^="Create"]):not([aria-label*="menu" i])';
              if ((event.target as HTMLElement).closest(selectable)) closeMenu();
            }}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto [&>aside.hidden]:flex! [&>aside]:static! [&>aside]:h-full! [&>aside]:w-full! [&>aside]:max-w-none! [&>aside]:flex-1! [&>aside]:rounded-none! [&>aside]:border-0! [&>aside]:m-0!"
          />
        </div>
      </div>
    </div>
  );
}
