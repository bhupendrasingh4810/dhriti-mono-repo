# Connect — Chat & Calls

## Entity diagram

```
Organization ── Channel ──┬─ ChannelMember ── User
      │                   └─ Message ──┬─ Message (parent/replies → threads)
      │                                ├─ MessageMention ── User
      │                                └─ MessageReaction (user, emoji)
      └─ Message
```

`Channel.type` ∈ `CHANNEL | DIRECT | GROUP`; `visibility` ∈ `PUBLIC | PRIVATE`.
`Message.parentId` makes a thread. Mentions/reactions hang off messages.

## REST (base `/v1/organization/connect`)

### Channels
- `GET /channels` — public channels + private channels you're a member of.
- `POST /channels` — create (creator auto-joins; slug unique per org).
- `PATCH /channels/:channelId` — name, topic, description, archive.
- `POST /channels/:channelId/members` `{ userId }` / `DELETE .../members/:userId`.

> Private channels reject non-members (`FORBIDDEN`).

### Messages
- `GET /channels/:channelId/messages?cursor=&limit=` — newest first, cursor-paginated (limit ≤ 100).
- `POST /channels/:channelId/messages` `{ content, parentId?, mentionUserIds? }`.
  - `parentId` must reference a message in the same channel (thread reply).
  - Mentions resolve from `mentionUserIds` **and** `@handle` / `@email-prefix` tokens in the text, restricted to org members.
- `PATCH /messages/:messageId` — edit (author only; sets `isEdited`, re-resolves mentions).
- `DELETE /messages/:messageId` — delete (author only, soft delete).
- `POST /messages/:messageId/reactions` `{ emoji }` / `DELETE .../reactions/:emoji`.

## WebSocket — namespace `/connect`

Authenticate with the access token: `io("/connect", { auth: { token } })`.

| Event (client → server) | Payload | Broadcast |
| --- | --- | --- |
| `channel:join` / `channel:leave` | `{ channelId }` | joins/leaves room `channel:{id}` (join is authorized) |
| `typing` | `{ channelId, isTyping }` | `typing` to others in the room |
| `message:send` | `{ channelId, content, parentId? }` | persists + `message:created` to the room |
| `presence:set` | `{ status: online|away|dnd|in-meeting|offline }` | `presence:changed` to the org |

Presence is tracked across sockets (multi-tab) and auto-broadcasts `offline` when
the user's last connection closes.

### WebRTC (same namespace)
- `call:join` / `call:leave` `{ channelId }` — join/leave a call room (`call:{id}`); join returns current peers.
- `call:signal` `{ channelId, to, data }` — relay SDP offer/answer or ICE candidate to a peer socket.
- `call:media-state` `{ channelId, kind: audio|video|screen, state: on|off }`.

The gateway never touches media — it only relays signaling between peers.

## Error codes
`CHANNEL_NOT_FOUND`, `CHANNEL_SLUG_TAKEN`, `MESSAGE_NOT_FOUND`, `FORBIDDEN`.
