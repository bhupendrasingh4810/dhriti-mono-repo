import { HttpStatus, Injectable, Logger } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { ApiConfigService } from "../../config/config.service";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class ConnectRateLimitService {
  private readonly logger = new Logger(ConnectRateLimitService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ApiConfigService,
  ) {}

  async assertAllowed(organizationId: string, userId: string, eventName: string): Promise<void> {
    try {
      const settings = this.config.connectSocket;
      const count = await this.redis.incrementWithExpiry(
        `rate-limit:connect:${organizationId}:${userId}:${eventName}`,
        settings.rateLimitWindowSeconds,
      );
      if (count > settings.rateLimitMaxEvents) {
        throw new AppError(ErrorCode.RATE_LIMITED, "Too many Connect events", HttpStatus.TOO_MANY_REQUESTS);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.logger.warn(`Connect rate limiting unavailable for event=${eventName}; accepting event`);
    }
  }
}