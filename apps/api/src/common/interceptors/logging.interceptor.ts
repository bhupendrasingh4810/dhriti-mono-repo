import { randomUUID } from "node:crypto";

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";

const PII_KEYS = new Set(["password", "token", "secret", "authorization", "cookie", "refreshToken", "accessToken"]);

function mask(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(mask);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = PII_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : mask(val);
    }
    return out;
  }
  return value;
}

/**
 * Attaches a correlation id to every request and logs a structured JSON line
 * for each completed request (method, path, status, duration, user, org).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const correlationId =
      (request.headers["x-correlation-id"] as string | undefined) ?? randomUUID();
    this.cls.set("correlationId", correlationId);
    response.setHeader("x-correlation-id", correlationId);

    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response, correlationId, startedAt, null),
        error: (error: unknown) =>
          this.log(request, response, correlationId, startedAt, error),
      }),
    );
  }

  private log(
    request: Request,
    response: Response,
    correlationId: string,
    startedAt: bigint,
    error: unknown,
  ): void {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const user = (request as Request & { user?: { userId?: string; organizationId?: string } }).user;

    const entry = {
      level: error ? "error" : "info",
      correlationId,
      method: request.method,
      path: request.originalUrl.split("?")[0],
      status: response.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: user?.userId ?? null,
      organizationId: user?.organizationId ?? null,
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null,
      query: mask(request.query),
      timestamp: new Date().toISOString(),
      ...(error
        ? { error: error instanceof Error ? error.message : String(error) }
        : {}),
    };

    const line = JSON.stringify(entry);
    if (error) {
      this.logger.error(line);
    } else {
      this.logger.log(line);
    }
  }
}
