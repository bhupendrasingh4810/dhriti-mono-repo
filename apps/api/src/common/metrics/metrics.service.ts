import { Injectable } from "@nestjs/common";

interface Counter {
  [labels: string]: number;
}

/**
 * Minimal in-process metrics registry that renders Prometheus text format.
 * Swap for prom-client / OpenTelemetry when you need push-based metrics or
 * richer instrumentation; the /metrics endpoint contract stays the same.
 */
@Injectable()
export class MetricsService {
  private readonly httpRequests: Counter = {};
  private readonly httpDurationBuckets: Record<string, number[]> = {};
  private billingWebhookRateLimitFailures = 0;
  private billingWebhookDeadLetters = 0;
  private wsConnections = 0;
  private wsMessages = 0;

  recordHttpRequest(method: string, route: string, status: number, durationMs: number): void {
    const key = `${method}|${route}|${status}`;
    this.httpRequests[key] = (this.httpRequests[key] ?? 0) + 1;

    const durationKey = `${method}|${route}`;
    (this.httpDurationBuckets[durationKey] ??= []).push(durationMs);
  }

  wsConnected(): void {
    this.wsConnections += 1;
  }

  wsDisconnected(): void {
    this.wsConnections = Math.max(0, this.wsConnections - 1);
  }

  billingWebhookRateLimitUnavailable(): void {
    this.billingWebhookRateLimitFailures += 1;
  }

  billingWebhookDeadLettered(count = 1): void {
    this.billingWebhookDeadLetters += count;
  }

  wsMessage(): void {
    this.wsMessages += 1;
  }

  render(): string {
    const lines: string[] = [
      "# HELP http_requests_total Total HTTP requests",
      "# TYPE http_requests_total counter",
    ];

    for (const [key, value] of Object.entries(this.httpRequests)) {
      const [method, route, status] = key.split("|");
      lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}`);
    }

    lines.push(
      "# HELP http_request_duration_ms_avg Average HTTP request duration in ms",
      "# TYPE http_request_duration_ms_avg gauge",
    );
    for (const [key, durations] of Object.entries(this.httpDurationBuckets)) {
      const [method, route] = key.split("|");
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      lines.push(`http_request_duration_ms_avg{method="${method}",route="${route}"} ${Math.round(avg * 100) / 100}`);
    }

    lines.push(
      "# HELP websocket_connections Current WebSocket connections",
      "# TYPE websocket_connections gauge",
      `websocket_connections ${this.wsConnections}`,
      "# HELP websocket_messages_total Total WebSocket messages",
      "# TYPE websocket_messages_total counter",
      `websocket_messages_total ${this.wsMessages}`,
      "# HELP billing_webhook_rate_limit_unavailable_total Billing webhook requests accepted while rate limiting is unavailable",
      "# TYPE billing_webhook_rate_limit_unavailable_total counter",
      `billing_webhook_rate_limit_unavailable_total ${this.billingWebhookRateLimitFailures}`,
      "# HELP billing_webhook_dead_letters_total Billing webhook events moved to the dead-letter state",
      "# TYPE billing_webhook_dead_letters_total counter",
      `billing_webhook_dead_letters_total ${this.billingWebhookDeadLetters}`,
    );

    return `${lines.join("\n")}\n`;
  }

  reset(): void {
    for (const key of Object.keys(this.httpRequests)) {
      delete this.httpRequests[key];
    }
    for (const key of Object.keys(this.httpDurationBuckets)) {
      delete this.httpDurationBuckets[key];
    }
    this.wsConnections = 0;
    this.wsMessages = 0;
    this.billingWebhookRateLimitFailures = 0;
    this.billingWebhookDeadLetters = 0;
  }
}
