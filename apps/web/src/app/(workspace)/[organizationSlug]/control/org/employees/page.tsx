"use client";

import { ArrowDownUp, ChevronLeft, ChevronRight, Search, Trash2, UserPlus } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { ToastContainer, useToast } from "@/components/shared/Toast";
import { controlOrganizationService, type ControlOrganizationMember } from "@/services/control.service";
import { invitationsService } from "@/services/organization-management.service";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  teams: string;
  joinedAt: string;
  status: "Active" | "Inactive" | "Pending";
};
type SortField = "name" | "joinedAt";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default function EmployeePage() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const { toasts, addToast, removeToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Employee["status"]>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [members, setMembers] = useState<Employee[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadMembers = useEffectEvent(async () => {
    try {
      const result = await controlOrganizationService.listMembers(organizationSlug);
      setMembers(result.map(toEmployee));
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to load members", "error");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(loadMembers);
  }, [organizationSlug]);

  const handleInvite = async () => {
    const email = window.prompt("Enter the member email address");
    if (!email?.trim()) return;
    setIsSaving(true);
    try {
      await invitationsService.create(organizationSlug, { email: email.trim() });
      addToast(`Invitation sent to ${email.trim()}`, "success");
      await loadMembers();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to invite member", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (member: Employee) => {
    if (!window.confirm(`Remove ${member.name} from this organization?`)) return;
    setIsSaving(true);
    try {
      await controlOrganizationService.removeMember(organizationSlug, member.id);
      addToast(`${member.name} removed`, "warning");
      await loadMembers();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to remove member", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return members
      .filter(
        (member) =>
          (!normalizedSearch || `${member.name} ${member.email}`.toLowerCase().includes(normalizedSearch)) &&
          (!statusFilter || member.status === statusFilter),
      )
      .sort((first, second) => {
        const firstValue = sortField === "name" ? first.name : first.joinedAt;
        const secondValue = sortField === "name" ? second.name : second.joinedAt;
        const comparison = firstValue.localeCompare(secondValue);
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [members, search, statusFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const activePage = Math.min(page, totalPages);
  const visibleMembers = filteredMembers.slice((activePage - 1) * pageSize, activePage * pageSize);
  const rangeStart = filteredMembers.length ? (activePage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(activePage * pageSize, filteredMembers.length);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="flex shrink-0 items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Workforce</h1>
          <p className="mt-1 text-sm text-text-secondary">Organization members and their current access status.</p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleInvite()}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus aria-hidden="true" size={16} />
          Invite member
        </button>
      </header>

      <div className="flex shrink-0 flex-col justify-between gap-3 sm:flex-row">
        <label className="relative w-full max-w-xl">
          <span className="sr-only">Search workforce</span>
          <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search users..."
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "" | Employee["status"]);
              setPage(1);
            }}
            className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface-raised text-xs font-semibold uppercase tracking-wide text-text-muted">
              <tr>
                <SortableHeading label="Staff member" active={sortField === "name"} onClick={() => toggleSort("name")} />
                <th className="px-4 py-3">Access group</th>
                <th className="px-4 py-3">Teams</th>
                <SortableHeading label="Joined" active={sortField === "joinedAt"} onClick={() => toggleSort("joinedAt")} />
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleMembers.map((member) => (
                <tr key={member.id} className="hover:bg-surface-raised">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
                        {initials(member.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">{member.name}</p>
                        <p className="truncate text-xs text-text-muted">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{member.role}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{member.teams}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">{formatDate(member.joinedAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={isSaving || member.role === "Owner"}
                      onClick={() => void handleRemove(member)}
                      className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove ${member.name}`}
                      title={`Remove ${member.name}`}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!visibleMembers.length ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">No workforce members found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-4 py-2 text-xs text-text-secondary">
          <label className="flex items-center gap-2">
            Rows per page:
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="cursor-pointer bg-surface text-text-primary outline-none"
            >
              {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <span>{rangeStart}-{rangeEnd} of {filteredMembers.length}</span>
          <button type="button" disabled={activePage === 1} onClick={() => setPage((current) => current - 1)} className="cursor-pointer p-1 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">
            <ChevronLeft aria-hidden="true" size={16} />
          </button>
          <button type="button" disabled={activePage === totalPages} onClick={() => setPage((current) => current + 1)} className="cursor-pointer p-1 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </footer>
      </section>
    </div>
  );
}

function SortableHeading({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-4 py-3">
      <button type="button" onClick={onClick} className="inline-flex cursor-pointer items-center gap-1 hover:text-text-primary">
        {label}<ArrowDownUp aria-hidden="true" size={13} className={active ? "text-brand" : ""} />
      </button>
    </th>
  );
}

function StatusBadge({ status }: { status: Employee["status"] }) {
  const tone = status === "Active" ? "bg-brand-muted text-brand" : status === "Pending" ? "bg-surface-raised text-text-secondary" : "bg-surface-raised text-text-muted";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function toEmployee(member: ControlOrganizationMember): Employee {
  const statusByApiValue: Record<string, Employee["status"]> = { ACTIVE: "Active", INVITED: "Pending", PENDING: "Pending" };
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.isOwner ? "Owner" : member.role,
    teams: member.teams.join(", ") || "No team",
    joinedAt: member.joinedAt,
    status: statusByApiValue[member.status] ?? "Inactive",
  };
}
