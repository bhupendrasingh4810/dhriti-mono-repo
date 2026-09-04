# Cadence — Retrospectives & Estimation

## Entity diagram

```
Organization ── CadenceSession ── CadenceCard ── CadenceVote ── User
      │              │               └─ groupId (clustering)
      │              └─ facilitator → User
      └─ Team (optional)
```

`CadenceSession.type` ∈ `RETROSPECTIVE | ESTIMATION | CHECKIN`; `phase` ∈
`COLLECT | GROUP | VOTE | DISCUSS | DONE`. Cards live in column lanes
(e.g. `went-well`, `to-improve`, `action-items`).

## REST (base `/v1/organization/cadence`)

### Sessions
- `GET /sessions`, `POST /sessions` `{ type, title, teamId?, isAnonymous? }` (creator becomes facilitator).
- `GET /sessions/:sessionId` — session + cards + vote counts. In anonymous sessions, card authors are hidden from non-facilitators.
- `PATCH /sessions/:sessionId/phase` `{ phase }` — facilitator only; `DONE` stamps `endedAt`.

### Cards
- `POST /sessions/:sessionId/cards` `{ content, column }` — only during `COLLECT`.
- `PATCH /sessions/:sessionId/cards/:cardId/group` `{ groupId?, position? }` — group/ungroup (facilitator only).
- `DELETE /sessions/:sessionId/cards/:cardId` — author or facilitator.

### Voting
- `POST /sessions/:sessionId/votes` `{ cardId }` — one vote per user per card, only during `VOTE`.
- `DELETE /sessions/:sessionId/votes/:cardId`.

## WebSocket — namespace `/cadence`
- `session:join` / `session:leave` `{ sessionId }` — authorized room.
- `card:vote` / `card:unvote` `{ sessionId, cardId }` — **anonymous voting sync**: broadcasts `card:vote-changed` without exposing the voter.
- `session:phase` `{ sessionId, phase }` — facilitator phase transition broadcast (`session:phase-changed`).

## Error codes
`SESSION_NOT_FOUND`, `CARD_NOT_FOUND`, `PHASE_LOCKED`, `FORBIDDEN`.
