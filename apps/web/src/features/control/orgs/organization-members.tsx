"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, LoaderCircle, Search } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";
import { controlOrganizationService, type ControlOrganizationMember } from "@/services/control.service";

type SortField = "name" | "email" | "status" | "isOwner" | "teams" | "joinedAt";
const columns: { label: string; field: SortField }[] = [
  { label: "Name", field: "name" },
  { label: "Email", field: "email" },
  { label: "Membership", field: "isOwner" },
  { label: "Status", field: "status" },
  { label: "Teams", field: "teams" },
  { label: "Joined", field: "joinedAt" },
];
const selectClass =
  "cursor-pointer rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function OrganizationMembers({ organizationId }: { organizationId: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [membership, setMembership] = useState("");
  const [team, setTeam] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("joinedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [state, setState] = useState<{
    members: ControlOrganizationMember[];
    loading: boolean;
    error: string;
  }>({ members: [], loading: true, error: "" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    // Debounce server search and discard old responses when the query or selected tenant changes.
    const timer = window.setTimeout(() => {
      void controlOrganizationService.listMembers(organizationId, search).then(
        (members) => {
          if (active) setState({ members, loading: false, error: "" });
        },
        (failure: unknown) => {
          if (active)
            setState({
              members: [],
              loading: false,
              error: failure instanceof Error ? failure.message : "Unable to load organization members",
            });
        },
      );
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [organizationId, search, reload]);

  // The existing API returns every search match; filter and sort before paging, never just the visible rows.
  const filtered = state.members.filter(
    (member) =>
      (!status || member.status === status) &&
      (!membership || member.isOwner === (membership === "owner")) &&
      (!team || member.teams.includes(team)),
  );
  const sorted = [...filtered].sort((a, b) => {
    let comparison: number;
    if (sortBy === "joinedAt") comparison = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    else if (sortBy === "isOwner") comparison = Number(a.isOwner) - Number(b.isOwner);
    else {
      const first = sortBy === "teams" ? a.teams.join(", ") : a[sortBy];
      const second = sortBy === "teams" ? b.teams.join(", ") : b[sortBy];
      comparison = first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" });
    }
    return (sortOrder === "asc" ? comparison : -comparison) || a.id.localeCompare(b.id);
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const teams = [...new Set(state.members.flatMap((member) => member.teams))].sort();
  const statuses = [...new Set([...state.members.map((member) => member.status), ...(status ? [status] : [])])].sort();

  return (
    <section aria-label="Organization members" className="flex min-h-0 flex-1 flex-col gap-3 text-text-primary">
      <header className="shrink-0">
        <h2 className="text-base font-semibold">Members</h2>
      </header>
      <div role="group" aria-label="Member search and filters" className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 size-4 text-text-muted" />
          <input
            type="search"
            aria-label="Search members"
            placeholder="Search by name or email"
            maxLength={120}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
              setState({ members: [], loading: true, error: "" });
            }}
            className="w-full rounded-md border border-border-strong bg-surface py-2 pl-9 pr-3 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <label className="text-xs text-text-secondary">
          <span className="sr-only">Status</span>
          <select
            aria-label="Filter by status"
            className={selectClass}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-text-secondary">
          <span className="sr-only">Membership</span>
          <select
            aria-label="Filter by membership"
            className={selectClass}
            value={membership}
            onChange={(event) => {
              setMembership(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All members</option>
            <option value="owner">Owners</option>
            <option value="member">Non-owners</option>
          </select>
        </label>
        <label className="text-xs text-text-secondary">
          <span className="sr-only">Team</span>
          <select
            aria-label="Filter by team"
            className={selectClass}
            value={team}
            onChange={(event) => {
              setTeam(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All teams</option>
            {[...new Set([...teams, ...(team ? [team] : [])])].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {(status || membership || team) && (
          <button
            type="button"
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-brand focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => {
              setStatus("");
              setMembership("");
              setTeam("");
              setPage(1);
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {state.loading ? (
        <p role="status" className="flex items-center gap-2 py-6 text-sm text-text-secondary">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          Loading members...
        </p>
      ) : state.error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-error/20 bg-error/5 p-4 text-sm text-error"
        >
          <p>{state.error}</p>
          <button
            type="button"
            className="cursor-pointer rounded-md px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => {
              setState({ members: [], loading: true, error: "" });
              setReload((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div
            role="region"
            aria-label="Members table scroll area"
            tabIndex={0}
            className="min-h-0 flex-1 overflow-auto focus-visible:outline-2 focus-visible:outline-brand"
          >
            <table aria-label="Organization members" className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-surface-raised text-xs text-text-secondary">
                <tr>
                  {columns.map(({ label, field }) => (
                    <th
                      key={field}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 font-semibold"
                      aria-sort={sortBy === field ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    >
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-brand"
                        onClick={() => {
                          setSortBy(field);
                          setSortOrder(sortBy === field && sortOrder === "asc" ? "desc" : "asc");
                          setPage(1);
                        }}
                      >
                        {label}
                        {sortBy !== field ? (
                          <ArrowUpDown aria-hidden="true" className="size-3.5" />
                        ) : sortOrder === "asc" ? (
                          <ArrowUp aria-hidden="true" className="size-3.5" />
                        ) : (
                          <ArrowDown aria-hidden="true" className="size-3.5" />
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((member) => (
                  <tr key={member.id} className="hover:bg-surface-raised/50">
                    <th scope="row" className="px-4 py-3 font-medium">
                      {member.name || member.email}
                    </th>
                    <td className="px-4 py-3 text-text-secondary">{member.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${member.isOwner ? "bg-brand-muted text-brand" : "bg-surface-raised text-text-secondary"}`}
                      >
                        {member.isOwner ? "Owner" : "Member"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{member.status}</td>
                    <td className="px-4 py-3 text-text-secondary">{member.teams.join(", ") || "None"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-text-secondary">
                      {search.trim()
                        ? "No members match your search."
                        : status || membership || team
                          ? "No members match your filters."
                          : "No members in this organization."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="shrink-0 border-t border-border">
            <Pagination
              ariaLabel="Members pagination"
              page={currentPage}
              pageSize={pageSize}
              total={sorted.length}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
