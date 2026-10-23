import { Injectable, Logger } from "@nestjs/common";
import type { UserSession } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { ApiConfigService } from "../../../config/config.service";
import { TokenService } from "./token.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { HttpStatus } from "@nestjs/common";
import { SESSION_REVOCATION_CHANNEL } from "../../../common/auth/session-revocation";

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

  /**
   * Creates a new session for a user.
   * @param userId The ID of the user for whom to create the session.
   * @param organizationId The ID of the organization associated with the user, or null if none.
   * @param context Optional session context containing IP address and user agent.
   * @returns The issued session containing the session ID, refresh token, and expiration date.
   */
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

    await this.trackSession(session);

    return { sessionId: session.id, refreshToken, expiresAt };
  }

  /**
   * Rotates a refresh token. Reuse of a revoked/expired token revokes every
   * session for the user (token-theft signal).
   * @param refreshToken The refresh token to rotate.
   * @param context Optional session context containing IP address and user agent.
   * @returns The newly issued session containing the session ID, refresh token, and expiration date.
   */
  async rotateSession(refreshToken: string, context: SessionContext = {}): Promise<IssuedSession> {
    const tokenHash = this.tokens.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: tokenHash },
    });

    if (!session) {
      throw new AppError(ErrorCode.TOKEN_INVALID, "Refresh token is not recognized", HttpStatus.UNAUTHORIZED);
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

    const nextSession = await this.prisma.$transaction(async (tx) => {
      const transition = await tx.userSession.updateMany({
        where: {
          id: session.id,
          refreshTokenHash: tokenHash,
          rotatedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { rotatedAt: now, revokedAt: now },
      });
      if (transition.count !== 1) {return null;}

      return tx.userSession.create({
        data: {
          userId: session.userId,
          organizationId: session.organizationId,
          refreshTokenHash: this.tokens.hashToken(nextRefreshToken),
          ipAddress: context.ipAddress ?? session.ipAddress,
          userAgent: context.userAgent ?? session.userAgent,
          expiresAt: session.expiresAt,
        },
      });
    });

    if (!nextSession) {
      await this.revokeAllUserSessions(session.userId);
      this.logger.warn(`Refresh token reuse detected for user=${session.userId}; all sessions revoked`);
      throw new AppError(
        ErrorCode.REFRESH_TOKEN_REUSED,
        "Refresh token was already used; all sessions have been revoked",
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.redis.delete(sessionKey(session.id));
    await this.redis.raw.publish(SESSION_REVOCATION_CHANNEL, session.id);
    await this.trackSession(nextSession);

    return { sessionId: nextSession.id, refreshToken: nextRefreshToken, expiresAt: nextSession.expiresAt };
  }

  /**
   * Checks if a session is currently active.
   * @param sessionId The ID of the session to check.
   * @returns A boolean indicating whether the session is active.
   */
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

  /**
   * Revokes a specific session.
   * @param sessionId The ID of the session to revoke.
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.redis.delete(sessionKey(sessionId));
    await this.redis.raw.publish(SESSION_REVOCATION_CHANNEL, sessionId);
  }

  /**
   * Revokes all sessions for a specific user, optionally excluding a specific session.
   * @param userId The ID of the user whose sessions are to be revoked.
   * @param exceptSessionId Optional session ID to exclude from revocation.
   * @returns The number of sessions revoked.
   */
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    });

    const sessionsKey = userSessionsKey(userId);
    const sessionIds = await this.redis.raw.smembers(sessionsKey);
    const revokedSessionIds = sessionIds.filter((sessionId) => sessionId !== exceptSessionId);
    if (revokedSessionIds.length > 0) {
      await this.redis.delete(...revokedSessionIds.map(sessionKey));
      await this.redis.raw.srem(sessionsKey, ...revokedSessionIds);
      await Promise.all(revokedSessionIds.map((sessionId) => this.redis.raw.publish(SESSION_REVOCATION_CHANNEL, sessionId)));
    }
    return result.count;
  }

  /**
   * Retrieves the organization ID associated with a specific session.
   * @param sessionId The ID of the session.
   * @returns The organization ID if available, otherwise null.
   */
  async getSessionOrganization(sessionId: string): Promise<string | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { organizationId: true },
    });
    return session?.organizationId ?? null;
  }

  /**
   * Sets the organization ID for a specific session.
   * @param sessionId The ID of the session.
   * @param organizationId The organization ID to associate with the session.
   */
  async setSessionOrganization(sessionId: string, organizationId: string): Promise<void> {
    const session = await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { organizationId },
    });
    await this.cacheSession(session);
  }

  /**
   * Caches the session data in Redis with an expiration time.
   * @param session The session object to cache.
   */
  private async cacheSession(session: UserSession): Promise<void> {
    const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    const payload: SessionCachePayload = {
      userId: session.userId,
      organizationId: session.organizationId,
      expiresAt: session.expiresAt.toISOString(),
    };
    await this.redis.setJson(sessionKey(session.id), payload, ttlSeconds);
  }

  private async trackSession(session: UserSession): Promise<void> {
    await this.cacheSession(session);
    const sessionTtlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    await this.redis.raw
      .multi()
      .sadd(userSessionsKey(session.userId), session.id)
      .expire(userSessionsKey(session.userId), sessionTtlSeconds)
      .exec();
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  }
}
