# API Endpoints

This is a route-family index; use local Swagger for exact DTOs, validation constraints, and response schemas.

| Route family under `/v1`                                                      | Implemented scope                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/health`, `/metrics`                                                         | Liveness, dependency readiness, Prometheus metrics            |
| `/auth`, `/auth/mfa`                                                          | Registration, login, refresh, password flows, OAuth, and MFA  |
| `/onboarding`, `/users`                                                       | Onboarding profile and user management                        |
| `/organizations/:organizationId`, `/organization`                             | Access, members, subscriptions, teams, and workspace products |
| `/organization/connect`                                                       | Channels, messages, reactions, and real-time collaboration    |
| `/organization/flow`, `/atlas`, `/pulse`, `/cadence`, `/nexus`                | Workspace product resources                                   |
| `/organization/files`, `/notifications`, `/search`, `/webhooks`, `/analytics` | Supporting workspace services                                 |
| `/organization/hrms/*`                                                        | HRMS records                                                  |
| `/control/organization`, `/control/platform`, `/content/*`                    | Organization, platform, and content management                |
| `/billing/webhooks/:provider`                                                 | Billing-provider webhook ingress                              |

The Connect Socket.IO namespace is `/connect`. Its documented events are in [Real-time Connect](realtime.md).

TODO Confirm with team: which endpoint families are supported for third-party integrations.
