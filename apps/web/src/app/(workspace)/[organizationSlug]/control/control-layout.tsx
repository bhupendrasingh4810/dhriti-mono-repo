"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  Cable,
  ChartNoAxesColumnIncreasing,
  KeyRound,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  Tag,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useParams, usePathname } from "next/navigation";

type ControlMode = "platform" | "organization";

interface ControlLayoutProps {
  children: ReactNode;
  mode: ControlMode;
}

type ControlNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
};

const NAVIGATION: Record<ControlMode, ControlNavigationItem[]> = {
  platform: [
    { href: "platform/audit-logs", label: "Audit Logs", icon: ScrollText, enabled: true },
    { href: "platform/entitlements", label: "Entitlements", icon: KeyRound, enabled: true },
    { href: "platform/orgs", label: "Organizations", icon: Building2, enabled: true },
    { href: "platform/dashboard", label: "Overview", icon: LayoutDashboard, enabled: true },
    { href: "platform/plans", label: "Plans", icon: Tag, enabled: true },
    { href: "platform/roles", label: "Roles & Permissions", icon: KeyRound, enabled: true },
    { href: "platform/users", label: "Platform Workforce", icon: Users, enabled: true },
    { href: "platform/security-center", label: "Security Center", icon: ShieldCheck, enabled: true },
    { href: "platform/settings", label: "Settings", icon: Settings, enabled: true },
    { href: "platform/subscriptions", label: "Subscriptions", icon: ReceiptText, enabled: true },
    { href: "platform/system-health", label: "System Health", icon: Activity, enabled: true },
  ],
  organization: [
    { href: "org/app-access", label: "App Access", icon: ChartNoAxesColumnIncreasing, enabled: false },
    { href: "org/employees", label: "Workforce", icon: Users, enabled: true },
    { href: "org/integrations", label: "Integrations", icon: Cable, enabled: true },
    { href: "org/dashboard", label: "Overview", icon: LayoutDashboard, enabled: true },
    { href: "org/permissions", label: "Roles & Permissions", icon: KeyRound, enabled: true },
    { href: "org/security", label: "Security", icon: ShieldCheck, enabled: true },
    { href: "org/settings", label: "Settings", icon: Settings, enabled: true },
    { href: "org/teams", label: "Teams", icon: UsersRound, enabled: true },
  ],
};

export function ControlLayout({ children, mode }: ControlLayoutProps) {
  const pathname = usePathname();
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const mainRef = useRef<HTMLElement>(null);
  const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false);
  const navigation = NAVIGATION[mode];
  const basePath = `/${organizationSlug}/control`;
  const activeItem = navigation.find((item) => pathname.endsWith(`/${item.href}`));
  const modeLabel = mode === "platform" ? "Platform" : "Organization";

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
      <aside className="mr-2 flex min-h-0 w-[312px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-brand">
        <div className="border-b border-on-brand-border p-4">
          <p className="text-sm font-bold text-text-inverse">Control Panel</p>
          <p className="mt-1 text-xs text-on-brand-muted">{modeLabel} administration</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4" aria-label={`${modeLabel} control navigation`}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-on-brand-muted">{modeLabel}</p>
          {navigation.map((item) => {
            const href = `${basePath}/${item.href}`;
            const isActive = pathname === href;
            const Icon = item.icon;
            if (!item.enabled) return null;
            return (
              <Link
                key={item.href}
                href={href}
                className={`mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-on-brand-border text-text-inverse"
                    : "text-on-brand-muted hover:bg-on-brand-hover hover:text-text-inverse"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={1.75} />
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
          className={`-mr-4 mt-4 flex-1 overflow-y-auto pb-0 pl-0 pt-3 ${hasVerticalScrollbar ? "pr-2" : "pr-4"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
