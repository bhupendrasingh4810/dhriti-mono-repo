import { Injectable, Logger } from "@nestjs/common";
import type { UserSession } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { ApiConfigService } from "../../../config/config.service";
import { TokenService } from "./token.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { HttpStatus } from "@nestjs/common";

interface SessionCachePayload {
  userId: string;
  organizationId: string | null;
  expiresAt: string;
}

export interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface IssuedSession {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}

const sessionKey = (sessionId: string): string => `auth:session:${sessionId}`;
const userSessionsKey = (userId: string): string => `auth:user-sessions:${userId}`;

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokens: TokenService,
    private readonly config: ApiConfigService,
  ) {}

  async createSession(
    userId: string,
    organizationId: string | null,
    context: SessionContext = {},
  ): Promise<IssuedSession> {
    const refreshToken = this.tokens.generateOpaqueToken();
    const expiresAt = this.refreshExpiry();

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        organizationId,
        refreshTokenHash: this.tokens.hashToken(refreshToken),
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        expiresAt,
      },
    });

    await this.cacheSession(session);
    await this.redis.raw.sadd(userSessionsKey(userId), session.id);

    return { sessionId: session.id, refreshToken, expiresAt };
  }

  /**
   * Rotates a refresh token. Reuse of a revoked/expired token revokes every
   * session for the user (token-theft signal).
   */
  async rotateSession(refreshToken: string, context: SessionContext = {}): Promise<IssuedSession> {
    const tokenHash = this.tokens.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: tokenHash },
    });

    if (!session) {
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        "Refresh token is not recognized",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const now = new Date();
    const compromised = session.revokedAt !== null || session.rotatedAt !== null || session.expiresAt <= now;
    if (compromised) {
      await this.revokeAllUserSessions(session.userId);
      this.logger.warn(`Refresh token reuse detected for user=${session.userId}; all sessions revoked`);
      throw new AppError(
        ErrorCode.REFRESH_TOKEN_REUSED,
        "Refresh token was already used; all sessions have been revoked",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const nextRefreshToken = this.tokens.generateOpaqueToken();
    const expiresAt = this.refreshExpiry();

    const updated = await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        rotatedAt: now,
        refreshTokenHash: this.tokens.hashToken(nextRefreshToken),
        expiresAt,
        ipAddress: context.ipAddress ?? session.ipAddress,
        userAgent: context.userAgent ?? session.userAgent,
      },
    });

    await this.cacheSession(updated);

    return { sessionId: updated.id, refreshToken: nextRefreshToken, expiresAt };
  }

  async isSessionActive(sessionId: string): Promise<boolean> {
    const cached = await this.redis.getJson<SessionCachePayload>(sessionKey(sessionId));
    if (cached) {
      return new Date(cached.expiresAt) > new Date();
    }

    const session = await this.prisma.userSession.findUnique({ where: { id: sessionId } });
    if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
      return false;
    }

    await this.cacheSession(session);
    return true;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.redis.delete(sessionKey(sessionId));
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    });

    await this.redis.deleteByPattern("auth:session:*");
    await this.redis.delete(userSessionsKey(userId));
    return result.count;
  }

  async getSessionOrganization(sessionId: string): Promise<string | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { organizationId: true },
    });
    return session?.organizationId ?? null;
  }

  private async cacheSession(session: UserSession): Promise<void> {
    const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    const payload: SessionCachePayload = {
      userId: session.userId,
      organizationId: session.organizationId,
      expiresAt: session.expiresAt.toISOString(),
    };
    await this.redis.setJson(sessionKey(session.id), payload, ttlSeconds);
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  }
}
