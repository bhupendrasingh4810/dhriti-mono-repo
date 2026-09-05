import { randomBytes } from "node:crypto";

import { HttpStatus, Injectable } from "@nestjs/common";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";

import { PrismaService } from "../../../database/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { ApiConfigService } from "../../../config/config.service";
import { TokenService } from "./token.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import type { MfaConfirmResponse, MfaSetupResponse } from "../dto/mfa.dto";

const PENDING_SECRET_TTL_SECONDS = 600;
const pendingSecretKey = (userId: string): string => `auth:mfa:pending:${userId}`;
const RECOVERY_CODE_COUNT = 10;

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokens: TokenService,
    private readonly config: ApiConfigService,
  ) {}

  async beginSetup(userId: string, email: string): Promise<MfaSetupResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { auth: true },
    });
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }
    if (user.auth?.mfaEnabled) {
      throw new AppError(
        ErrorCode.MFA_ALREADY_ENABLED,
        "MFA is already enabled on this account",
        HttpStatus.CONFLICT,
      );
    }

    const secret = authenticator.generateSecret();
    await this.redis.setJson(pendingSecretKey(userId), { secret }, PENDING_SECRET_TTL_SECONDS);

    const otpauthUrl = authenticator.keyuri(email, "Dhriti", secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  async confirmSetup(userId: string, code: string): Promise<MfaConfirmResponse> {
    const pending = await this.redis.getJson<{ secret: string }>(pendingSecretKey(userId));
    if (!pending) {
      throw new AppError(
        ErrorCode.MFA_SETUP_NOT_PENDING,
        "No MFA setup is pending; start setup again",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.verifyTotp(pending.secret, code)) {
      throw new AppError(ErrorCode.MFA_CODE_INVALID, "Invalid authenticator code", HttpStatus.BAD_REQUEST);
    }

    const recoveryCodes = this.generateRecoveryCodes();
    await this.prisma.$transaction([
      this.prisma.userAuth.upsert({
        where: { userId },
        create: { userId, mfaEnabled: true, mfaSecret: pending.secret },
        update: { mfaEnabled: true, mfaSecret: pending.secret },
      }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId, usedAt: null } }),
      this.prisma.mfaRecoveryCode.createMany({
        data: recoveryCodes.map((plain) => ({
          userId,
          codeHash: this.tokens.hashToken(plain),
        })),
      }),
    ]);
    await this.redis.delete(pendingSecretKey(userId));

    return { enabled: true, recoveryCodes };
  }

  async verifyTotpForUser(userId: string, code: string): Promise<boolean> {
    const auth = await this.prisma.userAuth.findUnique({
      where: { userId },
      select: { mfaEnabled: true, mfaSecret: true },
    });
    if (!auth?.mfaEnabled || !auth.mfaSecret) {
      return false;
    }
    return this.verifyTotp(auth.mfaSecret, code);
  }

  async consumeRecoveryCode(userId: string, recoveryCode: string): Promise<boolean> {
    const codeHash = this.tokens.hashToken(recoveryCode.trim().toLowerCase());
    const result = await this.prisma.mfaRecoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count === 1;
  }

  async disable(userId: string, code: string): Promise<void> {
    const auth = await this.prisma.userAuth.findUnique({ where: { userId } });
    if (!auth || !auth.mfaEnabled || !auth.mfaSecret) {
      throw new AppError(ErrorCode.MFA_NOT_ENABLED, "MFA is not enabled", HttpStatus.BAD_REQUEST);
    }
    if (!this.verifyTotp(auth.mfaSecret, code)) {
      throw new AppError(ErrorCode.MFA_CODE_INVALID, "Invalid authenticator code", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.$transaction([
      this.prisma.userAuth.update({
        where: { userId },
        data: { mfaEnabled: false, mfaSecret: null },
      }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    ]);
  }

  private verifyTotp(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  private generateRecoveryCodes(): string[] {
    return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
      const raw = randomBytes(6).toString("hex");
      return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
    });
  }
}
