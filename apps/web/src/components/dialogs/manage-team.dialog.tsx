"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { connectService, type ConnectOrganizationUser, type ConnectTeamDetails } from "@/services/connect.service";

type TeamDialogProps = {
  open: boolean;
  teamId: string | null;
  organizationId: string;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
  onError: (reason: unknown) => void;
};

function DialogShell({ children, onClose, titleId }: { children: ReactNode; onClose: () => void; titleId: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onMouseDown={onClose}>
      <section
        aria-modal="true"
        aria-labelledby={titleId}
        role="dialog"
        className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}

export function AddTeamMembersDialog({ open, teamId, organizationId, onClose, onUpdated, onError }: TeamDialogProps) {
  const [team, setTeam] = useState<ConnectTeamDetails | null>(null);
  const [users, setUsers] = useState<ConnectOrganizationUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !teamId) return;
    void connectService.getTeam(organizationId, teamId).then(setTeam).catch(onError);
    void connectService
      .listUsersPage(organizationId)
      .then((page) => {
        setUsers(page.users);
        setNextCursor(page.nextCursor);
      })
      .catch(onError);
  }, [open, teamId, organizationId, onError]);

  const visibleUsers = useMemo(() => {
    const memberUsers = (team?.members ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      email: "",
      avatarUrl: member.avatarUrl,
    }));
    const usersById = new Map(memberUsers.map((user) => [user.id, user]));
    for (const user of users) usersById.set(user.id, user);
    const normalizedQuery = query.trim().toLowerCase();
    return [...usersById.values()].filter(
      (user) => !normalizedQuery || `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query, team?.members, users]);

  async function loadMoreUsers() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await connectService.listUsersPage(organizationId, nextCursor);
      setUsers((current) => [
        ...current,
        ...page.users.filter((user) => !current.some((existing) => existing.id === user.id)),
      ]);
      setNextCursor(page.nextCursor);
    } catch (reason) {
      onError(reason);
    } finally {
      setLoadingMore(false);
    }
  }

  async function addMembers() {
    if (!teamId || selectedUserIds.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(selectedUserIds.map((userId) => connectService.addTeamMember(organizationId, teamId, userId)));
      await onUpdated();
      onClose();
    } catch (reason) {
      onError(reason);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <DialogShell onClose={onClose} titleId="add-team-members-title">
      <div className="flex items-start justify-between border-b border-border p-6">
        <div>
          <h2 id="add-team-members-title" className="text-lg font-bold text-text-primary">
            Add members to {team?.name ?? "team"}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">Select one or more people from your organization.</p>
        </div>
        <button
          type="button"
          aria-label="Close add members dialog"
          onClick={onClose}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-6">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-text-secondary focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people"
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
        </label>
        <div className="mt-4 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {visibleUsers.map((user) => {
            const member = team?.members.find((teamMember) => teamMember.id === user.id);
            const selected = Boolean(member) || selectedUserIds.includes(user.id);
            return (
              <label
                key={user.id}
                className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-surface-raised"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={Boolean(member)}
                  onChange={() =>
                    setSelectedUserIds((current) =>
                      current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id],
                    )
                  }
                  className="h-4 w-4 accent-brand disabled:cursor-not-allowed"
                />
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-raised text-sm font-semibold text-text-primary">
                    {user.name.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text-primary">{user.name}</span>
                  <span className="block truncate text-sm text-text-secondary">
                    {member ? "Already a team member" : "Organization member"}
                  </span>
                </span>
              </label>
            );
          })}
          {team && visibleUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">No organization members match your search.</p>
          ) : null}
        </div>
        {nextCursor ? (
          <button
            type="button"
            onClick={() => void loadMoreUsers()}
            disabled={loadingMore}
            className="mt-3 cursor-pointer text-sm font-semibold text-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-t border-border p-6">
        <span className="text-sm text-text-secondary">{selectedUserIds.length} selected</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || selectedUserIds.length === 0}
            onClick={() => void addMembers()}
            className="cursor-pointer rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add members"}
          </button>
        </div>
      </div>
    </DialogShell>
  );
}

export function ManageTeamDialog({ open, teamId, organizationId, onClose, onError }: TeamDialogProps) {
  const [team, setTeam] = useState<ConnectTeamDetails | null>(null);
  const [tab, setTab] = useState<"channels" | "members" | "analytics">("channels");
  const [memberPage, setMemberPage] = useState(0);

  useEffect(() => {
    if (!open || !teamId) return;
    void connectService.getTeam(organizationId, teamId).then(setTeam).catch(onError);
  }, [open, teamId, organizationId, onError]);

  if (!open) return null;

  const tabs = [
    { id: "channels" as const, label: "Channels" },
    { id: "members" as const, label: "Members" },
    { id: "analytics" as const, label: "Analytics" },
  ];
  const membersPerPage = 8;
  const memberPageCount = Math.max(1, Math.ceil((team?.members.length ?? 0) / membersPerPage));
  const visibleMembers = team?.members.slice(memberPage * membersPerPage, (memberPage + 1) * membersPerPage) ?? [];

  return (
    <DialogShell onClose={onClose} titleId="manage-team-title">
      <div className="flex items-start justify-between border-b border-border p-6">
        <div>
          <h2 id="manage-team-title" className="text-lg font-bold text-text-primary">
            Manage {team?.name ?? "team"}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {team?.description || "Review the team’s channels, members, and activity summary."}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close manage team dialog"
          onClick={onClose}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex border-b border-border px-6" role="tablist" aria-label="Manage team sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`cursor-pointer border-b-2 px-4 py-3 text-sm font-semibold ${tab === item.id ? "border-brand text-brand" : "border-transparent text-text-secondary hover:text-text-primary"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-72 p-6">
        {tab === "channels" ? (
          <div className="space-y-2">
            {team?.channels.map((channel) => (
              <div key={channel.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-semibold text-text-primary"># {channel.name}</span>
                <span className="text-xs text-text-secondary">{channel.visibility.toLowerCase()}</span>
              </div>
            ))}
            {team && team.channels.length === 0 ? <EmptyState label="This team has no active channels." /> : null}
          </div>
        ) : null}
        {tab === "members" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-text-secondary">
                <tr>
                  <th className="pb-3 font-semibold">Member</th>
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Joined</th>
                  <th className="pb-3 font-semibold">Location</th>
                  <th className="pb-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody>
                {visibleMembers.map((member) => (
                  <tr key={member.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-semibold text-text-primary">{member.name}</td>
                    <td className="py-3 text-text-secondary">{member.jobTitle || "—"}</td>
                    <td className="py-3 text-text-secondary">{new Date(member.joinedAt).toLocaleDateString()}</td>
                    <td className="py-3 text-text-secondary">{member.location || "—"}</td>
                    <td className="py-3 text-text-secondary">{member.role === "ADMIN" ? "Admin" : "Member"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {team && team.members.length === 0 ? <EmptyState label="This team has no members." /> : null}
            {memberPageCount > 1 ? (
              <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
                <span>
                  Page {memberPage + 1} of {memberPageCount}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={memberPage === 0}
                    onClick={() => setMemberPage((page) => page - 1)}
                    className="cursor-pointer rounded border border-border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={memberPage >= memberPageCount - 1}
                    onClick={() => setMemberPage((page) => page + 1)}
                    className="cursor-pointer rounded border border-border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {tab === "analytics" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Members" value={team?.members.length ?? 0} />
            <Metric label="Active channels" value={team?.channels.length ?? 0} />
            <Metric label="Admins" value={team?.members.filter((member) => member.role === "ADMIN").length ?? 0} />
          </div>
        ) : null}
      </div>
    </DialogShell>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-text-secondary">{label}</p>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
