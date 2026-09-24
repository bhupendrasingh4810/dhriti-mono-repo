# API Overview

The NestJS API uses the configurable prefix `v1`, so the local Docker base URL is `http://localhost:3001/v1`. Swagger is available outside production at `/v1/docs` and is the implementation-derived reference for DTOs and response shapes.

The API globally applies validation, authentication, request logging, metrics, and exception handling. Health and metrics endpoints are explicitly public. See the fuller [API Guide](README.md), [Authentication](authentication.md), and [Endpoints](endpoints.md).

TODO Confirm with team: external API versioning and deprecation policy.