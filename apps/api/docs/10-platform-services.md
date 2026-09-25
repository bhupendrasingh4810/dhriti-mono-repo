# Platform Services — Files, Notifications, Search, Analytics, Webhooks

Cross-cutting services every app uses.

## Files — `/v1/organization/files`

Entity: `StoredFile` (org, uploader, bucket, objectKey, name, contentType, sizeBytes, sha256).

- `POST /` — multipart upload (memory → S3). Content-type allowlist + size limit (`FILE_MAX_SIZE_MB`).
- `GET /` — list org files.
- `GET /:fileId/download` — short-lived presigned download URL.
- `DELETE /:fileId` — uploader only (soft-deletes metadata, removes the object).

Storage is S3-compatible ([storage.service.ts](../src/modules/file/storage.service.ts)); use MinIO in dev via `S3_ENDPOINT` + `S3_FORCE_PATH_STYLE=true`. Uploads/deletes are audit-logged.

## Notifications — `/v1/organization/notifications`

Entities: `Notification` + `NotificationPreference` (per-type in-app/email/push).

- `GET /?cursor=&limit=&unreadOnly=` — in-app center (cursor-paginated) with unread count.
- `GET /unread-count`.
- `POST /` — create a notification for a user (respects preferences; emails when enabled).
- `PATCH /:notificationId/read`, `PATCH /read-all`.
- `GET /preferences`, `POST /preferences` `{ type, inApp?, email?, push? }`.

Types: `MENTION | ASSIGNMENT | DUE_DATE | MEETING_REMINDER | COMMENT | SYSTEM`.

## Search — `/v1/organization/search`

Entity: `SearchIndex` (entityType, entityId, title, content, org) + `SearchHistory`.
A PostgreSQL trigger keeps a weighted `search_vector` (title=A, content=B) in sync;
a GIN index backs fast `@@` queries.

- `GET /?q=&type=&limit=` — cross-app full-text search with relevance ranking and highlighted snippets. `type` ∈ `message | issue | page | event | user`.
- `GET /history` — recent queries for autocomplete.

App modules call `SearchService.index()` / `.remove()` to keep the index current.

## Analytics — `/v1/organization/analytics`

Entity: `UsageEvent` (event, app, metadata, user, org).

- `POST /track` `{ event, app, metadata? }` — record a usage event.
- `GET /overview?from=&to=&app=` (OWNER/ADMIN) — usage by app, daily activity series, **DAU/WAU/MAU**, and Flow team velocity (issues created/completed, avg cycle hours).

## Webhooks — `/v1/organization/webhooks`

Entities: `Webhook` (url, secret, events, active) + `WebhookDelivery` (per-attempt log).
OWNER/ADMIN only.

- `GET /`, `POST /` (returns the signing secret once), `PATCH /:id`, `POST /:id/rotate-secret`, `DELETE /:id`, `GET /:id/deliveries`.
- App modules call `webhooks.dispatch(orgId, event, data)`; delivery POSTs are HMAC-SHA256 signed (`X-Dhriti-Signature: sha256=...`), with timeout + 3 retries and per-attempt logging.

Consumers verify with `WebhookService.verifySignature(secret, body, signature)`.

## Error codes

`FILE_NOT_FOUND`, `FILE_EMPTY`, `FILE_TOO_LARGE`, `FILE_TYPE_NOT_ALLOWED`,
`WEBHOOK_NOT_FOUND`, `NOTHING_TO_SUMMARIZE`.
