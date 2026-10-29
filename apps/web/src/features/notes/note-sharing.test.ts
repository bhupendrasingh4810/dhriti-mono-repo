import assert from "node:assert/strict";
import { test } from "node:test";
import type { Note } from "@/services/notes.service";
import { sharingChanged, sharingPermissions, sharingRecipients } from "./note-sharing";

const note: Pick<Note, "permissions"> = {
  permissions: [
    { userId: "viewer", user: { id: "viewer", name: "Viewer", avatarUrl: null }, canEdit: false, canDelete: false },
    { userId: "editor", user: { id: "editor", name: "Editor", avatarUrl: null }, canEdit: true, canDelete: false },
    { userId: "deleter", user: { id: "deleter", name: "Deleter", avatarUrl: null }, canEdit: false, canDelete: true },
  ],
};

test("the sharing draft lists every existing recipient with their exact permissions", () => {
  const recipients = sharingRecipients(note);
  assert.deepEqual(
    recipients.map(({ user }) => user.name),
    ["Viewer", "Editor", "Deleter"],
  );
  assert.equal(sharingChanged(note, recipients), false);
  assert.deepEqual(
    sharingPermissions(recipients),
    note.permissions.map(({ userId, canEdit, canDelete }) => ({
      userId,
      canEdit,
      canDelete,
    })),
  );
});

test("updating one recipient preserves other recipients and independent delete permission", () => {
  const recipients = sharingRecipients(note).map((recipient) =>
    recipient.user.id === "viewer" ? { ...recipient, canEdit: true } : recipient,
  );
  assert.equal(sharingChanged(note, recipients), true);
  assert.deepEqual(sharingPermissions(recipients), [
    { userId: "viewer", canEdit: true, canDelete: false },
    { userId: "editor", canEdit: true, canDelete: false },
    { userId: "deleter", canEdit: false, canDelete: true },
  ]);
  assert.equal(note.permissions[0].canEdit, false);
});

test("revoking a recipient removes them from the replacement permissions payload", () => {
  const recipients = sharingRecipients(note).filter(({ user }) => user.id !== "editor");
  assert.equal(sharingChanged(note, recipients), true);
  assert.deepEqual(
    sharingPermissions(recipients).map(({ userId }) => userId),
    ["viewer", "deleter"],
  );
});

test("revoking the last recipient produces a valid empty permissions array", () => {
  assert.equal(sharingChanged(note, []), true);
  assert.deepEqual(sharingPermissions([]), []);
});

test("new recipients default to view-only and do not replace existing entries", () => {
  const recipients = [
    ...sharingRecipients(note),
    { user: { id: "new-user", name: "New user" }, canEdit: false, canDelete: false },
  ];
  assert.equal(sharingChanged(note, recipients), true);
  assert.deepEqual(sharingPermissions(recipients).at(-1), {
    userId: "new-user",
    canEdit: false,
    canDelete: false,
  });

  assert.equal(sharingPermissions(recipients).length, 4);
});

test("editing a share list preserves co-ownership and detects its revocation", () => {
  const coOwned = {
    permissions: [
      {
        userId: "co-owner",
        isOwner: true,
        canEdit: true,
        canDelete: true,
        user: { id: "co-owner", name: "Co-owner", avatarUrl: null },
      },
    ],
  };
  const recipients = sharingRecipients(coOwned);
  assert.equal(sharingChanged(coOwned, recipients), false);
  assert.equal(sharingPermissions(recipients)[0].isOwner, true);
  assert.equal(
    sharingChanged(
      coOwned,
      recipients.map((recipient) => ({ ...recipient, isOwner: false })),
    ),
    true,
  );
});
