"use client";

import { useEffect, useState } from "react";
import { Dialog, DhritiButton } from "@dhriti/ui";
import { controlPlatformService, type SecurityEventDetail } from "@/services/control.service";

export function SecurityEventDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<SecurityEventDetail | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void controlPlatformService
      .securityEvent(id)
      .then((value) => {
        if (active) {
          setDetail(value);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load event details");
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  return (
    <Dialog open title="Security event details" onClose={onClose} secondaryActionLabel="Close">
      {error ? (
        <div role="alert" className="text-sm text-error">
          {error}
          <DhritiButton variant="secondary" onClick={() => setAttempt((value) => value + 1)}>
            Retry details
          </DhritiButton>
        </div>
      ) : !detail ? (
        <p role="status">Loading event details...</p>
      ) : (
        <>
          <p className="text-sm text-text-primary">{detail.event.description}</p>
          <dl className="grid grid-cols-2 gap-2 break-all text-sm text-text-secondary">
            <dt>Event ID</dt>
            <dd>{detail.event.id}</dd>
            <dt>Source</dt>
            <dd>{detail.event.source}</dd>
            <dt>Provider event ID</dt>
            <dd>{detail.event.externalId ?? "Not supplied"}</dd>
            <dt>Severity</dt>
            <dd>{detail.event.severity}</dd>
            <dt>IP address</dt>
            <dd>{detail.event.ipAddress ?? "Unavailable"}</dd>
            <dt>Status</dt>
            <dd>{detail.event.resolvedAt ? "Resolved" : "Open"}</dd>
          </dl>
          <h3 className="mt-3 text-sm font-semibold text-text-primary">Event timeline</h3>
          {detail.hasMoreTimeline && (
            <p className="text-sm text-text-secondary">Showing the most recent 100 actions.</p>
          )}
          <ol className="max-h-64 space-y-3 overflow-y-auto text-sm text-text-secondary">
            <li>Detected: {new Date(detail.event.createdAt).toLocaleString()}</li>
            {detail.timeline.map((item) => (
              <li key={item.id} className="break-all">
                {item.action} - {new Date(item.createdAt).toLocaleString()}
                {item.actorUserId && <p>Operator: {item.actorUserId}</p>}
                {typeof item.metadata?.reason === "string" && <p>Reason: {item.metadata.reason}</p>}
              </li>
            ))}
          </ol>
        </>
      )}
    </Dialog>
  );
}
