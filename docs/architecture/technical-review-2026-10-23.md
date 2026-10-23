# Dhriti Monorepo Architecture and Technical Review

Date: 2026-10-23

## Scope

Read-only review of the web application, API and data layer, workspace tooling, tests, operations, infrastructure, and documentation. No code changes were made as part of this review.

## Implementation status

Follow-up hardening work completed after this review:

- Refresh-token rotation now uses an atomic predecessor-to-successor session transition, with focused concurrency/reuse tests.
- Tenant context is now bound to the authenticated session; `x-organization-id` can no longer switch tenants.
- A user can hold only one live organization membership. The API rejects cross-organization activation during organization creation, direct member addition, invitation acceptance, platform organization creation, and membership reactivation. A partial unique database index enforces the same invariant for `INVITED`, `ACTIVE`, and `SUSPENDED` memberships; removed memberships release the user for a future organization.
- Pull requests and pushes to `main` now run format, API and web lint/type checks, API tests/build, web build, and Prisma schema validation through GitHub Actions.
- Stripe subscription webhook payloads now use one shared Zod contract for verified input and persisted retry data. The event ledger claims retries atomically, applies bounded exponential retry delays, and dead-letters exhausted or timed-out work.
- The web application no longer declares unused MUI/Emotion dependencies; reusable MUI presentation remains isolated in `@dhriti/ui`.

## Unresolved decisions requiring team confirmation

The following items are intentionally documented rather than implemented because they require operational, product, or governance decisions that cannot be inferred from repository code:

- **TODO Confirm with team:** production hosting topology, container registry, environment promotion, migration ordering, health checks, rollback procedure, and accountable release owner.
- **TODO Confirm with team:** `/metrics` ingress/authentication policy, dashboard/SLO targets, alert routing, and on-call/incident ownership.
- **TODO Confirm with team:** branch protection, required review/check policy, `CODEOWNERS`, contribution process, and dependency-update ownership.
- **TODO Confirm with team:** the authoritative API-contract generation/adoption path and compatibility/versioning expectations before replacing existing DTO contracts.
- **TODO Confirm with team:** billing-provider reconciliation, replay/retention expectations, and ownership for dead-letter event investigation before automating remediation beyond bounded retries.

## Executive assessment

The repository has a promising foundation: a pnpm/Turbo monorepo, NestJS API, Prisma data layer, clear product areas, initial operational documentation, and a shared-package direction. It is currently closer to an evolving product prototype than a production-ready platform.

The largest concerns are:

1. Authorization and session correctness need hardening.
2. Release engineering, CI/CD, and production operations are incomplete.
3. Frontend state and UI boundaries are too concentrated and weakly tested.
4. API contracts are duplicated rather than shared and validated at runtime.
5. Several pages and workspace controls are still mock/demo-driven or non-functional.

## Highest-priority findings

| Priority | Area            | Finding                                                                          | Why it matters                                                                                              |
| -------- | --------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Critical | Auth/session    | Refresh-token rotation is vulnerable to concurrent refresh races.                | Concurrent requests can produce multiple valid successor states or inconsistent session state.              |
| High     | Tenant security | Tenant/membership enforcement is inconsistent across guards/controllers.         | A missed guard on a new organization-scoped route can become a cross-tenant data-access issue.              |
| High     | Delivery        | No checked-in CI/CD or production promotion workflow.                            | Builds, migrations, deployments, approvals, rollbacks, and security gates are not repeatable.               |
| High     | Frontend        | Workspace navigation/logout callbacks are no-ops.                                | Core shell interactions appear available but do not execute the intended behavior.                          |
| High     | Frontend        | `ConnectWorkspace` updates state during render.                                  | Fragile under React concurrent rendering and can create unnecessary/repeated renders.                       |
| High     | Testing         | Web application has no automated tests.                                          | Connect, tenant routing, dialogs, real-time behavior, and destructive workflows lack regression protection. |
| High     | Contracts       | Shared API contract packages are incomplete; frontend/API shapes are duplicated. | DTO and UI drift will become increasingly expensive and unsafe.                                             |
| High     | DX              | Root validation scripts are not consistently supported across all packages.      | Turbo results are unreliable or depend on missing-task behavior.                                            |

## Security, authorization, and tenancy

### Refresh-token rotation is not atomic

**Severity: Critical**

[`session.service.ts`](../../apps/api/src/modules/auth/services/session.service.ts) reads, validates, and then updates a session without an atomic conditional transition. Two simultaneous refresh requests can both pass the not-rotated check before either update occurs.

