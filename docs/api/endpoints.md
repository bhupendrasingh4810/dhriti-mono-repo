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

## Personal and employment profiles

`GET /auth/me` returns the authenticated user's personal/contact details and their
current organization's non-deleted HRMS employee record. All optional fields are
returned explicitly as `null` when not recorded. Employment status is distinct
from the user's authentication account status.

`PATCH /auth/me` accepts `name`, `avatarUrl`, `prefix`, `dateOfBirth`, `gender`,
`bloodGroup`, `nationality`, `workEmail`, `alternateEmail`, `isdCode`,
`mobileNumber`, `timezone`, and `locale`. Work email is independent of the
sign-in email. Optional personal/contact fields can be cleared with `null`.
The ISD code and national mobile number must be submitted together or both
cleared; the existing unique phone field stores their combined international
value (at most 15 digits). Changing the number clears its phone verification flag.
Date of birth uses `YYYY-MM-DD`, must be a real date,
and cannot be in the future. Changing the birthday clears its verification flag.
Updates across profile extensions are transactional.

The web app proxies profile reads/writes through `/api/auth/profile`.
Employment fields are rejected on the self-service profile endpoint.

HR uses the existing `/organization/hrms/employees` create and
`/organization/hrms/employees/:employeeId` update endpoints, protected by
`hrms.employee.manage` and the HRMS entitlement. Employee number maps to
`employeeCode`, `startDate` to `dateOfJoining`, `status` to `employmentStatus`,
and `resignationDate` to `dateOfResignation` on the personal profile response.
Both HR endpoints additionally accept `biometricId`, `retirementDate`, and
`resignationDate`; updates also accept `employeeNumber`. The new lifecycle dates
use `YYYY-MM-DD`, may be cleared with `null`, and cannot precede joining.
HR changes retain the existing organization scoping and audit records.

Schema additions are in `prisma/migrations/20261028000000_expand_employee_profile`;
regenerate the Prisma client and apply migrations before deploying the API.

Run focused API tests with:

```bash
pnpm --dir apps/api test --runInBand --runTestsByPath \
  src/modules/auth/dto/profile.dto.spec.ts \
  src/modules/auth/services/profile.service.spec.ts \
  src/modules/hrms/services/hrms-employee.service.spec.ts
```

The opt-in `profile.persistence.spec.ts` additionally verifies actual database
round-trips, transactional rollback, and clearing fields. Set `PROFILE_DATABASE_TESTS=true`
and provide `DATABASE_URL` when running it. It creates uniquely identified synthetic
users and an organization, then deletes only those fixtures.
