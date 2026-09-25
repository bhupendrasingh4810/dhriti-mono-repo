# Monitoring and Alerts

The API provides public endpoints for `/v1/health/live`, `/v1/health/ready`, and `/v1/metrics`. Readiness returns 503 when PostgreSQL or Redis is unavailable. OpenTelemetry tracing is initialized before instrumented libraries in the API bootstrap.

The Redis Terraform module creates CloudWatch engine and slow-log outputs and an eviction alarm. The repository does not define a complete alert-routing or service-level-objectives configuration.

TODO Confirm with team: metrics collector, trace backend, dashboards, alert thresholds, escalation routing, and SLOs.