**Recommendations**

- Use a transaction or conditional update with `rotatedAt: null`, `revokedAt: null`, and expiry constraints.
- Reject rotation when no row is updated.
- Add concurrency tests that issue two refreshes for the same session.

### Organization membership validation is too easy to bypass accidentally

**Severity: High**

[`auth.guard.ts`](../../apps/api/src/common/guards/auth.guard.ts), [`access.guard.ts`](../../apps/api/src/common/guards/access.guard.ts), and [`organization-context.guard.ts`](../../apps/api/src/common/guards/organization-context.guard.ts) distribute tenant validation across multiple guard combinations. A future controller can be authenticated and still omit active organization-membership enforcement.

**Recommendations**

- Establish one mandatory organization-route policy.
- Make tenant context and active membership validation default for organization-scoped controllers.
- Explicitly carve out platform routes rather than relying on route-by-route guard composition.
- Add cross-tenant HTTP tests for every major module.

### Platform-role permissions may cross tenant boundaries

**Severity: High**

[`permission.service.ts`](../../apps/api/src/modules/authorization/services/permission.service.ts) appears to allow globally assigned platform permissions after a membership check, without consistently imposing organization-level scope.

**Recommendations**

- Define a formal distinction between platform operator bypass, organization-scoped permissions, and support access.
- Require explicit tenant scope for platform permissions unless a role is intentionally global.
- Log and audit all bypasses.

### Department/team permission scopes are only partially resolved

**Severity: High**

[`access.guard.ts`](../../apps/api/src/common/guards/access.guard.ts) resolves a limited set of resource scopes, while [`permission.service.ts`](../../apps/api/src/modules/authorization/services/permission.service.ts) supports department/team scopes.

**Recommendations**

- Create a resource-scope resolver registry by entity type.
- Require each scoped entity to register its organization, team, department, and project lookups.
- Test allow/deny behavior for every scope.

## Frontend architecture and product maturity

### `ConnectWorkspace` is too large and owns too much state

**Severity: High**

[`ConnectWorkspace.tsx`](../../apps/web/src/features/connect/ConnectWorkspace.tsx) acts as a page shell, menu controller, dialog controller, real-time coordinator, composer coordinator, conversation selector, and UI-state store. [`use-connect.ts`](../../apps/web/src/hooks/use-connect.ts) owns API loading, socket lifecycle, unread state, typing, receipts, pagination, messages, sidebar state, and mutations.

**Risks**

- Difficult to test.
- Broad rerender and invalidation surface.
- Race-condition risk around refreshes, socket events, and mutations.
- Feature work becomes increasingly expensive.

**Recommendations**

- Split Connect into `useConnectBootstrap`, `useConnectSocket`, `useConversationMessages`, `useConversationParticipants`, `useConnectSidebarPreferences`, and `useConnectMutations`.
- Use one source of truth for server state.
- Isolate ephemeral UI state from transport state.

### State is set during render

**Severity: High**

[`ConnectWorkspace.tsx`](../../apps/web/src/features/connect/ConnectWorkspace.tsx) compares current/previous conversations and calls state setters while rendering.

**Recommendations**

- Derive selected conversation from URL and loaded conversations.
- Move reconciliation to an effect only where needed.
- Prefer routing state as the source of truth for selected conversation.

### Workspace shell has disconnected behavior

**Severity: High**

[`layout.tsx`](<../../apps/web/src/app/(workspace)/layout.tsx>) passes no-op callbacks for navigation and logout.

**Recommendations**

- Wire navigation actions to Next router transitions.
- Connect logout to auth/session invalidation.
- Add smoke tests for workspace navigation, logout, and tenant switching.

### Production UI is still partially mock-driven

**Severity: Medium**

The workspace shell imports Connect mocks, and [`home/page.tsx`](<../../apps/web/src/app/(workspace)/[organizationSlug]/home/page.tsx>) contains static demo dashboard data and controls without persistence/navigation behavior.

**Recommendations**

- Remove mocks from production route composition.
- Clearly separate Storybook/demo fixtures from runtime data.
- Track incomplete controls as disabled or coming soon rather than presenting inert actions.

### Page/component boundaries need refinement

**Severity: Medium**

The home page is a large route-level component combining data, state, behavior, and presentation.

**Recommendations**

- Extract `HomeSummary`, `MyTasksPanel`, `MentionsPanel`, `RecentActivityPanel`, and `useHomeDashboard`.
- Make feature sections independently testable and reusable.

### Design-system adoption is inconsistent

**Severity: Medium**

