import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";

import { MetricsService } from "./metrics.service";

/** Records request count + duration into the metrics registry. */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = process.hrtime.bigint();
    const route = this.normalizeRoute(request);

    return next.handle().pipe(
      tap({
        next: () => this.record(request, response, startedAt, route),
        error: () => this.record(request, response, startedAt, route),
      }),
    );
  }

  private record(request: Request, response: Response, startedAt: bigint, route: string): void {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    this.metrics.recordHttpRequest(request.method, route, response.statusCode, durationMs);
  }

  /** Collapses path params so /v1/organization/flow/issues/abc → .../issues/:id. */
  private normalizeRoute(request: Request): string {
    const path = request.originalUrl.split("?")[0];
    return path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,36}/gi, ":id").replace(/\/\d+(\/|$)/g, "/:n$1");
  }
}
