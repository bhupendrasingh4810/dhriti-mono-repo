import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Note } from "@/services/notes.service";
import { NotesSharedBadge } from "./NotesSharedBadge";
import { NotesCard } from "./NotesCard";

const note: Note = {
  id: "note-1",
  title: "Shared project plan",
  content: "Project decisions",
  isPublic: false,
  ownerId: "owner",
  owner: { id: "owner", name: "Owner", avatarUrl: null },
  folderId: "owner-folder",
  permissions: [
    {
      userId: "recipient",
      canEdit: false,
      canDelete: false,
      user: { id: "recipient", name: "Recipient", avatarUrl: null },
    },
  ],
  createdAt: "2026-10-29T00:00:00Z",
  updatedAt: "2026-10-29T00:00:00Z",
};

test("the detail badge renders Shared even for a view-only recipient", () => {
  const html = renderToStaticMarkup(createElement(NotesSharedBadge, { note }));
  assert.match(html, />Shared<\/span>/);
  assert.match(html, /aria-hidden="true"/);
});

test("unshared notes have no badge", () => {
  assert.equal(renderToStaticMarkup(createElement(NotesSharedBadge, { note: { permissions: [] } })), "");
});

test("cards display Shared only for notes with sharing permissions", () => {
  const renderCard = (cardNote: Note) =>
    renderToStaticMarkup(
      createElement(NotesCard, {
        note: cardNote,
        menuOpen: false,
        onView: () => undefined,
        onMenuOpen: () => undefined,
        onDragStart: () => undefined,
        onDragEnd: () => undefined,
      }),
    );
  assert.match(renderCard(note), />Shared<\/span>/);
  assert.doesNotMatch(renderCard({ ...note, permissions: [] }), />Shared<\/span>/);
  assert.match(renderCard(note), />Private<\/span>/);
  assert.match(renderCard({ ...note, isPublic: true }), />Public<\/span>/);
});
