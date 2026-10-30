import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { InboxNotification } from "@/services/notifications.service";
import { NotificationItem } from "./NotificationItem";
import { formatRelativeTime, groupNotifications, notificationSource } from "./notification-presentation";

const now = new Date(2026, 9, 30, 14, 30);

function notification(overrides: Partial<InboxNotification> = {}): InboxNotification {
  return {
    id: "n1",
    userId: "u1",
    actorId: null,
    sourceType: "CONNECT",
    sourceId: null,
    type: "DIRECT_MESSAGE",
    title: "New message from Asha Rao",
    body: "Can you review the Q4 plan?",
    linkUrl: "/northwind/connect/c1",
    payload: {},
    isRead: false,
    isSeen: false,
    createdAt: new Date(now.getTime() - 5 * 60_000).toISOString(),
    ...overrides,
  };
}

test("maps notification types to their app identity", () => {
  assert.equal(notificationSource("DIRECT_MESSAGE").app, "Connect");
  assert.equal(notificationSource("NOTES_ACCESS_REQUEST").app, "Notes");
  assert.equal(notificationSource("FLOW_DUE_DATE").app, "Flow");
  assert.equal(notificationSource("HRMS_PAYROLL").app, "HRMS");
  assert.equal(notificationSource("CONTROL_ROLE_CHANGE").app, "Control");
  assert.equal(notificationSource("SYSTEM").app, "Dhriti");
});

test("formats compact relative timestamps", () => {
  assert.equal(formatRelativeTime(new Date(now.getTime() - 10_000).toISOString(), now), "Just now");
  assert.equal(formatRelativeTime(new Date(now.getTime() - 5 * 60_000).toISOString(), now), "5m ago");
  assert.equal(formatRelativeTime(new Date(now.getTime() - 3 * 3_600_000).toISOString(), now), "3h ago");
  assert.equal(formatRelativeTime(new Date(now.getTime() - 2 * 86_400_000).toISOString(), now), "2d ago");
});

test("groups notifications into Today, Yesterday and Earlier", () => {
  const groups = groupNotifications(
    [
      notification({ id: "a", createdAt: new Date(2026, 9, 30, 9).toISOString() }),
      notification({ id: "b", createdAt: new Date(2026, 9, 29, 18).toISOString() }),
      notification({ id: "c", createdAt: new Date(2026, 9, 14, 2).toISOString() }),
      notification({ id: "d", createdAt: new Date(2026, 9, 10, 2).toISOString() }),
    ],
    now,
  );
  assert.deepEqual(
    groups.map((group) => [group.label, group.items.map((item) => item.id)]),
    [
      ["Today", ["a"]],
      ["Yesterday", ["b"]],
      ["Earlier", ["c", "d"]],
    ],
  );
});

test("unread row shows app icon, unread indicator and themed actions", () => {
  const html = renderToStaticMarkup(
    <NotificationItem
      item={notification()}
      organizationSlug="northwind"
      now={now}
      onOpen={() => undefined}
      onMarkRead={() => undefined}
    />,
  );
  assert.match(html, /data-unread="true"/);
  assert.match(html, /bg-info\/10 text-info/);
  assert.match(html, />Connect</);
  assert.match(html, />5m ago</);
  assert.match(html, /class="sr-only">Unread/);
  assert.match(html, /href="\/northwind\/connect\/c1"/);
  assert.match(html, /Mark read/);
  assert.match(html, /line-clamp-2/);
  assert.doesNotMatch(html, /#[0-9a-f]{3,6}\b/i);
});

test("read row hides unread affordances and ignores foreign links", () => {
  const html = renderToStaticMarkup(
    <NotificationItem
      item={notification({ isRead: true, linkUrl: "https://example.com" })}
      organizationSlug="northwind"
      now={now}
      onOpen={() => undefined}
      onMarkRead={() => undefined}
    />,
  );
  assert.doesNotMatch(html, /data-unread|Unread|Mark read|<a /);
});
