"use client";

import { useEffect, useState } from "react";
import { Inbox, RefreshCw, Send } from "lucide-react";
import { notesService, type NoteAccessRequest, type NoteAccessRole } from "@/services/notes.service";
import { withRefreshFeedback } from "@/lib/refresh-feedback";

interface NotesRequestsPanelProps {
  organizationId: string;
  userId: string;
  onChanged: () => Promise<void>;
  onRequestsLoaded: (requests: NoteAccessRequest[]) => void;
}

export function countIncomingRequests(requests: NoteAccessRequest[], userId: string): number {
  return requests.filter(
    (request) =>
      request.userId !== userId &&
      request.status === "PENDING" &&
      (request.note.ownerId === userId || request.note.permissions.some((permission) => permission.userId === userId)),
  ).length;
}

export function NotesRequestsEmptyState({ incoming }: { incoming: boolean }) {
  const Icon = incoming ? Inbox : Send;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-background p-6 text-center">
      <Icon aria-hidden="true" size={32} className="text-text-muted" />
      <p className="font-medium">{incoming ? "No incoming requests" : "No requests sent"}</p>
      <p className="text-sm text-text-secondary">
        {incoming
          ? "Requests for access to your notes will appear here."
          : "Your requests for note access will appear here."}
      </p>
    </div>
  );
}

export function NotesRequestRow({
  request,
  incoming,
  busy,
  onReview,
}: {
  request: NoteAccessRequest;
  incoming: boolean;
  busy: boolean;
  onReview: (status: "APPROVED" | "REJECTED", role: NoteAccessRole) => void;
}) {
  const [role, setRole] = useState<NoteAccessRole>(request.requestedRole);
  return (
    <article className="rounded-lg border border-border bg-background p-4">
      <h4 className="break-words font-semibold">{request.note.title}</h4>
      <p className="mt-1 text-sm text-text-secondary">
        {incoming ? request.user.name : "You"} requested {request.requestedRole === "OWNER" ? "co-owner" : "edit"}{" "}
        access.
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        {request.status === "PENDING"
          ? "Pending"
          : request.status === "APPROVED"
            ? `Approved: ${request.grantedRole === "OWNER" ? "co-owner" : "edit"} access`
            : "Rejected"}
      </p>
      {incoming && request.status === "PENDING" ? (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Permission to grant
            <select
              value={role}
              disabled={busy}
              onChange={(event) => setRole(event.target.value === "OWNER" ? "OWNER" : "EDIT")}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="EDIT">Edit access</option>
              <option value="OWNER">Co-owner access</option>
            </select>
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReview("APPROVED", role)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReview("REJECTED", role)}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-error hover:bg-surface-raised disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function NotesRequestsPanel({ organizationId, userId, onChanged, onRequestsLoaded }: NotesRequestsPanelProps) {
  const [requests, setRequests] = useState<NoteAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    void withRefreshFeedback(notesService.listRequests(organizationId))
      .then((next) => {
        if (active) {
          setRequests(next);
          onRequestsLoaded(next);
          setError("");
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load requests.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, revision, onRequestsLoaded]);

  async function review(requestId: string, status: "APPROVED" | "REJECTED", role: NoteAccessRole) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await notesService.reviewRequest(organizationId, requestId, status, role);
      const next = await notesService.listRequests(organizationId);
      setRequests(next);
      onRequestsLoaded(next);
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to review request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Refresh requests"
          aria-busy={loading}
          title="Refresh requests"
          disabled={loading || busy}
          onClick={() => {
            setLoading(true);
            setRevision((value) => value + 1);
          }}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-brand hover:bg-surface-raised disabled:cursor-wait"
        >
          <RefreshCw
            size={18}
            strokeWidth={2.5}
            aria-hidden="true"
            className={loading ? "motion-safe:animate-spin" : ""}
          />
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p role="status" className="text-sm text-text-secondary">
          Loading requests...
        </p>
      ) : (
        <>
          {busy ? (
            <p role="status" className="text-sm text-text-secondary">
              Submitting decision...
            </p>
          ) : null}
          <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2">
            {[
              { title: "Incoming requests", incoming: true },
              { title: "Your requests", incoming: false },
            ].map(({ title, incoming }) => {
              const entries = requests.filter((request) =>
                incoming ? request.userId !== userId : request.userId === userId,
              );
              return (
                <section key={title} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4">
                  <h3 className="font-semibold">{title}</h3>
                  {!error && entries.length === 0 ? <NotesRequestsEmptyState incoming={incoming} /> : null}
                  {entries.map((request) => (
                    <NotesRequestRow
                      key={`${request.id}:${request.requestedRole}:${request.status}`}
                      request={request}
                      incoming={incoming}
                      busy={busy}
                      onReview={(status, role) => void review(request.id, status, role)}
                    />
                  ))}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
