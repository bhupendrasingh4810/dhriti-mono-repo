# API Guide

## Base URL and API reference

The API applies the configurable `API_PREFIX`, which defaults to `v1`; local Docker therefore serves `http://localhost:3001/v1`. Swagger is generated only outside production at `/{API_PREFIX}/docs`, so locally its default location is `http://localhost:3001/v1/docs`.

Swagger is the implementation-derived reference for DTO shapes, validation constraints, request bodies, and response schemas. This guide intentionally maps stable route families instead of duplicating all 282 controller methods.

## Conventions

- Nest global validation strips unknown fields, rejects non-whitelisted fields, and transforms DTOs.
- The application globally installs an authentication guard. Health and metrics endpoints explicitly use `@Public()`.
- CORS permits `GET`, `POST`, `PATCH`, `PUT`, `DELETE`, and `OPTIONS`; configured origins come from `CORS_ORIGINS`.
- Bearer authentication is declared on the protected Swagger controllers. See [Authentication and tenancy](authentication.md).
- Subscription mutations accept the `Idempotency-Key` header in the organization access controller.

## Route families

| Area                          | Controller base path under `/v1`                                                                                                            | Implemented scope                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Health and metrics            | `/health`, `/metrics`                                                                                                                       | Liveness, dependency readiness, Prometheus text metrics                                                       |
| Authentication                | `/auth` and `/auth/mfa`                                                                                                                     | Registration, login, token refresh, password flows, OAuth, MFA, profile                                       |
| Onboarding and users          | `/onboarding`, `/users`                                                                                                                     | Current-user onboarding profile and user management                                                           |
| Organization                  | `/organizations/:organizationId`, `/organization`                                                                                           | Permissions, departments, teams, subscription, entitlements, members, invitations                             |
| Workspace products            | `/organization/connect`, `/organization/flow`, `/organization/atlas`, `/organization/pulse`, `/organization/cadence`, `/organization/nexus` | Collaboration, projects, knowledge, calendar, sessions, and AI-assisted tasks                                 |
| Supporting workspace services | `/organization/files`, `/organization/notifications`, `/organization/search`, `/organization/webhooks`, `/organization/analytics`           | Files, notifications, search, webhooks, and analytics                                                         |
| HRMS                          | `/organization/hrms/*`                                                                                                                      | Employees, attendance, leave, payroll, benefits, assets, training, performance reviews, and holiday calendars |
| Control                       | `/control/organization`, `/control/platform`, `/content/*`                                                                                  | Organization administration, platform operations, and managed content                                         |
| Billing ingress               | `/billing/webhooks/:provider`                                                                                                               | Provider webhook receiver                                                                                     |

## Real-time Connect

The Socket.IO gateway is served at namespace `/connect`, accepts websocket and polling transports, and authenticates a socket before joining organization rooms. Implemented client events include `channel:join`, `channel:leave`, `typing`, `message:send`, `presence:set`, and `channel:mark-read`. See [Real-time Connect](realtime.md).

## Related documents

- [Authentication and tenancy](authentication.md)
- [Real-time Connect](realtime.md)
- [Management](../management/README.md)
- [Operations](../operations/README.md)
