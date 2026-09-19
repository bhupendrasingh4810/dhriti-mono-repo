import { createHash, randomBytes, randomInt } from "node:crypto";

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

  /**
   * Signs an access token for the given user and session information.
   * @param params The parameters for signing the access token.
   * @returns A signed JWT access token.
   */
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

  /**
   * Signs an MFA token for the given user.
   * @param userId The ID of the user for whom to sign the MFA token.
   * @returns A signed JWT MFA token.
   */
  async signMfaToken(userId: string): Promise<string> {
    const payload: MfaTokenPayload = { sub: userId, purpose: "mfa" };
    return this.jwtService.signAsync(payload, {
      secret: this.config.jwtMfaSecret,
      expiresIn: this.config.jwtMfaTtlSeconds,
    });
  }

  /**
   * Verifies an MFA token and returns its payload.
   * @param token The JWT MFA token to verify.
   * @returns The decoded MFA token payload.
   * @throws Error if the token purpose is not "mfa".
   */
  async verifyMfaToken(token: string): Promise<MfaTokenPayload> {
    const payload = await this.jwtService.verifyAsync<MfaTokenPayload>(token, {
      secret: this.config.jwtMfaSecret,
    });
    if (payload.purpose !== "mfa") {
      throw new Error("Unexpected token purpose");
    }
    return payload;
  }

  /**
   * Generates a cryptographically secure opaque token.
   * @returns A base64url-encoded opaque token.
   */
  generateOpaqueToken(): string {
    return randomBytes(48).toString("base64url");
  }

  /**
   * Generates a six-digit one-time password (OTP).
   * @returns A six-digit OTP as a string.
   */
  generateSixDigitOtp(): string {
    return randomInt(100_000, 1_000_000).toString();
  }

  /**
   * Hashes a token using SHA-256.
   * @param token The token to hash.
   * @returns The hexadecimal representation of the hashed token.
   */
  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
