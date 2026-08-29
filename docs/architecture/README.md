# Architecture

This repository follows a layered monorepo design with shared packages and discrete deployment targets.

- `apps/web`: product website and application shell
- `apps/api`: backend service layer
- `apps/worker`: async job processing
- `packages/*`: reusable code, configuration, and contracts
- `infrastructure/*`: environment and deployment manifests
- `docs/*`: product, API, architecture, and decision records
