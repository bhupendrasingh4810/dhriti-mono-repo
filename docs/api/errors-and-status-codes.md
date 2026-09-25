# Errors and Status Codes

The global HTTP exception filter normalizes application errors and adds correlation information. Validation rejects non-whitelisted request fields. Use the correlation ID from an error response when investigating server-side logs.

| Condition evidenced in code                            | Status                   |
| ------------------------------------------------------ | ------------------------ |
| Request validation failure                             | 400                      |
| Missing or invalid authentication                      | 401                      |
| Authorization or tenant access denied                  | 403                      |
| Missing resource, such as a Connect channel or message | 404                      |
| Unready PostgreSQL or Redis dependency                 | 503 from `/health/ready` |
| Unhandled server error                                 | 500                      |

Connect service errors include `CHANNEL_NOT_FOUND`, `MESSAGE_NOT_FOUND`, and `FORBIDDEN`. Error-code coverage is implementation-specific; consult the relevant controller or service before treating any code as a public integration contract.

TODO Confirm with team: public error-code compatibility and retry guidance.
