import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiRequestError } from "@/services/http.service";
import { isNoteAccessRejected, reorderNotes } from "./note-order";

test("dropping a note on another moves it to the target position without duplicates", () => {
  const notes = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(
    reorderNotes(notes, "a", "c").map(({ id }) => id),
    ["b", "c", "a"],
  );
  assert.deepEqual(
    reorderNotes(notes, "c", "a").map(({ id }) => id),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    notes.map(({ id }) => id),
    ["a", "b", "c"],
  );
});

test("invalid or unchanged drops do not trigger a reorder", () => {
  const notes = [{ id: "a" }, { id: "b" }];
  assert.equal(reorderNotes(notes, "missing", "a"), notes);
  assert.equal(reorderNotes(notes, "a", "missing"), notes);
  assert.equal(reorderNotes(notes, "a", "a"), notes);
});

test("only explicit access rejection or missing-note responses trigger removing a note", () => {
  assert.equal(isNoteAccessRejected(new ApiRequestError("You cannot edit this note", 403)), true);
  assert.equal(isNoteAccessRejected(new ApiRequestError("Note not found", 404)), true);
  for (const error of [
    new ApiRequestError("Invalid content", 400),
    new ApiRequestError("Session expired", 401),
    new ApiRequestError("Server error", 500),
    new Error("Network failure"),
  ]) {
    assert.equal(isNoteAccessRejected(error), false);
  }
});
