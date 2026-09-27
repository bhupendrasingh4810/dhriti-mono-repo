"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

type ControlMode = "platform" | "organization";

interface ControlLayoutProps {
  children: ReactNode;
  mode: ControlMode;
}

const NAVIGATION: Record<ControlMode, Array<{ href: string; label: string; enabled: boolean }>> = {
  platform: [
    { href: "platform/dashboard", label: "Overview", enabled: true },
    { href: "platform/orgs", label: "Organizations", enabled: true },
    { href: "platform/subscriptions", label: "Subscriptions", enabled: true },
    { href: "platform/users", label: "Platform Users", enabled: true },
    { href: "platform/feature-flags", label: "Feature Flags", enabled: true },
    { href: "platform/security-center", label: "Security Center", enabled: true },
    { href: "platform/audit-logs", label: "Audit Logs", enabled: true },
    { href: "platform/system-health", label: "System Health", enabled: true },
    { href: "platform/settings", label: "Settings", enabled: true },
  ],
  organization: [
    { href: "org/dashboard", label: "Overview", enabled: true },
    { href: "org/employees", label: "Employees", enabled: true },
    { href: "org/teams", label: "Teams", enabled: true },
    { href: "org/permissions", label: "Roles & Permissions", enabled: true },
    { href: "org/app-access", label: "App Access", enabled: false },
    { href: "org/security", label: "Security", enabled: true },
    { href: "org/integrations", label: "Integrations", enabled: true },
    { href: "org/settings", label: "Settings", enabled: true },
  ],
};

export function ControlLayout({ children, mode }: ControlLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth(); // Assuming you have a useAuth hook to get the current user
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const mainRef = useRef<HTMLElement>(null);
  const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false);
  const navigation = NAVIGATION[mode];
  const basePath = `/${organizationSlug}/control`;
  const activeItem = navigation.find((item) => pathname.endsWith(`/${item.href}`));
  const modeLabel = user?.role === "" && mode === "platform" ? "Platform" : "Organization";

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const updateScrollbarState = () => {
      setHasVerticalScrollbar(main.scrollHeight > main.clientHeight);
    };

    updateScrollbarState();
    const resizeObserver = new ResizeObserver(updateScrollbarState);
    resizeObserver.observe(main);

    return () => resizeObserver.disconnect();
  }, [children]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-slate-50 p-4">
      <aside
        className="mr-2 flex min-h-0 w-60 shrink-0 flex-col border-r border-slate-200 bg-white"
        style={{ borderRadius: "12px" }}
      >
        <div className="border-b border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">Control Panel</p>
          <p className="mt-1 text-xs text-slate-500">{modeLabel} administration</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label={`${modeLabel} control navigation`}>
          <p className="px-2 py-2 text-xs font-semibold uppercase text-slate-400">{modeLabel}</p>
          {navigation.map((item) => {
            const href = `${basePath}/${item.href}`;
            const isActive = pathname === href;
            if (!item.enabled) return null;
            return (
              <Link
                key={item.href}
                href={href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  !item.enabled
                    ? "text-slate-400 cursor-not-allowed"
                    : isActive
                      ? "bg-emerald-50 font-semibold text-emerald-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                aria-disabled={!item.enabled}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="ml-2 flex min-h-0 min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-6 text-sm text-slate-500"
          style={{ borderRadius: "12px" }}
        >
          <span>Admin</span>
          <span className="mx-2 text-slate-300">/</span>
          <span>{modeLabel}</span>
          {activeItem ? (
            <>
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{activeItem.label}</span>
            </>
          ) : null}
        </header>
        <main
          ref={mainRef}
          className={`-mr-4 mt-4 flex-1 overflow-y-auto pb-3 pl-0 pt-3 ${hasVerticalScrollbar ? "pr-2" : "pr-4"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
