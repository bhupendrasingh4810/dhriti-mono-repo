import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { NotificationInbox } from "./NotificationInbox";
import { NotificationsSkeleton } from "./NotificationsSkeleton";
import { NotesRequestsPanel } from "../notes/components/NotesRequestsPanel";

const organization = { organizationId: "organization", organizationSlug: "northwind" };

test("dedicated inbox renders immediately in normal page flow, without a dropdown trigger or close action", () => {
  const html = renderToStaticMarkup(<NotificationInbox {...organization} fullPage />);
  assert.match(html, /aria-label="Notification history"/);
  assert.match(html, /All activity/);
  assert.match(html, /Loading notifications/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /motion-safe:animate-pulse/);
  assert.doesNotMatch(html, /No notifications yet|No unread notifications/);
  assert.match(html, /Refresh notifications/);
  assert.match(html, /Mark all read/);
  assert.match(html, /href="\/northwind\/settings\/notifications"/);
  assert.doesNotMatch(html, /Close notifications|aria-expanded|fixed inset|View all/);
});

test("unread inbox has its own accessible heading", () => {
  const html = renderToStaticMarkup(<NotificationInbox {...organization} fullPage unreadOnly />);
  assert.match(html, /Unread activity/);
  assert.doesNotMatch(html, /All activity/);
});

test("bell retains its collapsed default instead of showing the full inbox on initial render", () => {
  const html = renderToStaticMarkup(<NotificationInbox {...organization} />);
  assert.match(html, /aria-label="Notifications, 0 unread, 0 unseen"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /aria-label="Notification history"/);
});

test("notification skeleton matches five list rows and respects reduced motion", () => {
  const html = renderToStaticMarkup(<NotificationsSkeleton />);
  assert.match(html, /role="status" aria-busy="true" aria-label="Loading notifications"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /class="sr-only">Loading notifications/);
  assert.match(html, /motion-safe:animate-pulse/);
  assert.equal((html.match(/data-skeleton-row=""/g) ?? []).length, 5);
  assert.doesNotMatch(html, /<button|<a /);
});

test("notification refresh uses brand color and stays busy while the initial request is pending", () => {
  const html = renderToStaticMarkup(<NotificationInbox {...organization} fullPage />);
  assert.match(html, /aria-label="Refresh notifications" aria-busy="true" disabled=""[^>]*class="[^"]*text-brand/);
  assert.match(html, /lucide-refresh-cw[^"]*motion-safe:animate-spin/);
  assert.match(html, /stroke-width="2.5"/);
});

test("Notes Requests refresh uses the same brand-colored pending indicator", () => {
  const html = renderToStaticMarkup(
    <NotesRequestsPanel
      organizationId="organization"
      userId="member"
      onChanged={async () => undefined}
      onRequestsLoaded={() => undefined}
    />,
  );
  assert.match(html, /aria-label="Refresh requests" aria-busy="true"[^>]*disabled=""[^>]*class="[^"]*text-brand/);
  assert.match(html, /lucide-refresh-cw[^"]*motion-safe:animate-spin/);
  assert.match(html, /stroke-width="2.5"/);
});
