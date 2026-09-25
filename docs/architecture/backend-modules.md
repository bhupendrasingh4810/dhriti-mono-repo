# Backend Modules

`apps/api/src/app.module.ts` composes configuration, database, Redis, authorization, health, metrics, jobs, WebSocket, and product modules.

| Module area                    | Evidence-backed responsibility                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Configuration, database, Redis | Environment validation, Prisma access, and Redis services                                 |
| Auth and authorization         | Authentication, organization context, permissions, entitlements, and billing access       |
| Product modules                | Connect, Flow, Atlas, Pulse, Cadence, Nexus, HRMS, and content capabilities               |
| Supporting modules             | Files, notifications, search, webhooks, analytics, audit, and organization administration |
| Platform services              | Health, metrics, jobs, Kafka, and Socket.IO WebSocket support                             |

Controllers expose HTTP routes; modules own dependency composition. TODO Confirm with team: module ownership boundaries and public-service support commitments.
