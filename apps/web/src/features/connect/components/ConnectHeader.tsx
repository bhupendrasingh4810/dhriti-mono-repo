"use client";

import { useMemo, useState } from "react";
import type { ConnectHeaderSearchItem } from "@/types/connect.types";

type ConnectHeaderProps = {
  users?: ConnectHeaderSearchItem[];
  messages?: ConnectHeaderSearchItem[];
  files?: ConnectHeaderSearchItem[];
};

export function ConnectHeader({ users = [], messages = [], files = [] }: ConnectHeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const normalizedQuery = searchValue.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users
        .filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 6),
    [users, normalizedQuery],
  );
  const filteredMessages = useMemo(
    () =>
      messages
        .filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 6),
    [messages, normalizedQuery],
  );
  const filteredFiles = useMemo(
    () =>
      files
        .filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 6),
    [files, normalizedQuery],
  );

  const shouldShowResults = searchOpen && normalizedQuery.length > 0;

  return (
    <header className="flex h-[68px] shrink-0 items-center border-b border-slate-200 bg-white px-4">
      <div className="grid w-full grid-cols-[minmax(120px,auto)_1fr] items-center gap-x-4 md:grid-cols-[1fr_minmax(420px,640px)_1fr]">
        <div className="flex min-w-fit items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-700 text-sm font-bold italic text-white">
            F
          </div>
          <span className="text-lg font-bold text-slate-900">Flowrise</span>
        </div>

        <div className="relative col-start-2 w-full max-w-[760px] justify-self-center">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search (⌘ + K)"
            value={searchValue}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
            onChange={(event) => setSearchValue(event.target.value)}
            className="h-9 w-full rounded-lg bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none ring-1 ring-transparent placeholder:text-slate-400 focus:ring-emerald-600"
          />

          {shouldShowResults && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {[
                { title: "Users", data: filteredUsers },
                { title: "Messages", data: filteredMessages },
                { title: "Files", data: filteredFiles },
              ].map((section) => (
                <section key={section.title} className="border-b border-slate-200 p-3 last:border-b-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{section.title}</p>
                  <div className="space-y-0.5">
                    {section.data.length > 0 ? (
                      section.data.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full rounded px-2 py-2 text-left hover:bg-slate-50"
                        >
                          <span className="block text-sm font-semibold text-slate-800">{item.title}</span>
                          {item.description ? (
                            <span className="block text-xs text-slate-500">{item.description}</span>
                          ) : null}
                        </button>
                      ))
                    ) : (
                      <p className="px-2 py-2 text-xs text-slate-400">No results</p>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="col-start-2 flex items-center justify-self-end gap-2 md:col-start-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-50"
          >
            <BellIcon />
            <span className="absolute right-0.5 top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white">
              3
            </span>
          </button>
          <button
            type="button"
            aria-label="Help"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-50"
          >
            <HelpIcon />
          </button>
          <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
            <img
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg"
              alt="User profile"
              className="h-8 w-8 rounded-full object-cover"
            />
            <ChevronIcon className="h-[18px] w-[18px] text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