### MUI/Emotion retirement boundary

**Status: completed for active workspace consumers; external API migration remains unsafe**

`apps/web` now consumes only the native `ThemeProvider`, `AIResponse`, and
`Dialog` exports from [`packages/ui`](../../packages/ui/). The MUI/Emotion
implementation and its package dependencies were removed after a repository-wide
consumer audit found no active use of the legacy component exports.

The retired `@dhriti/ui/mui` entry point and MUI-shaped APIs (including `sx`,
MUI event signatures, theme overrides, and picker adapters) cannot be safely
preserved without retaining MUI. Any consumer outside this workspace must
migrate explicitly to native/Tailwind component props before upgrading; no
compatibility shim is provided. The active `@dhriti/ui/dialog` and
`@dhriti/ui/components/dialog` entry points remain stable and now resolve to
the native dialog implementation.

The codebase has [`packages/ui`](../../packages/ui/) and theme definitions, but many application surfaces use raw Tailwind utilities and repeated literal styling choices.

**Recommendations**

- Define a shared-component policy.
- Move common buttons, cards, menu rows, status pills, empty states, dialogs, and tables into `packages/ui`.
- Enforce token-only colors, spacing, and typography in new code.
- Add Storybook coverage for reusable primitives.

## API contracts and data architecture

### Shared contracts are not truly shared

**Severity: High**

[`packages/validation/src/index.ts`](../../packages/validation/src/index.ts) and [`packages/api-client/src/types.ts`](../../packages/api-client/src/types.ts) are incomplete relative to the API. The frontend duplicates service request/response types in places, and generic transport helpers trust TypeScript-only response declarations.

**Recommendations**

- Adopt one contract strategy: OpenAPI generation, shared Zod schemas, or TypeBox/tRPC-like contracts.
- Validate API input and output at runtime.
- Generate the API client.
- Eliminate duplicated DTO/service shapes.
- Version externally consumable contracts.

### Runtime API responses are not validated in the web app

**Severity: High**

[`request.service.ts`](../../apps/web/src/services/request.service.ts) accepts generic response types but does not verify runtime response shape.

**Recommendations**

- Parse external responses through shared Zod schemas.
- Surface schema mismatch errors with endpoint and request correlation context.
- Treat API validation as a boundary concern, not just a TypeScript concern.

### Webhook delivery needs idempotency

**Severity: High**

The webhook persistence model lacks a stable event/delivery idempotency key.

**Recommendations**

- Store provider event IDs.
- Add unique constraints for webhook/event pairs.
- Make delivery retries idempotent.
- Record attempt history separately from the logical delivery.

### Background retry leasing can overlap

**Severity: Medium**

[`billing-webhook-retry.job.ts`](../../apps/api/src/jobs/billing-webhook-retry.job.ts) uses a fixed lease without renewal.

**Recommendations**

- Use renewable leases.
- Use database row leasing with `FOR UPDATE SKIP LOCKED`, or equivalent queue semantics.
- Bound batch duration and publish lease ownership/heartbeat metrics.

### Migration governance needs strengthening

**Severity: Medium**

The migration directory has duplicate timestamp prefixes, which makes ordering and review discipline ambiguous.

**Recommendations**

- Enforce unique migration identifiers in CI.
- Use expand/contract migrations for non-breaking deployment.
- Test migrations against an ephemeral production-like database.
- Require rollback/forward remediation notes for every migration.

## Testing and quality gaps

### Web application lacks automated tests

**Severity: High**

[`apps/web/package.json`](../../apps/web/package.json) has no test script, and the frontend review found no page/component specs.

**What is missing**

- Component tests.
- Hook tests.
- Browser tests.
- Accessibility tests.
- API contract tests.
- Regression tests for real-time behavior.

**Recommended baseline**

- Unit: Vitest and React Testing Library.
- Browser: Playwright for authentication, tenant routing, Connect, Flow, and destructive actions.
- Accessibility: axe checks on critical pages/dialogs.
- API: controller contract and cross-tenant integration tests.
- Data: migration and transaction-race tests.

### Quality gates are not enforceable repository-wide

**Severity: High**

[`turbo.json`](../../turbo.json) invokes standard tasks, but packages do not consistently define them. For example, [`packages/ui/package.json`](../../packages/ui/package.json) and [`packages/web-sdk/package.json`](../../packages/web-sdk/package.json) expose different task sets.

**Recommendations**

Standardize every workspace package around:

```text
lint
typecheck
test
build
format:check
```

If a task is not relevant, explicitly configure the policy rather than silently omitting it.

