"use client";

import { PageSidebar } from "@/components/layout/workspace/page-sidebar";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";
import AppSettingsPage from "@/features/settings/AppSettingsPage";

const tabs = [
  "App Settings",
  "Departments",
  "Designations",
  "Employment Types",
  "Holidays",
  "Integrations",
  "Leave Types",
  "Locations",
  "Shifts",
  "Workflows",
];
const settingsRouteSegments: Partial<Record<(typeof tabs)[number], string>> = {
  "App Settings": "app-settings",
  Departments: "departments",
  Designations: "designations",
  "Employment Types": "employment-types",
  Holidays: "holidays",
  "Leave Types": "leave-types",
  Locations: "locations",
  Shifts: "shifts",
  Workflows: "workflow",
};
const stats = [
  ["Locations", "8", "Across 4 countries"],
  ["Departments", "14", "52 teams"],
  ["Approval workflows", "12", "10 active"],
  ["HR integrations", "7", "All healthy"],
];
const columns = ["Setting", "Description", "Last updated", "Updated by", "Status"];
const rows = [
  ["Organization profile", "Legal entity and HR details", "2 days ago", "Neha Mehta", "Configured"],
  ["Leave workflows", "Conditional approval routing", "Sep 28", "Neha Mehta", "Active"],
  ["Notification preferences", "Email and in-app rules", "Sep 22", "Aditi Bose", "Active"],
];

function SettingsDrawer({ close, complete }: { close: () => void; complete: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const [attempted, setAttempted] = useState(false);
  const submit = () => {
    setAttempted(true);
    if (title) complete("Save settings completed");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Save settings"
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">Save settings</h2>
            <p className="mt-1 text-xs text-text-muted">Settings workflow · Changes are reviewed before completion</p>
          </div>
          <button type="button" onClick={close} className="rounded-md p-2 text-text-muted hover:bg-slate-100">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Configuration name <span className="text-error">*</span>
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:border-brand ${attempted && !title ? "border-error" : "border-border"}`}
              placeholder="Enter settings details"
            />
            {attempted && !title && <p className="mt-1 text-xs text-error">This field is required.</p>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="mb-1.5 block text-sm font-semibold">Owner</span>
              <select className="w-full rounded-md border border-border px-3 py-2.5 text-sm">
                <option>Neha Mehta</option>
                <option>Rohan Kapoor</option>
                <option>Priya Verma</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold">Due date</span>
              <input type="date" className="w-full rounded-md border border-border px-3 py-2.5 text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Description</span>
            <textarea
              rows={4}
              className="w-full resize-none rounded-md border border-border px-3 py-2.5 text-sm"
              placeholder="Add instructions, context, or approval notes"
            />
          </label>
          <label className="flex items-center gap-3 rounded-md border border-border p-4">
            <input type="checkbox" defaultChecked />
            <span>
              <span className="block text-sm font-semibold">Send notifications</span>
              <span className="block text-xs text-text-muted">Notify assigned people when this is created.</span>
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-border bg-slate-50 px-6 py-4">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit}>Save settings</Button>
        </div>
      </aside>
    </div>
  );
}

function AppSettings() {
  return <AppSettingsPage app="hrms" showBreadcrumb={false} />;
}

export function HrmsSettingsSidebar({ activeTab, onSelect }: { activeTab: string; onSelect?: (tab: string) => void }) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const router = useRouter();

  return (
    <PageSidebar>
<aside className="w-auto shrink-0 rounded-[20px] bg-brand p-4 text-text-inverse lg:fixed lg:bottom-4 lg:left-[88px] lg:top-[76px] lg:w-[312px]">
      <p className="mb-5 px-2 text-xs font-semibold uppercase tracking-wide text-white/70">HRMS settings</p>
      <nav aria-label="HRMS settings" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-y-auto">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              const routeSegment = settingsRouteSegments[item];
              if (routeSegment) {
                router.push(`/${organizationSlug}/hrms/settings/${routeSegment}`);
                return;
              }
              onSelect?.(item);
            }}
            className={`flex shrink-0 cursor-pointer items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full ${
              activeTab === item ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
</PageSidebar>
  );
}

export function HrmsSettings({ onToast }: { onToast: (message: string) => void }) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const [tab, setTab] = useState(tabs[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="flex min-h-full flex-col bg-background md:flex-row">
      <HrmsSettingsSidebar activeTab={tab} onSelect={setTab} />
      <main className="min-w-0 flex-1 lg:ml-[328px]">
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
            {tab}
          </span>
        </nav>
        <div className="mt-4">
          {tab === "App Settings" ? (
            <AppSettings />
          ) : (
            <>
              <HrmsSettingsHeader tab={tab} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map(([label, value, meta], index) => (
                  <Card key={label} className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-secondary">{label}</p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-muted text-brand">
                        <Icon name="settings" size={16} />
                      </div>
                    </div>
                    <p className="mt-4 font-display text-2xl font-bold text-text-primary">{value}</p>
                    <p className="mt-1 text-xs text-text-muted">{meta}</p>
                    {index === 0 && (
                      <div className="mt-4 h-1 rounded-full bg-slate-100">
                        <div className="h-1 w-3/4 rounded-full bg-brand" />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              <Card className="mt-5 overflow-hidden">
                <CardTitle
                  title={tab === tabs[0] ? "Configuration areas" : tab}
                  subtitle={`Settings · ${tab}`}
                  action={
                    <div className="flex gap-2">
                      <Button variant="secondary" icon="filter">
                        Filters
                      </Button>
                      <Button variant="secondary" icon="download" onClick={() => onToast(`${tab} export prepared`)}>
                        Export
                      </Button>
                    </div>
                  }
                />
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="bg-slate-50">
                        {columns.map((column) => (
                          <th
                            key={column}
                            className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
                          >
                            {column}
                          </th>
                        ))}
                        <th className="px-5 py-3 text-xs uppercase text-text-muted">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((row) => (
                        <tr key={row[0]} className="hover:bg-brand-muted/30">
                          {row.map((cell, index) => (
                            <td
                              key={index}
                              className={`px-5 py-4 text-sm ${index === 0 ? "font-semibold text-text-primary" : "text-text-secondary"}`}
                            >
                              {index === row.length - 1 ? <Badge tone="success">{cell}</Badge> : cell}
                            </td>
                          ))}
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => {
                                setDrawerOpen(true);
                                onToast(`${row[0]} details opened`);
                              }}
                              className="rounded-md p-2 text-text-muted hover:bg-slate-100 hover:text-brand"
                            >
                              <Icon name="dots" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
      {drawerOpen && (
        <SettingsDrawer
          close={() => setDrawerOpen(false)}
          complete={(message) => {
            setDrawerOpen(false);
            onToast(message);
          }}
        />
      )}
    </div>
  );
}

function HrmsSettingsHeader({ tab }: { tab: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-text-primary">{tab}</h1>
      <p className="mt-1 text-sm text-text-secondary">Manage HRMS {tab.toLowerCase()} for your organization.</p>
    </header>
  );
}
