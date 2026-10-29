import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Note } from "@/services/notes.service";
import { NotesCardActions } from "./NotesCard";

function renderActions(userId: string | undefined, canEdit = false, canDelete = false, isPublic = false) {
  const note: Pick<Note, "ownerId" | "permissions" | "isPublic"> = {
    isPublic,
    ownerId: "owner",
    permissions: [
      {
        userId: "recipient",
        canEdit,
        canDelete,
        user: { id: "recipient", name: "Recipient", avatarUrl: null },
      },
    ],
  };
  return renderToStaticMarkup(
    createElement(NotesCardActions, {
      note,
      userId,
      onEdit: () => undefined,
      onShare: () => undefined,
      onDelete: () => undefined,
      onRequestAccess: () => undefined,
    }),
  );
}

test("canDelete false hides Delete even when the recipient can edit", () => {
  const html = renderActions("recipient", true, false);
  assert.match(html, /Edit<\/button>/);
  assert.doesNotMatch(html, /Delete<\/button>|Share<\/button>/);
});

test("delete-only permission shows Delete but not Edit or Share", () => {
  const html = renderActions("recipient", false, true);
  assert.match(html, /Delete<\/button>/);
  assert.doesNotMatch(html, /Edit<\/button>|Share<\/button>/);
});

test("owners retain every action without needing recipient permissions", () => {
  const html = renderActions("owner");
  for (const action of ["Edit", "Share", "Delete"]) {
    assert.match(html, new RegExp(`${action}</button>`));
  }
});

test("viewers, unrelated users and missing identities receive no action buttons", () => {
  for (const userId of ["recipient", "unrelated", undefined]) {
    const html = renderActions(userId);
    assert.doesNotMatch(html, /<button/);
    assert.match(html, /view-only access/);
  }
});

test("another recipient's permissions do not authorize an unrelated user", () => {
  assert.doesNotMatch(renderActions("unrelated", true, true), /<button/);
});

test("public note viewers can request edit and co-owner access from the card menu", () => {
  const html = renderActions("unrelated", false, false, true);
  assert.match(html, /Request edit access<\/button>/);
  assert.match(html, /Request co-owner access<\/button>/);
  assert.doesNotMatch(html, /view-only access|>Delete<\/button>|>Share<\/button>/);
});

test("public note editors can request co-ownership but not access they already have", () => {
  const html = renderActions("recipient", true, false, true);
  assert.match(html, /Request co-owner access<\/button>/);
  assert.doesNotMatch(html, /Request edit access<\/button>/);
});

test("owners and unauthenticated users cannot request access", () => {
  for (const userId of ["owner", undefined]) {
    assert.doesNotMatch(renderActions(userId, false, false, true), /Request .*access<\/button>/);
  }
});
