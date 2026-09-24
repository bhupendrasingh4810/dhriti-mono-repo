# Dhriti Documentation

This portal documents behavior verified from the repository as of 2026-09-25. It distinguishes implemented behavior from decisions that need team confirmation.

## Guides

- **Onboarding:** [Local development](onboarding/local-development.md), [repository structure](onboarding/repository-structure.md), and [environment variables](onboarding/environment-variables.md).
- **API:** [Overview](api/overview.md), [endpoints](api/endpoints.md), [authentication](api/authentication.md), and [errors and status codes](api/errors-and-status-codes.md).
- **Architecture:** [System overview](architecture/system-overview.md), [backend modules](architecture/backend-modules.md), and [data flow](architecture/data-flow.md).
- **Decisions:** [ADR-001](decisions/ADR-001-authorization-subscription-migration.md) and [ADR-002](decisions/ADR-002-redis-cache-policy.md).
- **Database:** [Schema overview](database/schema-overview.md), [entity relationship diagram](database/entity-relationship-diagram.md), and [data model notes](database/data-model-notes.md).
- **Operations:** [Deployment runbook](operations/deployment-runbook.md), [monitoring and alerts](operations/monitoring-and-alerts.md), [backup and recovery](operations/backup-and-recovery.md), and [incident response](operations/incident-response.md).
- **Management:** [Project status template](management/project-status-template.md), [roadmap template](management/roadmap-template.md), and [technical debt register](management/technical-debt-register.md).
- **Client:** [Functional specification](client/functional-specification.md) and [security and compliance summary](client/security-and-compliance-summary.md).

The existing [onboarding](onboarding.md), [API](api/README.md), [architecture](architecture/overview.md), [database](database/README.md), [operations](operations/README.md), [management](management/README.md), [client](client/README.md), and [decisions](decisions/README.md) guides remain the detailed evidence sources.

## Documentation rule

Use checked-in code, configuration, schema, migrations, and infrastructure files as evidence. When a process, owner, environment, service-level objective, or external integration is not established by those sources, record `TODO Confirm with team` instead of inferring it.
