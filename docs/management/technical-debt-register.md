# Technical Debt Register

| Item | Evidence | Impact | Proposed action | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| Root `dev:worker` script references a missing `apps/worker` directory | Root package manifest and repository structure | Development command may fail | Confirm intended worker boundary | TODO Confirm with team | Open |
| Production deployment surface is not checked in | Docker and Terraform documentation | Runbook cannot establish deployment or rollback | Document delivery workflow | TODO Confirm with team | Open |
| API client is minimal and not an endpoint SDK | [Client Guide](../client/README.md) | Consumers arrange API concerns independently | Confirm client ownership and contract | TODO Confirm with team | Open |

TODO Confirm with team: debt-review cadence, scoring, and ownership model.