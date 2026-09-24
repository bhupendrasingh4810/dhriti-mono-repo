# Incident Response

For a service symptom, first check the API liveness, readiness, and metrics endpoints. Preserve the response correlation ID from API errors for log investigation. Readiness distinguishes process availability from PostgreSQL and Redis dependency availability.

The repository does not define severity levels, an incident commander role, communications channels, paging, or post-incident review requirements.

TODO Confirm with team: incident severity model, on-call roster, escalation path, stakeholder communications, and post-incident process.