import { randomUUID } from "node:crypto";

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

import { AppError } from "../errors/app-error";
import { ErrorCode, type ErrorResponseBody } from "../errors/error-codes";

interface ValidationExceptionResponse {
  message?: string | string[];
}

/**
 * Global HTTP exception filter for handling and normalizing exceptions.
 * Catches all exceptions thrown in the application and formats them into a consistent error response structure.
 * Normalizes different types of exceptions into a unified error response format.
 * Adds correlation IDs and timestamps to error responses for better traceability.
 * Provides a centralized mechanism for handling errors consistently across the application.
 * Ensures that all errors are logged appropriately for monitoring and debugging purposes.
 * Supports both application-specific errors and standard HTTP exceptions.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const responseCorrelationId = response.getHeader("x-correlation-id");
    const correlationId = typeof responseCorrelationId === "string" ? responseCorrelationId : randomUUID();

    const { status, code, message, details } = this.normalize(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = {
      error: {
        code,
        status,
        message,
        ...(details !== undefined ? { details } : {}),
        correlationId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(body);
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof AppError) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as ValidationExceptionResponse | string;
      const rawMessage =
        typeof response === "string" ? response : (response.message ?? exception.message);
      const isArrayMessage = Array.isArray(rawMessage);

      return {
        status,
        code: isArrayMessage ? ErrorCode.VALIDATION_FAILED : ErrorCode.INTERNAL_ERROR,
        message: isArrayMessage ? "Validation failed" : String(rawMessage),
        details: isArrayMessage ? { fields: rawMessage } : undefined,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
    };
  }
}
