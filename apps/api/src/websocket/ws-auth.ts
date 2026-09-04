import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Socket } from "socket.io";

import { ApiConfigService } from "../config/config.service";
import { SessionService } from "../modules/auth/session.service";
import type { AccessTokenPayload } from "../common/guards/auth.guard";

export interface WsPrincipal {
  userId: string;
  sessionId: string;
  organizationId: string | null;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  data: { principal?: WsPrincipal };
}

/**
 * Authenticates a WebSocket handshake using the same access token + active
 * session rules as the HTTP AuthGuard.
 */
@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ApiConfigService,
    private readonly sessions: SessionService,
  ) {}

  async authenticate(socket: Socket): Promise<WsPrincipal> {
    const token = this.extractToken(socket);
    if (!token) {
      throw new UnauthorizedException("Missing bearer token in WebSocket handshake");
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException("Access token is invalid or expired");
    }

    const active = await this.sessions.isSessionActive(payload.sid);
    if (!active) {
      throw new UnauthorizedException("Session is no longer active");
    }

    const principal: WsPrincipal = {
      userId: payload.sub,
      sessionId: payload.sid,
      organizationId: payload.org,
      email: payload.email,
    };
    (socket as AuthenticatedSocket).data.principal = principal;
    return principal;
  }

  getPrincipal(socket: Socket): WsPrincipal {
    const principal = (socket as AuthenticatedSocket).data.principal;
    if (!principal) {
      throw new UnauthorizedException("Socket is not authenticated");
    }
    return principal;
  }

  private extractToken(socket: Socket): string | null {
    const auth = socket.handshake.auth as Record<string, unknown> | undefined;
    const authToken = auth?.token;
    if (typeof authToken === "string" && authToken.length > 0) {
      return authToken;
    }

    const header = socket.handshake.headers.authorization;
    if (header?.toLowerCase().startsWith("bearer ")) {
      return header.slice(7);
    }
    return null;
  }
}
