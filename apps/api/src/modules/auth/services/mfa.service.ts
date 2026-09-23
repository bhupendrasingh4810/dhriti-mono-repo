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
import { SecretEncryptionService } from "../../../common/crypto/secret-encryption.service";
import type { MfaConfirmResponse, MfaSetupResponse } from "../dto/mfa.dto";

const pendingSecretKey = (userId: string): string => `auth:mfa:pending:${userId}`;

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly tokens: TokenService,
    private readonly config: ApiConfigService,
    private readonly secrets: SecretEncryptionService,
  ) {}

  /**
   * Initiates the MFA setup process for a user by generating a secret and corresponding QR code.
   * @param userId The ID of the user for whom to begin MFA setup.
   * @param email The email of the user, used for generating the OTP auth URL.
   * @returns An object containing the secret, OTP auth URL, and QR code data URL.
   * @throws AppError if the user is not found or MFA is already enabled.
   */
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
    await this.redis.setJson(pendingSecretKey(userId), { secretEncrypted: this.secrets.encrypt(secret) }, this.config.mfa.pendingSecretTtlSeconds);

    const otpauthUrl = authenticator.keyuri(email, "Dhriti", secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  /**
   * Confirms the MFA setup for a user by verifying the provided TOTP code and generating recovery codes.
   * @param userId The ID of the user confirming MFA setup.
   * @param code The TOTP code provided by the user.
   * @returns An object indicating that MFA is enabled and containing the recovery codes.
   * @throws AppError if no MFA setup is pending or the provided code is invalid.
   */
  async confirmSetup(userId: string, code: string): Promise<MfaConfirmResponse> {
    const pending = await this.redis.getJson<{ secretEncrypted?: string; secret?: string }>(pendingSecretKey(userId));
    if (!pending) {
      throw new AppError(
        ErrorCode.MFA_SETUP_NOT_PENDING,
        "No MFA setup is pending; start setup again",
        HttpStatus.BAD_REQUEST,
      );
    }

    const secret = pending.secretEncrypted ? this.secrets.decrypt(pending.secretEncrypted) : pending.secret;
    if (!secret || !this.verifyTotp(secret, code)) {
      throw new AppError(ErrorCode.MFA_CODE_INVALID, "Invalid authenticator code", HttpStatus.BAD_REQUEST);
    }

    const recoveryCodes = this.generateRecoveryCodes();
    await this.prisma.$transaction([
      this.prisma.userAuth.upsert({
        where: { userId },
        create: { userId, mfaEnabled: true, mfaSecretEncrypted: this.secrets.encrypt(secret) },
        update: { mfaEnabled: true, mfaSecret: null, mfaSecretEncrypted: this.secrets.encrypt(secret) },
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
  /**
   * Verifies the TOTP code for a user.
   * @param userId The ID of the user to verify the TOTP code for.
   * @param code The TOTP code provided by the user.
   * @returns A boolean indicating whether the TOTP code is valid.
   */
  async verifyTotpForUser(userId: string, code: string): Promise<boolean> {
    const auth = await this.prisma.userAuth.findUnique({
      where: { userId },
      select: { mfaEnabled: true, mfaSecret: true, mfaSecretEncrypted: true },
    });
    if (!auth?.mfaEnabled) {
      return false;
    }
    const secret = auth.mfaSecretEncrypted
      ? this.secrets.decrypt(auth.mfaSecretEncrypted)
      : auth.mfaSecret;
    if (!secret) return false;
    if (!auth.mfaSecretEncrypted) {
      await this.prisma.userAuth.update({
        where: { userId },
        data: { mfaSecret: null, mfaSecretEncrypted: this.secrets.encrypt(secret) },
      });
    }
    return this.verifyTotp(secret, code);
  }

  /**
   * Consumes a recovery code for a user, marking it as used.
   * @param userId The ID of the user consuming the recovery code.
   * @param recoveryCode The recovery code provided by the user.
   * @returns A boolean indicating whether the recovery code was successfully consumed.
   */
  async consumeRecoveryCode(userId: string, recoveryCode: string): Promise<boolean> {
    const codeHash = this.tokens.hashToken(recoveryCode.trim().toLowerCase());
    const result = await this.prisma.mfaRecoveryCode.updateMany({
      where: { userId, codeHash, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count === 1;
  }

  /**
   * Disables MFA for a user by verifying the provided TOTP code.
   * @param userId The ID of the user to disable MFA for.
   * @param code The TOTP code provided by the user.
   * @throws AppError if MFA is not enabled or the provided code is invalid.
   */
  async disable(userId: string, code: string): Promise<void> {
    const auth = await this.prisma.userAuth.findUnique({ where: { userId } });
    if (!auth || !auth.mfaEnabled || (!auth.mfaSecret && !auth.mfaSecretEncrypted)) {
      throw new AppError(ErrorCode.MFA_NOT_ENABLED, "MFA is not enabled", HttpStatus.BAD_REQUEST);
    }
    const secret = auth.mfaSecretEncrypted ? this.secrets.decrypt(auth.mfaSecretEncrypted) : auth.mfaSecret;
    if (!secret || !this.verifyTotp(secret, code)) {
      throw new AppError(ErrorCode.MFA_CODE_INVALID, "Invalid authenticator code", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.$transaction([
      this.prisma.userAuth.update({
        where: { userId },
        data: { mfaEnabled: false, mfaSecret: null, mfaSecretEncrypted: null },
      }),
      this.prisma.mfaRecoveryCode.deleteMany({ where: { userId } }),
    ]);
  }

  /**
   * Verifies a TOTP code against a given secret.
   * @param secret The secret key used to generate the TOTP code.
   * @param code The TOTP code to verify.
   * @returns A boolean indicating whether the TOTP code is valid.
   */
  private verifyTotp(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  /**
   * Generates a set of recovery codes for MFA.
   * @returns An array of recovery codes.
   */
  private generateRecoveryCodes(): string[] {
    return Array.from({ length: this.config.mfa.recoveryCodeCount }, () => {
      const raw = randomBytes(6).toString("hex");
      return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
    });
  }
}
