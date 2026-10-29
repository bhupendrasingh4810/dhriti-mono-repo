import assert from "node:assert/strict";
import { test } from "node:test";
import type { Note } from "@/services/notes.service";
import { canDeleteNote, canEditNote, canShareNote } from "./note-access";

const note: Pick<Note, "ownerId" | "permissions"> = {
  ownerId: "owner",
  permissions: [
    { userId: "editor", canEdit: true, user: { id: "editor", name: "Editor", avatarUrl: null } },
    { userId: "viewer", canEdit: false, user: { id: "viewer", name: "Viewer", avatarUrl: null } },
  ],
};

test("owners can edit from both the card view and the edit action without a sharing entry", () => {
  assert.equal(canEditNote(note, "owner", true), true);
  assert.equal(canEditNote(note, "owner", false), true);
});

test("an explicit restrictive sharing entry cannot revoke the owner's access", () => {
  const permissions = [
    ...note.permissions,
    { userId: "owner", canEdit: false, user: { id: "owner", name: "Owner", avatarUrl: null } },
  ];
  assert.equal(canEditNote({ ...note, permissions }, "owner", true), true);
});

test("shared editors can edit only in edit mode", () => {
  assert.equal(canEditNote(note, "editor", false), true);
  assert.equal(canEditNote(note, "editor", true), false);
});

test("viewers and unshared users cannot edit in either mode", () => {
  for (const userId of ["viewer", "unshared"]) {
    assert.equal(canEditNote(note, userId, false), false);
    assert.equal(canEditNote(note, userId, true), false);
  }
});

test("new notes require an authenticated user and edit mode", () => {
  assert.equal(canEditNote(null, "owner", false), true);
  assert.equal(canEditNote(null, "owner", true), false);
  assert.equal(canEditNote(null, undefined, false), false);
  assert.equal(canEditNote(note, undefined, false), false);
});

test("co-owners have full control even without separate edit or delete flags", () => {
  const coOwned = {
    ...note,
    permissions: [
      {
        userId: "co-owner",
        isOwner: true,
        canEdit: false,
        canDelete: false,
        user: { id: "co-owner", name: "Co-owner", avatarUrl: null },
      },
    ],
  };
  assert.equal(canEditNote(coOwned, "co-owner", true), true);
  assert.equal(canDeleteNote(coOwned, "co-owner"), true);
  assert.equal(canShareNote(coOwned, "co-owner"), true);
  assert.equal(canShareNote(coOwned, "unrelated"), false);
});
