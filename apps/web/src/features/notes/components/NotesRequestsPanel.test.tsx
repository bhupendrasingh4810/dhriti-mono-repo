import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { NoteAccessRequest, NoteAccessRole } from "@/services/notes.service";
import {
  countIncomingRequests,
  NotesRequestRow,
  NotesRequestsEmptyState,
  NotesRequestsPanel,
} from "./NotesRequestsPanel";

const request: NoteAccessRequest = {
  id: "request",
  noteId: "note",
  userId: "requester",
  requestedRole: "OWNER",
  grantedRole: null,
  status: "PENDING",
  user: { id: "requester", name: "Team member", avatarUrl: null },
  note: { id: "note", title: "Sprint plan", ownerId: "owner", permissions: [] },
};

function renderRow(entry = request, incoming = true, busy = false) {
  return renderToStaticMarkup(
    createElement(NotesRequestRow, {
      request: entry,
      incoming,
      busy,
      onReview: () => undefined,
    }),
  );
}

test("owner approval preselects the exact requested permission and offers both roles", () => {
  for (const role of ["OWNER", "EDIT"] satisfies NoteAccessRole[]) {
    const html = renderRow({ ...request, requestedRole: role });
    assert.match(html, new RegExp(`<option value="${role}" selected=""`));
    assert.match(html, /<option value="OWNER"/);
    assert.match(html, /<option value="EDIT"/);
    assert.match(html, />Approve<\/button>/);
    assert.match(html, />Reject<\/button>/);
  }
});

test("outgoing requests cannot be approved by their requester", () => {
  const html = renderRow(request, false);
  assert.match(html, /You.*requested/);
  assert.doesNotMatch(html, /<select|>Approve<\/button>|>Reject<\/button>/);
});

test("reviewed requests show the granted role rather than the original requested role", () => {
  const html = renderRow({ ...request, status: "APPROVED", grantedRole: "EDIT" });
  assert.match(html, /Approved: edit access/);
  assert.doesNotMatch(html, /<select|>Approve<\/button>/);
});

test("approval controls are disabled while submitting", () => {
  const html = renderRow(request, true, true);
  assert.match(html, /<select disabled=""/);
  assert.equal((html.match(/<button type="button" disabled=""/g) ?? []).length, 2);
});

test("sidebar count includes only pending incoming requests for an owner or co-owner", () => {
  const requests: NoteAccessRequest[] = [
    request,
    { ...request, id: "approved", status: "APPROVED" },
    { ...request, id: "rejected", status: "REJECTED" },
    { ...request, id: "outgoing", userId: "owner" },
    { ...request, id: "other-note", note: { ...request.note, ownerId: "someone-else" } },
    {
      ...request,
      id: "co-owned",
      note: { ...request.note, ownerId: "someone-else", permissions: [{ userId: "owner" }] },
    },
  ];
  assert.equal(countIncomingRequests(requests, "owner"), 2);
  assert.equal(countIncomingRequests([], "owner"), 0);
});

test("each request column has a distinct illustrated empty placeholder", () => {
  for (const incoming of [true, false]) {
    const html = renderToStaticMarkup(createElement(NotesRequestsEmptyState, { incoming }));
    assert.match(html, /<svg/);
    assert.match(html, incoming ? /No incoming requests/ : /No requests sent/);
    assert.match(html, /will appear here/);
  }
});

test("refresh is icon-only with an accessible label", () => {
  const html = renderToStaticMarkup(
    createElement(NotesRequestsPanel, {
      organizationId: "org",
      userId: "owner",
      onChanged: async () => undefined,
      onRequestsLoaded: () => undefined,
    }),
  );
  assert.match(html, /aria-label="Refresh requests"/);
  assert.match(html, /<svg/);
  assert.doesNotMatch(html, />Refresh requests</);
});
