# Managed Redis

This module provisions AWS ElastiCache Redis for production. It requires private subnet IDs, an application-only security group, and a Redis ACL password supplied through a secrets-aware CI system.

It enables TLS in transit, encryption at rest, an authenticated ACL user, two-node multi-AZ failover, seven-day snapshots, CloudWatch slow/engine logs, and an eviction alarm.

Set the API's `REDIS_URL` from the primary endpoint using `rediss://application:<url-encoded-password>@<endpoint>:6379`. Do not expose the endpoint publicly or store the password in Terraform state files. Use an encrypted remote state backend with restricted access.