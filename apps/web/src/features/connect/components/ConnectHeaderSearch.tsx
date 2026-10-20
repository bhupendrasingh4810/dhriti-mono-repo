"use client";

import { useState } from "react";
import type { ConnectHeaderSearchItem } from "@/types/connect.types";

type ConnectHeaderSearchProps = {
  users: ConnectHeaderSearchItem[];
  messages: ConnectHeaderSearchItem[];
  files: ConnectHeaderSearchItem[];
};

export function ConnectHeaderSearch({ users, messages, files }: ConnectHeaderSearchProps) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const filter = (items: ConnectHeaderSearchItem[]) =>
    items.filter((item) => `${item.title} ${item.description ?? ""}`.toLowerCase().includes(query)).slice(0, 6);
  const sections = [{ title: "Users", items: filter(users) }, { title: "Messages", items: filter(messages) }, { title: "Files", items: filter(files) }];

  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <input
        type="search"
        placeholder="Search (Ctrl + K)"
        value={value}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => setValue(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none ring-1 ring-transparent placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600"
      />
      {isOpen && query && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-slate-200 p-3 last:border-b-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{section.title}</p>
              {section.items.map((item) => <button key={item.id} type="button" className="block w-full rounded px-2 py-2 text-left hover:bg-slate-50"><span className="block text-sm font-semibold text-slate-800">{item.title}</span>{item.description && <span className="block text-xs text-slate-500">{item.description}</span>}</button>)}
              {section.items.length === 0 && <p className="px-2 py-2 text-xs text-slate-400">No results</p>}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}