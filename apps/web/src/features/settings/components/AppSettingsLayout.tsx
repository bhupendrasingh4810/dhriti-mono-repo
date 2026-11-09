"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronDown,
  Clock3,
  ListChecks,
  Map,
  MessageSquare,
  NotebookPen,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import type { AppSettingsKey } from "@/services/app-settings.service";

const appIcons: Partial<Record<AppSettingsKey, LucideIcon>> = {
  atlas: Map,
  cadence: Clock3,
  connect: MessageSquare,
  flow: ListChecks,
  nexus: Search,
  notes: NotebookPen,
  pulse: Activity,
};

const flowSettingsGroups = [
  {
    id: "work-types",
    label: "Work types",
    items: [
      { id: "work-type-hierarchy", label: "Work type hierarchy" },
      { id: "work-types", label: "Work types" },
      { id: "work-type-schemes", label: "Work type schemes" },
      { id: "sub-tasks", label: "Sub tasks" },
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    items: [
      { id: "workflows", label: "Workflows" },
      { id: "workflow-schemes", label: "Workflow schemes" },
    ],
  },
  {
    id: "fields",
    label: "Fields",
    items: [
      { id: "fields", label: "Fields" },
      { id: "field-schemes", label: "Field Schemes" },
    ],
  },
  {
    id: "priorities",
    label: "Priorities",
    items: [
      { id: "priorities", label: "Priorities" },
      { id: "priority-schemes", label: "Priority Schemes" },
    ],
  },
  {
    id: "work-item-features",
    label: "Work item features",
    items: [
      { id: "time-tracking", label: "Time tracking" },
      { id: "work-item-linking", label: "Work item linking" },
    ],
  },
  {
    id: "work-item-attributes",
    label: "Work item attributes",
    items: [
      { id: "statuses", label: "Statuses" },
      { id: "resolutions", label: "Resolutions" },
      { id: "work-item-security-schemes", label: "Work item security schemes" },
      { id: "notification-schemes", label: "Notification schemes" },
      { id: "permission-schemes", label: "Permissions schemes" },
    ],
  },
] as const;

function FlowSettingsNavigation({ organizationSlug }: { organizationSlug: string }) {
  const searchParams = useSearchParams();
  const selectedSection = searchParams.get("section");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(flowSettingsGroups.map((group) => [group.id, true])),
  );
  const basePath = `/${organizationSlug}/flow/settings`;

  return (
    <nav aria-label="Flow settings navigation" className="flex gap-1 overflow-x-auto md:-mr-4 md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:pr-4">
      <Link
        href={basePath}
        aria-current={!selectedSection ? "page" : undefined}
        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:flex-none ${
          !selectedSection ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <ListChecks aria-hidden="true" size={18} strokeWidth={1.75} />
        <span className="truncate">Flow Settings</span>
      </Link>
      {flowSettingsGroups.map((group) => {
        const groupSelected = group.items.some((item) => item.id === selectedSection);
        const open = openGroups[group.id];

        return (
          <div key={group.id} className="min-w-0 md:flex-none">
            <button
              type="button"
              onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !open }))}
              aria-expanded={open}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                groupSelected ? "text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="truncate">{group.label}</span>
              <ChevronDown
                aria-hidden="true"
                size={16}
                className={`shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
              />
            </button>
            {open ? (
              <div className="ml-3 border-l border-on-brand-border pl-2">
                {group.items.map((item) => {
                  const href = `${basePath}?section=${item.id}`;
                  const active = selectedSection === item.id;

                  return (
                    <Link
                      key={item.id}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`mb-1 flex cursor-pointer rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-white/15 font-medium text-white"
                          : "text-on-brand-muted hover:bg-on-brand-hover hover:text-text-inverse"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function AppSettingsLayout({
  app,
  label,
  children,
  showSidebar = true,
}: {
  app: AppSettingsKey;
  label: string;
  children: ReactNode;
  showSidebar?: boolean;
}) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();

  if (!showSidebar) {
    return children;
  }

  const Icon = appIcons[app] ?? Settings;
  const href = `/${organizationSlug}/${app}/settings`;

  return (
    <div className="flex min-h-full flex-col bg-background p-4 md:flex-row md:pt-0">
      <aside className="w-auto shrink-0 rounded-[20px] bg-brand p-4 text-text-inverse md:fixed md:bottom-4 md:left-[88px] md:top-[76px] md:flex md:w-[312px] md:flex-col">
        <p className="mb-5 px-2 text-xs font-semibold uppercase tracking-wide text-white/70">{label}</p>
        {app === "flow" ? (
          <FlowSettingsNavigation organizationSlug={organizationSlug} />
        ) : (
          <nav aria-label={`${label} navigation`} className="flex gap-1 md:flex-col">
            <Link
              href={href}
              aria-current="page"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg bg-white/15 px-3 py-2.5 text-sm font-medium text-white md:flex-none"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
              <span className="truncate">{label}</span>
            </Link>
          </nav>
        )}
      </aside>
      <main className="min-w-0 flex-1 md:ml-[328px]">{children}</main>
    </div>
  );
}
