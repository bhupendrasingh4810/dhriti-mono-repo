# Atlas — Knowledge Base

## Entity diagram

```
Organization ── AtlasSpace ── AtlasPage ──┬─ AtlasPage (parent/children → tree)
      │                                   ├─ AtlasComment ── User
      │                                   └─ author → User
      └─ AtlasComment
```

Pages form a tree via `parentId`; each page has a `version` that increments when
content changes. Comments can be resolved/unresolved.

## REST (base `/v1/organization/atlas`)

### Spaces
- `GET /spaces` (with page counts), `POST /spaces` `{ key, name, description?, icon? }` (key uppercase, unique per org).
- `PATCH /spaces/:spaceId`, `DELETE /spaces/:spaceId` (soft-deletes the space **and its pages**).

### Pages
- `GET /spaces/:spaceId/pages` — ordered tree data (children/comment counts).
- `POST /spaces/:spaceId/pages` `{ title, parentId?, content?, position?, isPublished? }`.
- `GET /pages/:pageId`.
- `PATCH /pages/:pageId` — update; **content change bumps `version`**. Supports moving via `parentId` (with **cycle protection**: a page can't be moved under itself or a descendant).
- `DELETE /pages/:pageId` — soft-deletes the page and its entire subtree.

### Comments
- `GET/POST /pages/:pageId/comments`, `PATCH /comments/:commentId/resolve` `{ isResolved }`, `DELETE /comments/:commentId` (author only).

## WebSocket — namespace `/atlas` (co-authoring)
- `page:join` / `page:leave` `{ pageId }` — join a co-authoring room (page existence is authorized). Returns current editors.
- `page:cursor` `{ pageId, from, to }` — broadcast cursor/selection to the room.
- `page:edit` `{ pageId, content }` — broadcast edits to other editors.

Presence (`page:editor-joined` / `page:editor-left`) is tracked per room; leaving
or disconnecting removes you. Persistence stays on the versioned REST endpoint.

## Error codes
`SPACE_NOT_FOUND`, `SPACE_KEY_TAKEN`, `PAGE_NOT_FOUND`, `PAGE_CYCLE`,
`COMMENT_NOT_FOUND`, `FORBIDDEN`.
