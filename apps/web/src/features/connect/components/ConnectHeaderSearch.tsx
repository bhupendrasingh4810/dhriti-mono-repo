"use client";

import { useEffect, useRef, useState } from "react";
import { connectService, type ConnectOrganizationUser } from "@/services/connect.service";
import type { ConnectSearchUser } from "@/contexts/connect-search-context";

type ConnectHeaderSearchProps = {
  organizationId: string;
  recentUsers: ConnectSearchUser[];
  recentUsersError: string;
  onSelectUser: (user: ConnectSearchUser) => void;
};

export function ConnectHeaderSearch({
  organizationId,
  recentUsers,
  recentUsersError,
  onSelectUser,
}: ConnectHeaderSearchProps) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ConnectOrganizationUser[]>([]);
  const [error, setError] = useState("");
  const closeTimerRef = useRef<number | null>(null);
  const query = value.trim();

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!query || !organizationId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void connectService
        .searchUsers(organizationId, query)
        .then((nextResults) => {
          if (!cancelled) {
            setResults(nextResults);
            setError("");
          }
        })
        .catch((reason: unknown) => {
          if (!cancelled) {
            setResults([]);
            setError(reason instanceof Error ? reason.message : "Unable to search users.");
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [organizationId, query]);

  const selectUser = (user: ConnectSearchUser) => {
    onSelectUser(user);
    setValue("");
    setIsOpen(false);
  };
  const avatar = (user: ConnectSearchUser) =>
    user.avatarUrl ? (
      <img src={user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
    ) : (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
        {user.name.slice(0, 1).toUpperCase()}
      </span>
    );

  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <input
        type="search"
        placeholder="Search (Ctrl + K)"
        value={value}
        onFocus={() => {
          if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
          setIsOpen(true);
        }}
        onBlur={() => {
          closeTimerRef.current = window.setTimeout(() => {
            closeTimerRef.current = null;
            setIsOpen(false);
          }, 120);
        }}
        onChange={(event) => setValue(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none ring-1 ring-transparent placeholder:text-slate-400 focus:border-emerald-600 focus:ring-emerald-600"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[420px] overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {recentUsers.length > 0 ? (
            <section className="border-b border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent users</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectUser(user)}
                    className="w-44 shrink-0 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {avatar(user)}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800">{user.name}</span>
                        {user.description ? (
                          <span className="block truncate text-xs text-slate-500">{user.description}</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
          {recentUsersError ? <p role="alert" className="px-3 pt-3 text-xs text-error">{recentUsersError}</p> : null}
          {query ? (
            <section className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Users</p>
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    selectUser({ id: item.id, name: item.name, description: item.email, avatarUrl: item.avatarUrl })
                  }
                  className="flex w-full items-center gap-3 rounded px-2 py-2 text-left hover:bg-slate-50"
                >
                  {avatar({ id: item.id, name: item.name, avatarUrl: item.avatarUrl })}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">{item.name}</span>
                    <span className="block truncate text-xs text-slate-500">{item.email}</span>
                  </span>
                </button>
              ))}
              {!error && results.length === 0 ? <p className="px-2 py-2 text-xs text-slate-400">No users found</p> : null}
              {error ? <p role="alert" className="px-2 py-2 text-xs text-error">{error}</p> : null}
            </section>
          ) : recentUsers.length === 0 ? (
            <p className="p-3 text-xs text-slate-400">Search for a user to start a chat.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
