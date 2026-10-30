"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NotificationInbox } from "./NotificationInbox";
import { NotificationsSkeleton } from "./NotificationsSkeleton";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const organization = user?.organization;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-muted text-brand">
          <Bell size={22} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Notifications</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your activity across DhritiOS. History stays here even when live alerts are off.
          </p>
        </div>
      </header>
      <div role="group" aria-label="Filter notifications" className="flex gap-2">
        {[
          { label: "All", unread: false },
          { label: "Unread", unread: true },
        ].map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={unreadOnly === filter.unread}
            onClick={() => setUnreadOnly(filter.unread)}
            className={`rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              unreadOnly === filter.unread
                ? "border-brand bg-brand-muted text-brand"
                : "border-border bg-surface text-text-secondary hover:bg-surface-raised"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      {organization ? (
        <NotificationInbox
          key={`${user.id}:${organization.id}:${unreadOnly}`}
          organizationId={organization.id}
          organizationSlug={organization.slug ?? organization.id}
          fullPage
          unreadOnly={unreadOnly}
        />
      ) : (
        <div className="rounded-lg border border-border bg-surface p-3">
          <NotificationsSkeleton />
        </div>
      )}
    </div>
  );
}
