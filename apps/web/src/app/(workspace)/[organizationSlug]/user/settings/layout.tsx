"use client";

import { PageSidebar } from "@/components/layout/workspace/page-sidebar";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "general",
    label: "General",
    icon: Settings,
  },
  {
    href: "notification",
    label: "Notification",
    icon: Bell,
  },
] as const;

export default function UserSettingsLayout({ children }: { children: ReactNode }) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const pathname = usePathname();
  const basePath = `/${organizationSlug}/user/settings`;

  return (
    <div className="flex min-h-full flex-col bg-background p-2 lg:p-4 md:flex-row md:pt-0">
      <PageSidebar>
<aside className="w-auto shrink-0 rounded-[20px] bg-brand p-4 text-text-inverse lg:fixed lg:bottom-4 lg:left-[88px] lg:top-[76px] lg:w-[312px]">
        <p className="mb-5 px-2 text-xs font-semibold uppercase tracking-wide text-white/70">Personal settings</p>
        <nav aria-label="User settings" className="flex gap-1 lg:flex-col">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const itemPath = `${basePath}/${href}`;
            const active = pathname === itemPath;

            return (
              <Link
                key={href}
                href={itemPath}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:flex-none ${
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
</PageSidebar>
      <main className="min-w-0 flex-1 lg:ml-[328px]">{children}</main>
    </div>
  );
}
