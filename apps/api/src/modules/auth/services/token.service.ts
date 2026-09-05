import { createHash, randomBytes } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { ApiConfigService } from "../../../config/config.service";
import type { AccessTokenPayload } from "../../../common/guards/auth.guard";

export interface MfaTokenPayload {
  sub: string;
  purpose: "mfa";
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ApiConfigService,
  ) { }

  async signAccessToken(params: {
    userId: string;
    sessionId: string;
    organizationId: string | null;
    email: string;
  }): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: params.userId,
      sid: params.sessionId,
      org: params.organizationId,
      email: params.email,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwtAccessSecret,
      expiresIn: this.config.jwtAccessTtlSeconds,
    });
  }

  async signMfaToken(userId: string): Promise<string> {
    const payload: MfaTokenPayload = { sub: userId, purpose: "mfa" };
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwtMfaSecret,
      expiresIn: this.config.jwtMfaTtlSeconds,
    });
  }

  async verifyMfaToken(token: string): Promise<MfaTokenPayload> {
    const payload = await this.jwtService.verifyAsync<MfaTokenPayload>(token, {
      secret: this.config.jwtMfaSecret,
    });
    if (payload.purpose !== "mfa") {
      throw new Error("Unexpected token purpose");
    }
    return payload;
  }

  generateOpaqueToken(): string {
    return randomBytes(48).toString("base64url");
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
