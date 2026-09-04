# Flow — Projects, Issues, Sprints, Boards

## Entity diagram

```
Organization ── Project ──┬─ Board ── BoardColumn
      │                   ├─ Sprint ── Issue
      │                   └─ Issue
      └─ Issue ── (assignee/reporter → User, sprint → Sprint)
```

`Issue.status` ∈ `BACKLOG | TODO | IN_PROGRESS | IN_REVIEW | DONE | CANCELLED`;
`priority` ∈ `URGENT | HIGH | MEDIUM | LOW | NONE`. Issues get a per-project
auto-incremented `number` (so `PAY-101`).

## REST (base `/v1/organization/flow`)

### Projects
- `GET /projects`, `POST /projects` `{ key, name, description?, teamId?, leadId? }` (key uppercase, unique per org).
- `GET /projects/:projectId`, `PATCH /projects/:projectId`.

### Issues
- `GET /projects/:projectId/issues?status=&priority=&assigneeId=&sprintId=&limit=`.
- `POST /projects/:projectId/issues` — title, description, status, priority, assignee, sprint, estimate, dueDate.
  - Number assigned in a transaction (race-safe). Assignee must be an org member; sprint must belong to the project.
- `GET /issues/:issueId`.
- `PATCH /issues/:issueId` — full update (assignee/sprint accept `null` to clear).
- `POST /issues/:issueId/move` `{ status, position? }` — board drag-and-drop.
- `DELETE /issues/:issueId` — soft delete.

### Board
- `GET /projects/:projectId/board` — kanban grouped by status column.

### Board columns
- `GET/POST /boards/:boardId/columns`, `PATCH/DELETE /boards/:boardId/columns/:columnId`.
- Columns map to a status bucket, support `position` ordering and a `wipLimit`.

### Sprints
- `GET/POST /projects/:projectId/sprints`, `PATCH /projects/:projectId/sprints/:sprintId`.
- Activating a sprint **deactivates all others** in the project (only one active).

## WebSocket — namespace `/flow`
- `project:join` / `project:leave` `{ projectId }` — board room (join authorized).
- `issue:move` `{ projectId, issueId, status, position? }` — persists and broadcasts `issue:moved` to the room.
- `issue:changed` `{ projectId, issueId }` — tells other clients to refetch.

## Error codes
`PROJECT_NOT_FOUND`, `PROJECT_KEY_TAKEN`, `ISSUE_NOT_FOUND`, `SPRINT_NOT_FOUND`,
`BOARD_NOT_FOUND`, `COLUMN_NOT_FOUND`, `MEMBER_NOT_FOUND`.
