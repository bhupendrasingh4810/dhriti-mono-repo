"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "connect",
    label: "Connect",
    href: "connect",
    badge: 3,
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "pulse",
    label: "Pulse", 
    href: "pulse",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "flow",
    label: "Flow",
    href: "flow/dashboard",
    badge: 12,
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "atlas",
    label: "Atlas",
    href: "atlas",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    id: "cadence",
    label: "Cadence",
    href: "cadence",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: "control",
    label: "Control",
    href: "control",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  activeView: AppView;
  organizationSlug: string;
  onViewChange: (v: AppView) => void;
  onLogout: () => void;
}

export default function Sidebar({ activeView, onViewChange, onLogout, organizationSlug }: SidebarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedView, setSelectedView] = useState<AppView>(activeView);

  useEffect(() => {
    setSelectedView(activeView);
  }, [activeView]);

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
          const active = selectedView === item.id;
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

      {/* Bottom */}
      {/* <div className="flex flex-col items-center gap-1 py-3 border-t border-slate-100">
        <button
          className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          title="Settings"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <span style={{ fontSize: "9px", fontWeight: 500 }}>Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-50 transition-all"
          title="Logout"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span style={{ fontSize: "9px", fontWeight: 500 }}>Logout</span>
        </button> */}
        {/* Avatar */}
        {/* <div className="mt-1 w-8 h-8 rounded-full bg-[#036c5f] flex items-center justify-center">
          <span className="text-white font-bold" style={{ fontSize: "10px" }}>
            JS
          </span>
        </div>
      </div> */}
    </aside>
  );
}
