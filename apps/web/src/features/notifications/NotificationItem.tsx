import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import type { InboxNotification } from "@/services/notifications.service";
import { TONE_CLASSES, formatRelativeTime, notificationSource } from "./notification-presentation";

export function NotificationItem({
  item,
  organizationSlug,
  now,
  onOpen,
  onMarkRead,
}: {
  item: InboxNotification;
  organizationSlug: string;
  now?: Date;
  onOpen: (item: InboxNotification) => void;
  onMarkRead: (item: InboxNotification) => void;
}) {
  const source = notificationSource(item.type);
  const Icon = source.icon;
  const unread = !item.isRead;
  const href = item.linkUrl?.startsWith(`/${organizationSlug}/`) ? item.linkUrl : null;
  const fullTimestamp = new Date(item.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <li
      data-unread={unread || undefined}
      className={`group relative flex gap-3 px-4 py-3 transition-colors hover:bg-surface-raised ${
        unread ? "bg-brand-muted/50" : ""
      }`}
    >
      {unread ? <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-brand" /> : null}
      <span
        aria-hidden="true"
        className={`grid size-9 shrink-0 place-items-center rounded-lg ${TONE_CLASSES[source.tone]}`}
      >
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-text-secondary">{source.app}</span>
          <span aria-hidden="true" className="text-text-muted">
            ·
          </span>
          <time dateTime={item.createdAt} title={fullTimestamp} className="text-text-muted">
            {formatRelativeTime(item.createdAt, now)}
          </time>
          {unread ? (
            <span className="ml-auto flex items-center">
              <span className="sr-only">Unread</span>
              <span aria-hidden="true" className="size-2 rounded-full bg-brand" />
            </span>
          ) : null}
        </div>
        <p className={`mt-0.5 break-words text-sm text-text-primary ${unread ? "font-semibold" : "font-medium"}`}>
          {item.title}
        </p>
        {item.body ? (
          <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap break-words text-sm text-text-secondary">{item.body}</p>
        ) : null}
        {href || unread ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {href ? (
              <Link
                href={href}
                onClick={() => onOpen(item)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-brand transition-colors hover:border-brand hover:bg-brand-muted"
              >
                Open
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            ) : null}
            {unread ? (
              <button
                type="button"
                onClick={() => onMarkRead(item)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface hover:text-brand"
              >
                <Check size={14} aria-hidden="true" />
                Mark read
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
