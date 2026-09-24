terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "redis_replication_group_id" {
  type        = string
  description = "Globally unique identifier for the ElastiCache replication group."
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "Private subnets in at least two availability zones."
}

variable "redis_security_group_ids" {
  type        = list(string)
  description = "Security groups that restrict Redis ingress to application workloads."
}

variable "redis_auth_password" {
  type        = string
  sensitive   = true
  description = "Password for the application Redis ACL user; provide through a secrets-aware CI system."

  validation {
    condition     = length(var.redis_auth_password) >= 16
    error_message = "redis_auth_password must be at least 16 characters."
  }
}

variable "redis_node_type" {
  type        = string
  default     = "cache.t4g.small"
  description = "ElastiCache node type."
}

variable "alarm_actions" {
  type        = list(string)
  default     = []
  description = "SNS topic ARNs or other CloudWatch alarm actions."
}

locals {
  redis_name = replace(var.redis_replication_group_id, "_", "-")
}

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/${local.redis_name}/slow-log"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  name              = "/aws/elasticache/${local.redis_name}/engine-log"
  retention_in_days = 30
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.redis_name}-subnets"
  subnet_ids = var.private_subnet_ids
}

resource "aws_elasticache_user" "application" {
  user_id       = "${local.redis_name}-application"
  user_name     = "application"
  engine         = "REDIS"
  access_string  = "on ~* +@all"

  authentication_mode {
    type      = "password"
    passwords = [var.redis_auth_password]
  }
}

resource "aws_elasticache_user" "default" {
  user_id      = "${local.redis_name}-default"
  user_name    = "default"
  engine       = "REDIS"
  access_string = "off -@all"
}

resource "aws_elasticache_user_group" "application" {
  engine        = "REDIS"
  user_group_id = "${local.redis_name}-application"
  user_ids      = [aws_elasticache_user.default.user_id, aws_elasticache_user.application.user_id]
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = local.redis_name
  description                = "Dhriti managed Redis"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = var.redis_node_type
  port                       = 6379
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled           = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = var.redis_security_group_ids
  user_group_ids             = [aws_elasticache_user_group.application.id]

  snapshot_retention_limit = 7
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "sun:04:00-sun:05:00"

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${local.redis_name}-evictions"
  alarm_description   = "Redis is evicting keys; investigate memory pressure or cache policy."
  namespace           = "AWS/ElastiCache"
  metric_name         = "Evictions"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.redis.replication_group_id
  }
}

output "redis_primary_endpoint" {
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  description = "Primary endpoint for the application's rediss:// connection string."
}