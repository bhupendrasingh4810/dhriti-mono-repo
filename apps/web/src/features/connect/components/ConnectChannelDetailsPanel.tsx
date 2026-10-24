"use client";

import { ChevronRight, FileText, Link2, MessagesSquare, Pin, Users, X } from "lucide-react";
import type { ConnectDetailFile, ConnectDetailMeeting } from "@/types/connect.types";

interface ConnectChannelDetailsPanelProps {
  open: boolean;
  title: string;
  teamLabel: string;
  description: string;
  imageUrl?: string | null;
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
  teamLabel,
  description,
  imageUrl,
  memberCount,
  pinnedCount,
  linkCount,
  files,
  meetings,
  onClose,
}: ConnectChannelDetailsPanelProps) {
  const details = [
    { icon: Users, label: "Members", value: memberCount },
    { icon: Pin, label: "Pinned", value: pinnedCount },
    { icon: FileText, label: "Files", value: files.length },
    { icon: Link2, label: "Links", value: linkCount },
  ];

  return (
    <aside
      className={`hidden w-[312px] shrink-0 flex-col overflow-y-auto border-l border-slate-100 bg-white ${open ? "xl:flex" : "xl:hidden"}`}
      aria-label="Channel details"
    >
      <div className="flex flex-col gap-8 p-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close channel details"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full border border-brand bg-surface text-brand">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <MessagesSquare size={28} aria-hidden="true" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{teamLabel}</p>
          </div>
        </div>

        <section>
          <SectionHeading>About</SectionHeading>
          <p className="text-xs leading-relaxed text-slate-600">
            {description || "No additional description available."}
          </p>
        </section>

        <div className="space-y-0.5">
          {details.map((detail) => (
            <div key={detail.label} className="flex items-center justify-between rounded-md p-2 hover:bg-slate-50">
              <span className="flex items-center gap-2.5 text-sm text-slate-700">
                <detail.icon size={16} className="text-text-secondary" aria-hidden="true" />
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
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-md border border-slate-100 p-3 hover:border-slate-200"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-600">
                  <FileText size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-slate-900">{file.originalName}</span>
                  <span className="block text-[9px] font-bold uppercase text-slate-400">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </span>
                <ChevronRight size={16} className="text-text-secondary" aria-hidden="true" />
              </div>
            ))}

            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center gap-3 rounded-md border border-slate-100 p-3 hover:border-slate-200"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-orange-50 text-orange-600">
                  <MessagesSquare size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-slate-900">{meeting.title}</span>
                  <span className="block text-[9px] font-bold uppercase text-slate-400">Scheduled</span>
                </span>
                <ChevronRight size={16} className="text-text-secondary" aria-hidden="true" />
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
