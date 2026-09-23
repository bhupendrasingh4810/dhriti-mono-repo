import { CanActivate, ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import type { Request } from "express";

import { ApiConfigService } from "../../config/config.service";
import { AppError } from "../errors/app-error";
import { ErrorCode } from "../errors/error-codes";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class PublicAuthRateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService, private readonly config: ApiConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const route = request.route?.path ?? request.path;
    const key = `rate-limit:public-auth:${route}:${request.ip || "unknown"}`;
    const limit = this.config.publicAuthRateLimit;
    try {
      const count = await this.redis.raw.incr(key);
      if (count === 1) await this.redis.raw.expire(key, limit.windowSeconds);
      if (count > limit.maxRequests) throw new AppError(ErrorCode.RATE_LIMITED, "Too many requests", HttpStatus.TOO_MANY_REQUESTS);
      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Authentication service is temporarily unavailable", HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}