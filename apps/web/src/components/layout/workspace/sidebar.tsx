"use client";

import React from "react";
import { CalendarDays, FileText, LayoutDashboard, ListChecks, MessageCircle, Shield, Star } from "lucide-react";
import Link from "next/link";
import type { AppView } from "@/types/app.types";
import { useAuth } from "@/hooks/use-auth";
interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "home",
    icon: <LayoutDashboard size={22} strokeWidth={1.75} />,
  },
  {
    id: "connect",
    label: "Connect",
    href: "connect",
    badge: 3,
    icon: <MessageCircle size={22} strokeWidth={1.75} />,
  },
  {
    id: "pulse",
    label: "Pulse",
    href: "pulse",
    icon: <CalendarDays size={22} strokeWidth={1.75} />,
  },
  {
    id: "flow",
    label: "Flow",
    href: "flow/dashboard",
    badge: 12,
    icon: <ListChecks size={22} strokeWidth={1.75} />,
  },
  {
    id: "atlas",
    label: "Atlas",
    href: "atlas",
    icon: <FileText size={22} strokeWidth={1.75} />,
  },
  {
    id: "cadence",
    label: "Cadence",
    href: "cadence",
    icon: <Star size={22} strokeWidth={1.75} />,
  },
  {
    id: "control",
    label: "Control",
    href: "control",
    icon: <Shield size={22} strokeWidth={1.75} />,
  },
];

interface SidebarProps {
  activeView: AppView;
  organizationSlug: string;
}

export default function Sidebar({ activeView, organizationSlug }: SidebarProps) {
  const { user } = useAuth();

  const getNavHref = (item: NavItem) => {
    if (item.id === "control") {
      const controlPath = user?.isPlatformUser ? "platform" : "org";
      return `/${organizationSlug}/${item.id}/${controlPath}/dashboard`;
    }

    return `/${organizationSlug}/${item.href}`;
  };

  return (
    <aside className="flex flex-col h-full flex-shrink-0 border-r border-slate-100 bg-white" style={{ width: "72px" }}>
      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <Link
              key={item.id}
              href={getNavHref(item)}
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
