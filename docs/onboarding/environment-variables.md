# Environment Variables

The definitive API contract is [`env.validation.ts`](../../apps/api/src/config/env.validation.ts). Do not copy secrets into documentation or commit environment files.

| Group                      | Variables                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Runtime and browser origin | `NODE_ENV`, `PORT`, `API_PREFIX`, `WEB_APP_URL`, `ONBOARDING_URL`, `CORS_ORIGINS`                                                 |
| Data services              | `DATABASE_URL`, `REDIS_URL`                                                                                                       |
| Authentication             | `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_MFA_SECRET`, `JWT_MFA_TTL_SECONDS`, `REFRESH_TOKEN_TTL_DAYS`, `BCRYPT_ROUNDS` |
| Files                      | `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`                                               |
| Optional integrations      | Google and GitHub OAuth variables, Brevo sender variables, `OPENAI_API_KEY`, Stripe webhook variables                             |

`WEB_APP_URL`, `ONBOARDING_URL`, `CORS_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, both JWT secrets, and `S3_BUCKET` are required by the validation schema. In production, `SECRETS_ENCRYPTION_KEY` must be a base64-encoded 32-byte key. OAuth provider settings must be supplied as complete ID, secret, and callback URL triplets.

TODO Confirm with team: approved secret manager, environment-file distribution, and production values.
