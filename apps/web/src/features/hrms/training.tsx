"use client";

import { useState } from "react";

import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";

const tabs = ["Dashboard", "Catalog", "Assignments", "Progress", "Certificates"];
const stats = [
  ["Assigned courses", "1,248", "Across workforce"],
  ["Completion rate", "82%", "+6% this quarter"],
  ["Sessions", "14", "Upcoming this month"],
  ["Certificates", "396", "Issued this year"],
];
const columns = ["Program", "Audience", "Enrolled", "Completion", "Status"];
const rows = [
  ["Information Security 2026", "All employees", "486", "94%", "In progress"],
  ["Manager Essentials", "People managers", "68", "76%", "In progress"],
  ["Advanced React Patterns", "Engineering", "52", "62%", "In progress"],
  ["Workplace Conduct", "New joiners", "18", "100%", "Complete"],
];

function TrainingDrawer({ close, complete }: { close: () => void; complete: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const [attempted, setAttempted] = useState(false);

  const submit = () => {
    setAttempted(true);
    if (title) complete("Assign training completed");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Assign training"
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">Assign training</h2>
            <p className="mt-1 text-xs text-text-muted">Training workflow · Changes are reviewed before completion</p>
          </div>
          <button type="button" onClick={close} className="rounded-md p-2 text-text-muted hover:bg-slate-100">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Course or session <span className="text-error">*</span>
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={`w-full rounded-md border px-3 py-2.5 text-sm outline-none focus:border-brand ${attempted && !title ? "border-error" : "border-border"}`}
              placeholder="Enter training details"
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
          <Button onClick={submit}>Assign training</Button>
        </div>
      </aside>
    </div>
  );
}

export function HrmsTraining({ onToast }: { onToast: (message: string) => void }) {
  const [tab, setTab] = useState(tabs[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold ${tab === item ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <Button icon="plus" onClick={() => setDrawerOpen(true)}>
          Assign training
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, meta], index) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">{label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-muted text-brand">
                <Icon name="book" size={16} />
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
          title={tab === tabs[0] ? "Active learning programs" : tab}
          subtitle={`Training · ${tab}`}
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
                  <th key={column} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
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
                      {index === row.length - 1 ? (
                        <Badge tone={cell.includes("Complete") ? "success" : "warning"}>{cell}</Badge>
                      ) : (
                        cell
                      )}
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
      {drawerOpen && (
        <TrainingDrawer
          close={() => setDrawerOpen(false)}
          complete={(message) => {
            setDrawerOpen(false);
            onToast(message);
          }}
        />
      )}
    </>
  );
}
