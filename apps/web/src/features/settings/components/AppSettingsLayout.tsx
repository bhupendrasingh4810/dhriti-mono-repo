"use client";

import { PageSidebar } from "@/components/layout/workspace/page-sidebar";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  CircleCheck,
  CircleDot,
  ChevronDown,
  Clock3,
  Flag,
  GitBranch,
  KeyRound,
  Link2,
  ListChecks,
  Map,
  MessageSquare,
  NotebookPen,
  Route,
  Search,
  Settings,
  ShieldCheck,
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
      { id: "work-type-hierarchy", label: "Work type hierarchy", icon: GitBranch },
      { id: "work-types", label: "Work types", icon: ListChecks },
      { id: "work-type-schemes", label: "Work type schemes", icon: Route },
      { id: "sub-tasks", label: "Sub tasks", icon: GitBranch },
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    items: [
      { id: "workflows", label: "Workflows", icon: Route },
      { id: "workflow-schemes", label: "Workflow schemes", icon: GitBranch },
    ],
  },
  {
    id: "fields",
    label: "Fields",
    items: [
      { id: "fields", label: "Fields", icon: ListChecks },
      { id: "field-schemes", label: "Field Schemes", icon: GitBranch },
    ],
  },
  {
    id: "priorities",
    label: "Priorities",
    items: [
      { id: "priorities", label: "Priorities", icon: Flag },
      { id: "priority-schemes", label: "Priority Schemes", icon: GitBranch },
    ],
  },
  {
    id: "work-item-features",
    label: "Work item features",
    items: [
      { id: "time-tracking", label: "Time tracking", icon: Clock3 },
      { id: "work-item-linking", label: "Work item linking", icon: Link2 },
    ],
  },
  {
    id: "work-item-attributes",
    label: "Work item attributes",
    items: [
      { id: "statuses", label: "Statuses", icon: CircleDot },
      { id: "resolutions", label: "Resolutions", icon: CircleCheck },
      { id: "work-item-security-schemes", label: "Work item security schemes", icon: ShieldCheck },
      { id: "notification-schemes", label: "Notification schemes", icon: Bell },
      { id: "permission-schemes", label: "Permissions schemes", icon: KeyRound },
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
    <nav
      aria-label="Flow settings navigation"
      className="flex gap-1 overflow-x-auto md:-mr-4 md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:pr-4"
    >
      <Link
        href={basePath}
        aria-current={!selectedSection ? "page" : undefined}
        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors md:flex-none ${
          !selectedSection
            ? "bg-on-brand-border text-text-inverse"
            : "text-on-brand-muted hover:bg-on-brand-hover hover:text-text-inverse"
        }`}
      >
        <ListChecks aria-hidden="true" size={18} strokeWidth={1.75} />
        <span className="truncate">Overview</span>
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
              className={`mt-4 flex w-full cursor-pointer items-center justify-between gap-3 px-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors ${
                groupSelected ? "text-text-inverse" : "text-on-brand-muted hover:text-text-inverse"
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
              <div className="mt-2">
                {group.items.map((item) => {
                  const href = `${basePath}?section=${item.id}`;
                  const active = selectedSection === item.id;
                  const ItemIcon = item.icon;

                  return (
                    <Link
                      key={item.id}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-on-brand-border text-text-inverse"
                          : "text-on-brand-muted hover:bg-on-brand-hover hover:text-text-inverse"
                      }`}
                    >
                      <ItemIcon aria-hidden="true" size={17} strokeWidth={1.75} />
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
    <div className="flex min-h-full flex-col bg-background p-2 lg:p-4 md:flex-row md:pt-0">
      <PageSidebar>
<aside className="w-auto shrink-0 rounded-[20px] bg-brand p-4 text-text-inverse lg:fixed lg:bottom-4 lg:left-[88px] lg:top-[76px] lg:flex lg:w-[312px] lg:flex-col">
        <div className="-mx-4 -mt-4 mb-4 border-b border-on-brand-border px-4 py-4">
          <p className="text-sm font-bold">{label}</p>
        </div>
        {app === "flow" ? (
          <FlowSettingsNavigation organizationSlug={organizationSlug} />
        ) : (
          <nav aria-label={`${label} navigation`} className="flex gap-1 lg:flex-col">
            <Link
              href={href}
              aria-current="page"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg bg-on-brand-border px-3 py-2.5 text-sm font-medium text-text-inverse lg:flex-none"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
              <span className="truncate">{label}</span>
            </Link>
          </nav>
        )}
      </aside>
</PageSidebar>
      <main className="min-w-0 flex-1 lg:ml-[328px]">{children}</main>
    </div>
  );
}
