"use client";

import { useState } from "react";

import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";

const tabs = ["Library", "Requests", "Policies", "Compliance", "Audit log"];

const documentStats = [
  ["Total documents", "8,426", "Across 486 employees"],
  ["Requests", "18", "6 overdue"],
  ["Acknowledgments", "92%", "Policy completion"],
  ["Expiring soon", "24", "Next 30 days"],
];

const documentRequests = [
  ["Address proof", "Dev Patel", "People Ops", "Oct 12", "Pending"],
  ["Degree certificate", "Ishita Khanna", "Compliance", "Oct 15", "Submitted"],
  ["Tax declaration", "All employees", "Finance", "Oct 31", "In progress"],
  ["Visa copy", "Mohit Jain", "People Ops", "Oct 18", "Pending"],
];

function UploadDocumentDrawer({ close, onComplete }: { close: () => void; onComplete: (message: string) => void }) {
  const [title, setTitle] = useState("");
  const [attempted, setAttempted] = useState(false);

  const submit = () => {
    setAttempted(true);
    if (title) onComplete("Document uploaded");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Upload document"
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">Upload document</h2>
            <p className="mt-1 text-xs text-text-muted">Add a document to the HR library</p>
          </div>
          <button type="button" onClick={close} className="rounded-md p-2 text-text-muted hover:bg-slate-100">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Document name</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
              placeholder="e.g. Employee handbook"
            />
            {attempted && !title && <span className="mt-1 block text-xs text-error">Enter a document name.</span>}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Category</span>
            <select className="w-full rounded-md border border-border px-3 py-2.5 text-sm">
              <option>Policy</option>
              <option>Employee record</option>
              <option>Compliance</option>
              <option>Template</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">File</span>
            <input type="file" className="block w-full text-sm text-text-secondary" />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit}>Upload document</Button>
        </div>
      </aside>
    </div>
  );
}

export function HrmsDocuments({ onToast }: { onToast: (message: string) => void }) {
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
          Upload document
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {documentStats.map(([label, value, meta], index) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">{label}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-muted text-brand">
                <Icon name="file" size={16} />
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
          title={tab === tabs[0] ? "Document requests" : tab}
          subtitle={`Documents · ${tab}`}
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
                {["Document", "Employee", "Requested by", "Due date", "Status"].map((column) => (
                  <th key={column} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {column}
                  </th>
                ))}
                <th className="px-5 py-3 text-xs uppercase text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documentRequests.map((row) => (
                <tr key={row[0]} className="hover:bg-brand-muted/30">
                  {row.map((cell, index) => (
                    <td
                      key={cell}
                      className={`px-5 py-4 text-sm ${index === 0 ? "font-semibold text-text-primary" : "text-text-secondary"}`}
                    >
                      {index === row.length - 1 ? <Badge tone={cell === "Submitted" ? "success" : "warning"}>{cell}</Badge> : cell}
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
        <div className="border-t border-border px-5 py-3">
          <button type="button" className="flex items-center gap-2 text-sm font-semibold text-brand">
            View all document records <Icon name="arrow" size={15} />
          </button>
        </div>
      </Card>

      {drawerOpen && (
        <UploadDocumentDrawer
          close={() => setDrawerOpen(false)}
          onComplete={(message) => {
            setDrawerOpen(false);
            onToast(message);
          }}
        />
      )}
    </>
  );
}
