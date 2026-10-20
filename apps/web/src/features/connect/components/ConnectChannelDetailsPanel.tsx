"use client";

import type { ConnectDetailFile, ConnectDetailMeeting, DetailIconKind } from "@/types/connect.types";

interface ConnectChannelDetailsPanelProps {
  open: boolean;
  title: string;
  type: "channel" | "direct" | "group";
  teamLabel: string;
  description: string;
  memberCount: number;
  pinnedCount: number;
  linkCount: number;
  files: ConnectDetailFile[];
  meetings: ConnectDetailMeeting[];
  onClose: () => void;
}

export function ConnectChannelDetailsPanel({
  open,
  title,
  type,
  teamLabel,
  description,
  memberCount,
  pinnedCount,
  linkCount,
  files,
  meetings,
  onClose,
}: ConnectChannelDetailsPanelProps) {
  const details = [
    { icon: "members" as const, label: "Members", value: memberCount },
    { icon: "pinned" as const, label: "Pinned", value: pinnedCount },
    { icon: "file" as const, label: "Files", value: files.length },
    { icon: "link" as const, label: "Links", value: linkCount },
  ];

  return (
    <aside
      className={`hidden w-[312px] shrink-0 flex-col overflow-y-auto border-l border-slate-100 bg-white ${open ? "xl:flex" : "xl:hidden"}`}
      aria-label="Channel details"
    >
      <div className="flex flex-col gap-8 p-6">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} aria-label="Close channel details" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <DetailIcon kind="close" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`grid h-16 w-16 place-items-center rounded-md border text-[26px] font-bold ${type === "channel" ? "border-blue-100 bg-blue-50 text-blue-500" : "border-slate-200 bg-slate-50 text-blue-500"}`}>
            {type === "channel" ? "#" : "@"}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{teamLabel}</p>
          </div>
        </div>

        <section>
          <SectionHeading>About</SectionHeading>
          <p className="text-xs leading-relaxed text-slate-600">{description || "No additional description available."}</p>
        </section>

        <div className="space-y-0.5">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center justify-between rounded-md p-2 hover:bg-slate-50">
              <span className="flex items-center gap-2.5 text-sm text-slate-700">
                <DetailIcon kind={detail.icon} className="text-slate-400" />
                {detail.label}
              </span>
              <span className="text-[11px] font-bold text-slate-400">{detail.value}</span>
            </div>
          ))}
        </div>

        <section>
          <SectionHeading>Connected Work</SectionHeading>
          <div className="space-y-3">
            {files.slice(0, 2).map((file) => (
              <div key={file.id} className="flex items-center gap-3 rounded-md border border-slate-100 p-3 hover:border-slate-200">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                  <DetailIcon kind="file" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-slate-900">{file.originalName}</span>
                  <span className="block text-[9px] font-bold uppercase text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                </span>
                <DetailIcon kind="chevron" className="text-slate-300" />
              </div>
            ))}

            {meetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center gap-3 rounded-md border border-slate-100 p-3 hover:border-slate-200">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-orange-50 text-orange-600">
                  <DetailIcon kind="meeting" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-slate-900">{meeting.title}</span>
                  <span className="block text-[9px] font-bold uppercase text-slate-400">Scheduled</span>
                </span>
                <DetailIcon kind="chevron" className="text-slate-300" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <h3 className="mb-1.5 text-[10px] font-black uppercase tracking-[0.09em] text-slate-400">{children}</h3>;
}

function DetailIcon({ kind, className = "" }: { kind: DetailIconKind; className?: string }) {
  const content = {
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" /></>,
    meeting: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    members: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 16c2.5 0 4 1.3 4 4" /></>,
    pinned: <><path d="m14 4 6 6-3 1-3 5-2-2-5 3-1-1 3-5-2-2 5-3z" /><path d="m12 16-4 4" /></>,
  }[kind];

  return <svg aria-hidden="true" className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{content}</svg>;
}
