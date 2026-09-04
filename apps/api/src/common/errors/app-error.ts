import { HttpException, HttpStatus } from "@nestjs/common";

import type { ErrorCode } from "./error-codes";

export class AppError extends HttpException {
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status: HttpStatus, details?: unknown) {
    super(message, status);
    this.code = code;
    this.details = details;
  }

  static unauthorized(message = "Authentication required"): AppError {
    return new AppError("UNAUTHORIZED" as ErrorCode, message, HttpStatus.UNAUTHORIZED);
  }
}
