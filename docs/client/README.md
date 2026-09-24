# Client Guide

## Web application

`apps/web` is a Next.js 16 and React 19 application. Its package manifest depends on workspace UI, auth, validation, types, configuration, emoji picker, and API client packages, alongside MUI and Emotion.

Product routes and feature orchestration belong in `apps/web`; reusable presentation components belong in `packages/ui`. The repository's engineering guidance requires theme-token styling and Storybook coverage when shared UI components change.

## API client package

`packages/api-client` currently exports a minimal `apiClient.get<T>(url)` helper from `src/index.ts`. It uses `fetch`, parses JSON on successful responses, and throws an error containing the response status otherwise. Its `client.ts` and `types.ts` files are present but empty.

This package is not an OpenAPI-generated SDK and does not currently encode authentication, base URL resolution, request interception, typed endpoint methods, or retry behavior. Consumers must supply a complete URL and arrange authentication according to the API contract.

## Connect real-time client

The repository implements the server-side Socket.IO namespace but does not contain a shared Socket.IO client package. See [Real-time Connect](../api/realtime.md) for verified server events.

TODO Confirm with team: intended API-client ownership, browser authentication strategy, error normalization, SDK generation plans, cache strategy, and Socket.IO client lifecycle conventions.
