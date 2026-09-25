# Web Service Coverage

Browser services in `apps/web/src/services` use the Next API proxy and `apiRequest`. Tenant-scoped controller calls require an explicit organization ID and send it as `x-organization-id`.

| API controller area                                                              | Service module                                                         |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Auth, profile, onboarding                                                        | `auth.service.ts`, `onboarding.service.ts`                             |
| Organizations, invitations, permission groups, departments, teams, subscriptions | `organization.service.ts`, `organization-management.service.ts`        |
| Connect, Flow, Atlas, Pulse, Cadence, Nexus                                      | Dedicated `*.service.ts` modules                                       |
| Notifications, files, analytics, search                                          | `notifications.service.ts`, `files.service.ts`, `discovery.service.ts` |
| HRMS                                                                             | `hrms.service.ts`                                                      |
| Users and outbound organization webhooks                                         | `admin.service.ts`                                                     |
| Control platform, organization control, public/admin content                     | `control.service.ts`                                                   |

Excluded from browser service methods: health and metrics endpoints are operational probes; billing provider webhooks are inbound provider callbacks; OAuth start/callback endpoints are browser navigation mechanics rather than JSON REST calls. These are intentionally not wrapped by `apiRequest`.
