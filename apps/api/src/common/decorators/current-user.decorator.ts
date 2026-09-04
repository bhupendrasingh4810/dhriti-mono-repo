import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  organizationId: string | null;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | string | null => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new Error("CurrentUser used on a route without an authenticated principal");
    }
    return data ? user[data] : user;
  },
);
