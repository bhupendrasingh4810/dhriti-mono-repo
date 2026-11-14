"use client";

import React from "react";
import { CalendarDays, FileText, LayoutDashboard, ListChecks, MessageCircle, NotebookPen, Shield, Star, UsersRound } from "lucide-react";
import Link from "next/link";
import type { AppView } from "@/types/app.types";
import { useAuth } from "@/hooks/use-auth";
import { useAppEntitlements } from "@/hooks/use-app-entitlements";
export interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  entitlement?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "home",
    icon: <LayoutDashboard size={22} strokeWidth={1.75} />,
  },
  {
    id: "notes",
    entitlement: "notes.enabled",
    label: "Notes",
    href: "notes",
    icon: <NotebookPen size={22} strokeWidth={1.75} />,
  },
  {
    id: "connect",
    entitlement: "connect.enabled",
    label: "Connect",
    href: "connect",
    badge: 3,
    icon: <MessageCircle size={22} strokeWidth={1.75} />,
  },
  {
    id: "pulse",
    entitlement: "pulse.enabled",
    label: "Pulse",
    href: "pulse",
    icon: <CalendarDays size={22} strokeWidth={1.75} />,
  },
  {
    id: "flow",
    entitlement: "flow.enabled",
    label: "Flow",
    href: "flow/dashboard",
    badge: 12,
    icon: <ListChecks size={22} strokeWidth={1.75} />,
  },
  {
    id: "atlas",
    entitlement: "atlas.enabled",
    label: "Atlas",
    href: "atlas",
    icon: <FileText size={22} strokeWidth={1.75} />,
  },
  {
    id: "cadence",
    entitlement: "cadence.enabled",
    label: "Cadence",
    href: "cadence",
    icon: <Star size={22} strokeWidth={1.75} />,
  },
  {
    id: "hrms",
    entitlement: "hrms.enabled",
    label: "HRMS",
    href: "hrms",
    icon: <UsersRound size={22} strokeWidth={1.75} />,
  },
  {
    id: "control",
    entitlement: "control.enabled",
    label: "Control",
    href: "control",
    icon: <Shield size={22} strokeWidth={1.75} />,
  },
];

export function useVisibleNavItems() {
  const { isEnabled, error, isOrganizationAdministrator } = useAppEntitlements();
  return {
    items: NAV_ITEMS.filter((item) =>
      (!item.entitlement || isEnabled(item.entitlement)) &&
      (item.id !== "control" || isOrganizationAdministrator),
    ),
    error,
  };
}

export function getNavHref(item: NavItem, organizationSlug: string, isPlatformUser?: boolean) {
  if (item.id === "control") {
    return `/${organizationSlug}/${item.id}/${isPlatformUser ? "platform" : "org"}/dashboard`;
  }
  return `/${organizationSlug}/${item.href}`;
}

interface SidebarProps {
  activeView: AppView;
  organizationSlug: string;
}

export default function Sidebar({ activeView, organizationSlug }: SidebarProps) {
  const { user } = useAuth();
  const { items, error } = useVisibleNavItems();

  return (
    <aside className="hidden lg:flex flex-col h-full flex-shrink-0 border-r border-slate-100 bg-white" style={{ width: "72px" }}>
      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-3 overflow-y-auto">
        {error && <p role="alert" title={error} className="px-1 text-center text-xs text-error">App access unavailable</p>}
        {items.map((item) => {
          const active = activeView === item.id;
          return (
            <Link
              key={item.id}
              href={getNavHref(item, organizationSlug, user?.isPlatformUser)}
              className="relative flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ease-out hover:bg-slate-50"
              style={{
                backgroundColor: active ? "#e6f4f2" : "transparent",
                transform: active ? "translateY(-1px)" : "translateY(0)",
              }}
            >
              <span
                className="transition-colors duration-300 ease-out"
                style={{ color: active ? "#036c5f" : "#94a3b8" }}
              >
                {item.icon}
              </span>
              <span
                className="text-center leading-none transition-colors duration-300 ease-out"
                style={{
                  fontSize: "9px",
                  fontWeight: active ? 600 : 500,
                  color: active ? "#036c5f" : "#94a3b8",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "#036c5f", fontSize: "8px", fontWeight: 700 }}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
