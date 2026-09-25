# Nexus — AI Layer

## Entity diagram

```
Organization ── NexusTask (type, status, input, result, source link)
      │        └─ requestedBy → User
      └─ NexusConversation ── NexusMessage (role, content, tokens)
```

`NexusTask.type` ∈ `SUMMARIZE_CONVERSATION | SUMMARIZE_PAGE | EXTRACT_TASKS |
MEETING_NOTES | ASK`; `status` ∈ `PENDING | RUNNING | COMPLETED | FAILED`.
`NexusMessage` stores the Q&A history for a conversation.

## AI provider

`AiProviderService` is a swappable port. If `OPENAI_API_KEY` is set it calls
OpenAI chat completions (`OPENAI_MODEL`, default `gpt-4o-mini`); otherwise it
uses a deterministic local fallback so features work in dev.

## REST (base `/v1/organization/nexus`)

- `POST /summarize/conversation` `{ channelId, messageLimit? }` → summary + decisions + action items (a `NexusTask`).
- `POST /summarize/page` `{ pageId }` → summary + key points.
- `POST /extract-tasks` `{ text }` → `ExtractedTask[]` (`title`, optional `assignee`/`dueDate`/`priority`).
- `POST /ask` `{ question, conversationId? }` → `{ conversationId, answer }`; pass `conversationId` to continue a thread.
- `GET /conversations`, `GET /tasks` — the current user's AI conversations and tasks.

## WebSocket — namespace `/nexus`

`ask:stream` `{ question, conversationId? }` streams the answer token-by-token:

```
nexus:answer:start
nexus:answer:token  { token }     (repeated)
nexus:answer:done   { conversationId, answer }
nexus:answer:error  { message }
```

The Q&A pair is persisted via the Nexus service so history is kept.

## Error codes

`NOTHING_TO_SUMMARIZE`, `PAGE_NOT_FOUND`, `CONVERSATION_NOT_FOUND`.
