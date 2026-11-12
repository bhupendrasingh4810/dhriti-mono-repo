"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { HrmsSettingsSidebar } from "./settings";

export function HrmsSettingsPageLayout({ activeTab, children }: { activeTab: string; children: ReactNode }) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();

  return (
    <div className="flex h-full min-h-0 flex-col bg-background md:flex-row">
      <HrmsSettingsSidebar activeTab={activeTab} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:ml-[328px]">
        <nav
          aria-label="Breadcrumb"
          className="sticky top-4 z-30 rounded-lg bg-surface px-6 py-5 text-sm text-text-secondary"
        >
          <Link href={`/${organizationSlug}/hrms`} className="cursor-pointer hover:text-text-primary">
            HRMS
          </Link>
          <span className="px-2 text-text-muted">/</span>
          <Link href={`/${organizationSlug}/hrms/settings`} className="cursor-pointer hover:text-text-primary">
            Settings
          </Link>
          <span className="px-2 text-text-muted">/</span>
          <span aria-current="page" className="font-semibold text-text-primary">
            {activeTab}
          </span>
        </nav>
        <div className="mt-4 min-h-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