## Delivery, operations, and infrastructure

### No executable CI/CD is checked in

**Severity: High**

The review found no checked-in GitHub Actions workflow, while [`deployment-runbook.md`](../operations/deployment-runbook.md) acknowledges missing production workflow details.

**Missing**

- PR validation.
- Build artifacts.
- Image publishing.
- Migration gate.
- Security scanning.
- Environment promotion.
- Rollback.
- Release ownership.

**Minimum CI pipeline**

1. Install with locked pnpm.
2. Format check.
3. Lint.
4. Typecheck.
5. Unit/component tests.
6. API integration tests.
7. Build packages/apps.
8. Prisma schema and migration validation.
9. Dependency/security scanning.
10. Publish immutable artifacts only after protected-branch approval.

### Production hosting topology is unresolved

**Severity: High**

Docker and Compose assets exist, but production hosting, registry, ingress/TLS, environment promotion, and rollback mechanics are not defined.

**Recommendations**

Document and automate the runtime target, registry, image tags, secret source, environment topology, database migration order, deployment health checks, rollback mechanism, and incident ownership.

### Local development secrets fail open

**Severity: High, scoped to local configuration**

[`docker-compose.yml`](../../infrastructure/docker/docker-compose.yml) uses default database credentials and fallback JWT-like secrets.

**Recommendations**

- Keep defaults only in a clearly labeled `.env.example`.
- Fail startup for non-development environments when secrets are absent.
- Add configuration validation for secret strength and environment-specific requirements.

### Metrics and observability are incomplete

**Severity: Medium**

The API has health/metrics/tracing foundations, but lacks documented dashboards, SLOs, alert routing, collector config, or escalation ownership. Metrics exposure also needs a clear network/authentication policy.

Relevant files:

- [`metrics.controller.ts`](../../apps/api/src/common/metrics/metrics.controller.ts)
- [`health.controller.ts`](../../apps/api/src/health/health.controller.ts)
- [`monitoring-and-alerts.md`](../operations/monitoring-and-alerts.md)

**Recommendations**

- Define SLOs for API availability, latency, websocket reliability, job latency, and error rates.
- Restrict `/metrics` by ingress/network policy or collector authentication.
- Add dashboards and actionable alerts.
- Define on-call and incident ownership.

### Repository governance is not defined

**Severity: Medium-High**

The repository lacks visible ownership and contribution governance.

**Missing**

- `CODEOWNERS`
- Contribution policy
- Protected-branch policy
- Required review/check policy
- Release owner
- Incident owner
- Dependency-update policy

## What the platform currently lacks

1. A cohesive contract-first API strategy.
2. A reliable test pyramid, especially for web and tenant isolation.
3. An enforceable CI/CD and release process.
4. A clear production deployment model.
5. A complete authorization/tenant boundary model.
6. A queue/job ownership model for retries and asynchronous work.
7. SLOs, dashboards, alerting, and operational ownership.
8. Consistent shared UI/design-system enforcement.
9. Clear separation of mock/demo content from production features.
10. Repository governance and engineering standards enforcement.

## Recommended roadmap

### Immediate: next 1-2 weeks

- Fix atomic refresh-token rotation.
- Make tenant membership validation mandatory for organization routes.
- Remove no-op workspace navigation/logout behavior.
- Add a CI workflow for formatting, lint, typecheck, build, API tests, and Prisma validation.
- Remove/fix the broken `dev:worker` command in [`package.json`](../../package.json).
- Add basic web test infrastructure and critical smoke tests.
- Lock down metrics exposure and non-development secret validation.

### Near-term: next 30-60 days

- Split [`use-connect.ts`](../../apps/web/src/hooks/use-connect.ts) and [`ConnectWorkspace.tsx`](../../apps/web/src/features/connect/ConnectWorkspace.tsx) into focused modules.
- Introduce generated/shared API schemas and a validated client.
- Replace runtime mock data in workspace/home routes.
- Add browser tests for auth, tenant boundaries, Connect messaging, and Flow workflows.
- Establish migration compatibility and webhook idempotency practices.
- Define production deployment topology and environment promotion.

### Strategic: next quarter

- Complete shared UI package adoption and Storybook coverage.
- Establish SLOs, dashboards, alerting, and incident ownership.
- Formalize role/scope policy, including platform-admin behavior.
- Add repository governance: ownership, ADR process, review policies, and release management.

## Conclusion

The architecture is salvageable and has solid building blocks, but security boundaries, delivery automation, and test coverage should be prioritized before expanding product scope significantly.
