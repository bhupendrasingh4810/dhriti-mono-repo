"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, RefreshCw, X } from "lucide-react";
import { io } from "socket.io-client";
import { notificationsService, type InboxNotification } from "@/services/notifications.service";
import { NotificationsSkeleton } from "./NotificationsSkeleton";
import { NotificationItem } from "./NotificationItem";
import { groupNotifications } from "./notification-presentation";
import { withRefreshFeedback } from "@/lib/refresh-feedback";

export function NotificationInbox({
  organizationId,
  organizationSlug,
  fullPage = false,
  unreadOnly = false,
}: {
  organizationId: string;
  organizationSlug: string;
  fullPage?: boolean;
  unreadOnly?: boolean;
}) {
  const [open, setOpen] = useState(fullPage);
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [unseen, setUnseen] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRefreshes, setPendingRefreshes] = useState(0);
  const [error, setError] = useState("");
  const [liveError, setLiveError] = useState("");
  const [alert, setAlert] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const openRef = useRef(fullPage);
  const requestVersion = useRef(0);
  const mounted = useRef(true);
  const pageDepth = useRef(1);

  async function refresh(nextCursor?: string) {
    const version = ++requestVersion.current;
    setPendingRefreshes((count) => count + 1);
    const feedback = withRefreshFeedback(Promise.resolve());
    try {
      const page = await notificationsService.list(organizationId, { limit: 30, cursor: nextCursor, unreadOnly });
      if (!mounted.current || version !== requestVersion.current) return;
      const loaded = [...page.notifications];
      let next = page.nextCursor;
      if (!nextCursor) {
        for (let depth = 1; depth < pageDepth.current && next; depth++) {
          const older = await notificationsService.list(organizationId, { limit: 30, cursor: next, unreadOnly });
          if (!mounted.current || version !== requestVersion.current) return;
          loaded.push(...older.notifications);
          next = older.nextCursor;
        }
      }
      if (nextCursor) pageDepth.current++;
      setItems((current) =>
        nextCursor ? [...current, ...loaded.filter((item) => !current.some((old) => old.id === item.id))] : loaded,
      );
      setCursor(next);
      setUnread(page.unreadCount);
      setUnseen(page.unseenCount);
      setError("");
      const unseenItems = loaded.filter((item) => !item.isSeen);
      if (openRef.current && unseenItems.length) {
        for (let offset = 0; offset < unseenItems.length; offset += 200) {
          await notificationsService.markSeen(
            organizationId,
            unseenItems.slice(offset, offset + 200).map((item) => item.id),
          );
        }
        if (mounted.current && version === requestVersion.current)
          setUnseen(Math.max(0, page.unseenCount - unseenItems.length));
        window.dispatchEvent(new Event("notifications:seen-updated"));
      }
    } catch (reason) {
      if (mounted.current && version === requestVersion.current)
        setError(reason instanceof Error ? reason.message : "Unable to load notifications.");
    } finally {
      await feedback;
      if (mounted.current) setPendingRefreshes((count) => count - 1);
      if (mounted.current && version === requestVersion.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void refresh();
    });
    const interval = setInterval(() => void refresh(), 30000);
    const visibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", visibility);
    const inboxUpdated = () => void refresh();
    window.addEventListener("notifications:inbox-updated", inboxUpdated);
    window.addEventListener("notifications:live-update", inboxUpdated);
    if (!fullPage) window.addEventListener("notifications:seen-updated", inboxUpdated);
    let socket: ReturnType<typeof io> | undefined;
    const connect = () => {
      void fetch("/api/connect/socket", { method: "POST", cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Unable to authenticate live notifications.");
          const credentials: { token: string; url: string } = await response.json();
          if (!active) return;
          const url = new URL(credentials.url, window.location.origin);
          url.pathname = "/notifications";
          socket?.removeAllListeners();
          socket?.disconnect();
          socket = io(url.toString(), { auth: { token: credentials.token } });
          socket.on("connect", () => {
            setLiveError("");
            void refresh();
          });
          socket.on("notifications:changed", () => {
            setAlert("You have a new notification.");
            window.dispatchEvent(new Event("notifications:live-update"));
          });
          socket.on("connect_error", () =>
            setLiveError("Live updates unavailable. Your inbox refreshes automatically."),
          );
          socket.on("disconnect", () => setLiveError("Reconnecting live updates. Your inbox refreshes automatically."));
        })
        .catch((reason) => {
          if (active) setLiveError(reason instanceof Error ? reason.message : "Live updates unavailable.");
        });
    };
    if (!fullPage) connect();
    const renewal = !fullPage ? setInterval(connect, 5 * 60 * 1000) : undefined;
    return () => {
      active = false;
      mounted.current = false;
      clearInterval(interval);
      clearInterval(renewal);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("notifications:inbox-updated", inboxUpdated);
      window.removeEventListener("notifications:live-update", inboxUpdated);
      window.removeEventListener("notifications:seen-updated", inboxUpdated);
      socket?.removeAllListeners();
      socket?.disconnect();
    };
    // This inbox is remounted for every user/organization identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, fullPage, unreadOnly]);

  useEffect(() => {
    if (!open || fullPage) return;
    const close = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        openRef.current = false;
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        openRef.current = false;
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open, fullPage]);

  async function markRead(item: InboxNotification) {
    try {
      await notificationsService.markRead(organizationId, item.id);
      setItems((current) =>
        current
          .map((entry) => (entry.id === item.id ? { ...entry, isRead: true, isSeen: true } : entry))
          .filter((entry) => !unreadOnly || !entry.isRead),
      );
      window.dispatchEvent(new Event("notifications:inbox-updated"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to mark notification read.");
    }
  }

  return (
    <div ref={container} className="relative">
      {!fullPage ? (
        <button
          ref={trigger}
          type="button"
          aria-label={`Notifications, ${unread} unread, ${unseen} unseen`}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => {
            openRef.current = !open;
            setOpen(!open);
            setAlert("");
            if (!open) void refresh();
          }}
          className="relative grid size-9 place-items-center rounded-lg text-text-secondary hover:bg-surface-raised"
        >
          <Bell size={20} aria-hidden="true" />
          {unseen > 0 ? (
            <span
              aria-hidden="true"
              data-testid="notification-count-badge"
              className="absolute -right-0.5 -top-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold leading-none tabular-nums text-text-inverse"
            >
              {unseen > 9 ? "9+" : unseen}
            </span>
          ) : null}
        </button>
      ) : null}
      {alert && !open ? (
        <p role="status" className="sr-only">
          {alert}
        </p>
      ) : null}
      {open ? (
        <section
          id={panelId}
          aria-label="Notification history"
          className={
            fullPage
              ? "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              : "fixed inset-x-4 top-16 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-md"
          }
        >
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="flex flex-1 items-center gap-2 font-semibold text-text-primary">
              {fullPage ? (unreadOnly ? "Unread activity" : "All activity") : "Notifications"}
              {unread > 0 ? (
                <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand">
                  {unread} unread
                </span>
              ) : (
                <span className="sr-only">(0 unread)</span>
              )}
            </h2>
            <button
              type="button"
              aria-label="Refresh notifications"
              aria-busy={loading || pendingRefreshes > 0}
              disabled={loading || pendingRefreshes > 0}
              onClick={() => void refresh()}
              className="rounded-md p-1 text-brand hover:bg-surface-raised disabled:cursor-wait"
            >
              <RefreshCw
                size={16}
                strokeWidth={2.5}
                aria-hidden="true"
                className={loading || pendingRefreshes > 0 ? "motion-safe:animate-spin" : ""}
              />
            </button>
            {!fullPage ? (
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => {
                  openRef.current = false;
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className="rounded-md p-1 text-text-secondary hover:bg-surface-raised"
              >
                <X size={16} />
              </button>
            ) : null}
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {error ? (
              <p role="alert" className="mx-4 mt-3 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
                {error}
              </p>
            ) : null}
            {liveError ? (
              <p role="status" className="mx-4 mt-3 text-xs text-text-secondary">
                {liveError}
              </p>
            ) : null}
            {loading && !items.length ? <NotificationsSkeleton /> : null}
            {!loading && !error && !items.length ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span
                  aria-hidden="true"
                  className="grid size-12 place-items-center rounded-full bg-brand-muted text-brand"
                >
                  {unreadOnly ? <CheckCheck size={22} /> : <BellOff size={22} />}
                </span>
                <p className="mt-3 text-sm font-semibold text-text-primary">
                  {unreadOnly ? "You're all caught up" : "No notifications yet"}
                </p>
                <p className="mt-1 max-w-xs text-sm text-text-secondary">
                  {unreadOnly
                    ? "No unread notifications. New activity across your apps will appear here."
                    : "Mentions, shares, requests and updates from your apps will show up here."}
                </p>
              </div>
            ) : null}
            {groupNotifications(items).map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h3 className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {group.label}
                </h3>
                <ul className="divide-y divide-border">
                  {group.items.map((item) => (
                    <NotificationItem
                      key={item.id}
                      item={item}
                      organizationSlug={organizationSlug}
                      onOpen={(opened) => {
                        void markRead(opened);
                        openRef.current = false;
                        setOpen(false);
                      }}
                      onMarkRead={(target) => void markRead(target)}
                    />
                  ))}
                </ul>
              </section>
            ))}
            {cursor ? (
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => void refresh(cursor)}
                  className="w-full cursor-pointer rounded-md p-2 text-sm font-medium text-brand hover:bg-surface-raised"
                >
                  Load older notifications
                </button>
              </div>
            ) : null}
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-border bg-surface-raised/60 px-4 py-2.5 text-sm font-medium text-brand">
            <button
              type="button"
              disabled={!unread}
              className="inline-flex cursor-pointer items-center gap-1.5 disabled:cursor-not-allowed disabled:text-text-muted"
              onClick={() => {
                void notificationsService
                  .markAllRead(organizationId)
                  .then(() => {
                    setItems((current) => current.map((item) => ({ ...item, isRead: true, isSeen: true })));
                    if (unreadOnly) setItems([]);
                    window.dispatchEvent(new Event("notifications:inbox-updated"));
                  })
                  .catch((reason) =>
                    setError(reason instanceof Error ? reason.message : "Unable to mark notifications read."),
                  );
              }}
            >
              <CheckCheck size={16} aria-hidden="true" />
              Mark all read
            </button>
            {!fullPage ? (
              <Link
                href={`/${organizationSlug}/notifications`}
                onClick={() => {
                  openRef.current = false;
                  setOpen(false);
                }}
              >
                View all
              </Link>
            ) : null}
            <Link href={`/${organizationSlug}/settings/notifications`}>Settings</Link>
          </footer>
        </section>
      ) : null}
    </div>
  );
}
