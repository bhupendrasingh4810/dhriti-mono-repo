import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

import { ApiConfigService } from "../../config/config.service";
import {
  IS_PUBLIC_KEY,
} from "../decorators/public.decorator";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { SessionService } from "../../modules/auth/session.service";

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  org: string | null;
  email: string;
  iat?: number;
  exp?: number;
}

interface GuardedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ApiConfigService,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<GuardedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Missing bearer token",
      });
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.jwtAccessSecret,
      });
    } catch {
      throw new UnauthorizedException({
        code: "TOKEN_INVALID",
        message: "Access token is invalid or expired",
      });
    }

    const sessionActive = await this.sessions.isSessionActive(payload.sid);
    if (!sessionActive) {
      throw new UnauthorizedException({
        code: "SESSION_REVOKED",
        message: "Session is no longer active",
      });
    }

    request.user = {
      userId: payload.sub,
      sessionId: payload.sid,
      organizationId: payload.org,
      email: payload.email,
    };
    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return null;
    }
    return token;
  }
}
