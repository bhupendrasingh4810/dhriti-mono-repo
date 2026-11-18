"use client";

import { ArrowDownUp, ChevronLeft, ChevronRight, Search, Trash2, UserPlus } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  DhritiBreadcrumb,
  DhritiButton,
  DhritiEmailField,
  DhritiSelectMenu,
  DhritiTextField,
  Dialog,
} from "@dhriti/ui";
import { ToastContainer, useToast } from "@/components/shared/Toast";
import { controlOrganizationService, type ControlOrganizationMember } from "@/services/control.service";
import { organizationManagementService } from "@/services/organization-management.service";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  teams: string[];
  joinedAt: string;
  status: "Active" | "Inactive" | "Pending";
};
type SortField = "name" | "joinedAt";
type FilterName = "status" | "role" | "team" | "pageSize";

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
  const [roleFilter, setRoleFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [openFilter, setOpenFilter] = useState<FilterName | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [members, setMembers] = useState<Employee[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberNameError, setNewMemberNameError] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberEmailError, setNewMemberEmailError] = useState("");

  const refreshMembers = async () => {
    try {
      const result = await controlOrganizationService.listMembers(organizationSlug);
      setMembers(result.map(toEmployee));
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to load members", "error");
    }
  };
  const loadMembers = useEffectEvent(refreshMembers);

  useEffect(() => {
    void Promise.resolve().then(loadMembers);
  }, [organizationSlug]);

  const closeAddMember = () => {
    if (isSaving) return;
    setIsAddMemberOpen(false);
    setNewMemberName("");
    setNewMemberNameError("");
    setNewMemberEmail("");
    setNewMemberEmailError("");
  };

  const handleAddMember = async () => {
    const name = newMemberName.trim();
    const email = newMemberEmail.trim();
    if (!name) {
      setNewMemberNameError("Name is required.");
      return;
    }
    if (name.length > 120) {
      setNewMemberNameError("Name must be 120 characters or fewer.");
      return;
    }
    if (!email) {
      setNewMemberEmailError("Email is required.");
      return;
    }
    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewMemberEmailError("Enter a valid email address.");
      return;
    }

    setIsSaving(true);
    try {
      await organizationManagementService.addMember(organizationSlug, { name, email, role: "EMPLOYEE" });
      setIsAddMemberOpen(false);
      setNewMemberName("");
      setNewMemberNameError("");
      setNewMemberEmail("");
      setNewMemberEmailError("");
      addToast("Member added to the organization", "success");
      await refreshMembers();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to add member", "error");
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
      await refreshMembers();
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
          (!statusFilter || member.status === statusFilter) &&
          (!roleFilter || member.role === roleFilter) &&
          (!teamFilter ||
            (teamFilter === "__no_team__" ? member.teams.length === 0 : member.teams.includes(teamFilter))),
      )
      .sort((first, second) => {
        const firstValue = sortField === "name" ? first.name : first.joinedAt;
        const secondValue = sortField === "name" ? second.name : second.joinedAt;
        const comparison = firstValue.localeCompare(secondValue);
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [members, search, statusFilter, roleFilter, teamFilter, sortField, sortOrder]);
  const roleOptions = useMemo(
    () => [...new Set(members.map((member) => member.role))].sort().map((role) => ({ value: role, label: role })),
    [members],
  );
  const teamOptions = useMemo(() => {
    const teams = [...new Set(members.flatMap((member) => member.teams))].sort();
    return [{ value: "__no_team__", label: "No team" }, ...teams.map((team) => ({ value: team, label: team }))];
  }, [members]);

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
    <>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <DhritiBreadcrumb
          variant="plain"
          size="sm"
          items={[
            { label: "Control", href: `/${organizationSlug}/control/org/dashboard` },
            { label: "Organization", href: `/${organizationSlug}/control/org/settings` },
            { label: "Workforce" },
          ]}
          renderLink={(item, className) => (
            <Link href={item.href} className={className}>
              {item.label}
            </Link>
          )}
        />
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Workforce</h1>
            <p className="mt-1 text-sm text-text-secondary">Organization members and their current access status.</p>
          </div>
          <DhritiButton disabled={isSaving} onClick={() => setIsAddMemberOpen(true)} startIcon={<UserPlus size={16} />}>
            Add Member
          </DhritiButton>
        </header>

        <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DhritiTextField
            label="Search workforce"
            showLabel={false}
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search users..."
            startIcon={<Search size={16} />}
            clearable
          />
          <DhritiSelectMenu
            label="Filter by status"
            showLabel={false}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value === "Active" || value === "Pending" || value === "Inactive" ? value : "");
              setPage(1);
            }}
            options={[
              { value: "", label: "All statuses" },
              { value: "Active", label: "Active" },
              { value: "Pending", label: "Pending" },
              { value: "Inactive", label: "Inactive" },
            ]}
            open={openFilter === "status"}
            onOpenChange={(open) => setOpenFilter(open ? "status" : null)}
          />
          <DhritiSelectMenu
            label="Filter by role"
            showLabel={false}
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value ?? "");
              setPage(1);
            }}
            options={[{ value: "", label: "All roles" }, ...roleOptions]}
            open={openFilter === "role"}
            onOpenChange={(open) => setOpenFilter(open ? "role" : null)}
          />
          <DhritiSelectMenu
            label="Filter by team"
            showLabel={false}
            value={teamFilter}
            onChange={(value) => {
              setTeamFilter(value ?? "");
              setPage(1);
            }}
            options={[{ value: "", label: "All teams" }, ...teamOptions]}
            open={openFilter === "team"}
            onOpenChange={(open) => setOpenFilter(open ? "team" : null)}
          />
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-surface-raised text-xs font-semibold uppercase tracking-wide text-text-muted">
                <tr>
                  <SortableHeading
                    label="Staff member"
                    active={sortField === "name"}
                    onClick={() => toggleSort("name")}
                  />
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Teams</th>
                  <SortableHeading
                    label="Joined"
                    active={sortField === "joinedAt"}
                    onClick={() => toggleSort("joinedAt")}
                  />
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
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
                    <td className="px-4 py-3 text-sm text-text-secondary">{member.teams.join(", ") || "No team"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                      {formatDate(member.joinedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DhritiButton
                        disabled={isSaving || member.role === "Owner"}
                        onClick={() => void handleRemove(member)}
                        variant="danger"
                        size="sm"
                        startIcon={<Trash2 aria-hidden="true" size={16} />}
                        className="!min-h-0 !border-0 !p-2"
                        aria-label={`Remove ${member.name}`}
                        title={`Remove ${member.name}`}
                      />
                    </td>
                  </tr>
                ))}
                {!visibleMembers.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-muted">
                      No workforce members found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-4 py-2 text-xs text-text-secondary">
            <div className="w-36">
              <DhritiSelectMenu
                label="Rows per page"
                showLabel={false}
                size="sm"
                value={String(pageSize)}
                onChange={(value) => {
                  if (value) setPageSize(Number(value));
                  setPage(1);
                }}
                options={[10, 25, 50].map((size) => ({ value: String(size), label: String(size) }))}
                open={openFilter === "pageSize"}
                onOpenChange={(open) => setOpenFilter(open ? "pageSize" : null)}
              />
            </div>
            <span>
              {rangeStart}-{rangeEnd} of {filteredMembers.length}
            </span>
            <DhritiButton
              variant="secondary"
              size="sm"
              disabled={activePage === 1}
              onClick={() => setPage((current) => current - 1)}
              className="!min-h-0 !p-1"
              aria-label="Previous page"
            >
              <ChevronLeft aria-hidden="true" size={16} />
            </DhritiButton>
            <DhritiButton
              variant="secondary"
              size="sm"
              disabled={activePage === totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="!min-h-0 !p-1"
              aria-label="Next page"
            >
              <ChevronRight aria-hidden="true" size={16} />
            </DhritiButton>
          </footer>
        </section>
      </div>
      <Dialog
        open={isAddMemberOpen}
        onClose={closeAddMember}
        title="Add Member"
        secondaryActionLabel=""
        fullScreenOnMobile
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleAddMember();
          }}
          className="space-y-5"
        >
          <DhritiTextField
            label="Full name"
            required
            value={newMemberName}
            onChange={(value) => {
              setNewMemberName(value);
              if (newMemberNameError) setNewMemberNameError("");
            }}
            onBlur={() => {
              if (!newMemberName.trim()) setNewMemberNameError("Name is required.");
            }}
            error={newMemberNameError}
            maxLength={120}
            autoComplete="name"
          />
          <DhritiEmailField
            label="Email address"
            required
            value={newMemberEmail}
            onChange={(value) => {
              setNewMemberEmail(value);
              if (newMemberEmailError) setNewMemberEmailError("");
            }}
            onBlur={() => {
              if (newMemberEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail.trim())) {
                setNewMemberEmailError("Enter a valid email address.");
              }
            }}
            error={newMemberEmailError}
            helperText="New email addresses get an account and temporary password by email. Existing accounts are added without changing their login."
            maxLength={320}
            autoComplete="email"
          />
          <div className="flex justify-end gap-2">
            <DhritiButton type="button" variant="secondary" disabled={isSaving} onClick={closeAddMember}>
              Cancel
            </DhritiButton>
            <DhritiButton type="submit" loading={isSaving} startIcon={<UserPlus size={16} />}>
              Add Member
            </DhritiButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function SortableHeading({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="px-4 py-3">
      <DhritiButton
        variant="secondary"
        size="sm"
        onClick={onClick}
        className="!min-h-0 !gap-1 !border-0 !bg-transparent !p-0 !text-text-muted !shadow-none hover:!bg-transparent hover:!text-text-primary"
      >
        {label}
        <ArrowDownUp aria-hidden="true" size={13} className={active ? "text-brand" : ""} />
      </DhritiButton>
    </th>
  );
}

function StatusBadge({ status }: { status: Employee["status"] }) {
  const tone =
    status === "Active"
      ? "bg-brand-muted text-brand"
      : status === "Pending"
        ? "bg-surface-raised text-text-secondary"
        : "bg-surface-raised text-text-muted";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function toEmployee(member: ControlOrganizationMember): Employee {
  const statusByApiValue: Record<string, Employee["status"]> = {
    ACTIVE: "Active",
    INVITED: "Pending",
    PENDING: "Pending",
  };
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.isOwner ? "Owner" : member.role,
    teams: member.teams,
    joinedAt: member.joinedAt,
    status: statusByApiValue[member.status] ?? "Inactive",
  };
}
