# Functional Specification

The checked-in client is `apps/web`, a Next.js 16 and React 19 application. It consumes shared UI, auth, validation, types, configuration, emoji-picker, and API-client packages. Product feature orchestration belongs in the web application; reusable presentation components belong in `packages/ui`.

The current API-client package exposes a minimal `get<T>(url)` helper rather than a generated or domain-specific SDK. Connect real-time behavior is implemented server-side at Socket.IO namespace `/connect`; see [Real-time Connect](../api/realtime.md).

TODO Confirm with team: user personas, supported browsers, client feature acceptance criteria, and API-client ownership.
