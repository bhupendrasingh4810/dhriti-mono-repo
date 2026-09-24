# Schema Overview

Dhriti uses PostgreSQL through Prisma. The authored schema is split across `prisma/parts`; `scripts/build-prisma-schema.sh` produces `prisma/schema.prisma` for Prisma commands.

The schema fragments cover organizations and access, platform control, Connect, work management, HRMS, Nexus, notifications, webhooks, and managed content. See the detailed [Database Guide](README.md) for the fragment list and migration workflow.

TODO Confirm with team: data residency and retention requirements.