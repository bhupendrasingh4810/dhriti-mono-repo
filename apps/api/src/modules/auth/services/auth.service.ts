import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import type { OAuthProvider, User, UserAuth, UserProfile } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { ApiConfigService } from "../../../config/config.service";
import { EmailService } from "../../notification/email.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import type { AuthenticatedUser } from "../../../common/decorators/current-user.decorator";

import { TokenService } from "./token.service";
import { SessionService, type SessionContext } from "./session.service";
import { MfaService } from "./mfa.service";
import type { RegisterDto } from "../dto/register.dto";
import type { LoginDto } from "../dto/login.dto";
import type { UpdateProfileDto, UserProfileResponse } from "../dto/profile.dto";
import type { AuthTokensResponse, LoginResponse, OrganizationResponse } from "../dto/auth-response.dto";

const VERIFICATION_TOKEN_TTL_MS = 20 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface OAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

// Auth/security fields live on UserAuth, preferences on UserProfile in the
// current schema, so most queries include those relations.
type UserWithAuth = User & { auth: UserAuth | null };
type UserWithRelations = User & { auth: UserAuth | null; profile: UserProfile | null };

const withAuth = { auth: true } as const;
const withAuthAndProfile = { auth: true, profile: true } as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ApiConfigService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly mfa: MfaService,
    private readonly email: EmailService,
  ) { }

  // ------------------------------------------------------------------
  // Registration
  // ------------------------------------------------------------------

  async register(dto: RegisterDto): Promise<{ email: string; token: string }> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(
        ErrorCode.EMAIL_ALREADY_REGISTERED,
        "An account with this email already exists",
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, this.config.bcryptRounds);
    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name.trim(),
        onboardingProfile: {
          usageType: "",
          experience: "",
          useCases: [],
          legal: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
            termsVersion: "2026-09-01",
            privacyPolicyVersion: "2026-09-01",
            acceptedAt: new Date()
          }
        },
        auth: {
          create: { passwordHash }
        },
      },
    });

    const token = await this.issueVerificationToken(user);
    this.logger.log(`Registered user=${user.id}`);
    return { email: user.email, token };
  }

  async verifyEmail(emailAddress: string, token: string, otp: string): Promise<AuthTokensResponse> {
    const record = await this.consumeToken(token, "EMAIL_VERIFICATION", otp, emailAddress);
    await this.prisma.userAuth.upsert({
      where: { userId: record.userId },
      create: { userId: record.userId, emailVerifiedAt: new Date() },
      update: { emailVerifiedAt: new Date() },
    });
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { status: "ACTIVE" },
    });
    await this.email.sendWelcomeEmail(record.user.email, record.user.name, this.config.onboardingUrl);
    return this.issueTokens(record.userId, emailAddress.toLowerCase(), {});
  }

  async resendVerification(emailAddress: string, token: string): Promise<void> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: this.tokens.hashToken(token) },
      include: { user: { select: { email: true, name: true } } },
    });

    if (
      !record ||
      record.type !== "EMAIL_VERIFICATION" ||
      record.usedAt ||
      record.user.email !== emailAddress.trim().toLowerCase()
    ) {
      throw new AppError(ErrorCode.TOKEN_INVALID, "Verification request is invalid", HttpStatus.BAD_REQUEST);
    }

    const otp = this.tokens.generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await this.prisma.verificationToken.update({
      where: { id: record.id },
      data: { otpHash: this.tokens.hashToken(otp), expiresAt },
    });

    const verificationUrl = `${this.config.webAppUrl}/verify?email=${encodeURIComponent(record.user.email)}&token=${encodeURIComponent(token)}`;
    await this.email.sendResendOtpEmail(record.user.email, record.user.name, otp, 20, verificationUrl);
  }

  // ------------------------------------------------------------------
  // Login / logout
  // ------------------------------------------------------------------

  async login(dto: LoginDto, context: SessionContext = {}): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: withAuth,
    });
    const auth = user?.auth;

    if (!user || user.deletedAt || !auth?.passwordHash) {
      throw this.invalidCredentials();
    }

    this.assertNotLocked(user);

    if (user.status === "SUSPENDED") {
      throw new AppError(
        ErrorCode.ACCOUNT_SUSPENDED,
        "This account is suspended; contact support",
        HttpStatus.FORBIDDEN,
      );
    }

    const passwordOk = await bcrypt.compare(dto.password, auth.passwordHash);
    if (!passwordOk) {
      await this.registerFailedAttempt(user);
      throw this.invalidCredentials();
    }

    await this.prisma.userAuth.update({
      where: { userId: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    if (!auth.emailVerifiedAt) {
      throw new AppError(
        ErrorCode.EMAIL_NOT_VERIFIED,
        "Verify your email before signing in",
        HttpStatus.FORBIDDEN,
      );
    }

    if (auth.mfaEnabled) {
      const mfaToken = await this.tokens.signMfaToken(user.id);
      return {
        mfaRequired: true,
        mfaToken,
        mfaTokenExpiresIn: this.config.jwtMfaTtlSeconds,
      };
    }

    return this.issueTokens(user.id, user.email, context);
  }

  async completeMfaLogin(mfaToken: string, code: string, context: SessionContext = {}): Promise<AuthTokensResponse> {
    const userId = await this.userIdFromMfaToken(mfaToken);
    const valid = await this.mfa.verifyTotpForUser(userId, code);
    if (!valid) {
      throw new AppError(ErrorCode.MFA_CODE_INVALID, "Invalid authenticator code", HttpStatus.UNAUTHORIZED);
    }
    const user = await this.requireUser(userId);
    return this.issueTokens(user.id, user.email, context);
  }

  async completeRecoveryLogin(
    mfaToken: string,
    recoveryCode: string,
    context: SessionContext = {},
  ): Promise<AuthTokensResponse> {
    const userId = await this.userIdFromMfaToken(mfaToken);
    const consumed = await this.mfa.consumeRecoveryCode(userId, recoveryCode);
    if (!consumed) {
      throw new AppError(
        ErrorCode.RECOVERY_CODE_INVALID,
        "Recovery code is invalid or already used",
        HttpStatus.UNAUTHORIZED,
      );
    }
    const user = await this.requireUser(userId);
    return this.issueTokens(user.id, user.email, context);
  }

  async logout(current: AuthenticatedUser): Promise<void> {
    await this.sessions.revokeSession(current.sessionId);
  }

  async logoutAll(current: AuthenticatedUser): Promise<{ revoked: number }> {
    const revoked = await this.sessions.revokeAllUserSessions(current.userId);
    return { revoked };
  }

  async refresh(refreshToken: string, context: SessionContext = {}): Promise<AuthTokensResponse> {
    const rotated = await this.sessions.rotateSession(refreshToken, context);
    const user = await this.requireUserBySession(rotated.sessionId);
    const organizationId = await this.sessions.getSessionOrganization(rotated.sessionId);
    return this.buildTokenResponse(user, rotated, organizationId, null);
  }

  // ------------------------------------------------------------------
  // Password flows
  // ------------------------------------------------------------------

  async forgotPassword(emailAddress: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: emailAddress.toLowerCase() },
    });
    // Always succeed to avoid account enumeration.
    if (!user || user.deletedAt) {
      return;
    }

    const token = this.tokens.generateOpaqueToken();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: this.tokens.hashToken(token),
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${this.config.webAppUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.email.sendResetPasswordEmail(user.email, resetUrl, PASSWORD_RESET_TOKEN_TTL_MS);
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ipAddress = "Unknown",
    deviceInfo = "Unknown device",
  ): Promise<void> {
    const record = await this.consumeToken(token, "PASSWORD_RESET");
    const passwordHash = await bcrypt.hash(newPassword, this.config.bcryptRounds);

    await this.prisma.userAuth.upsert({
      where: { userId: record.userId },
      create: { userId: record.userId, passwordHash },
      update: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { status: "ACTIVE" },
    });
    await this.sessions.revokeAllUserSessions(record.userId);

    const resetAt = new Date();
    try {
      await this.email.sendResetPasswordConfirmationEmail(
        record.user.email,
        record.user.name,
        resetAt.toLocaleDateString("en-US"),
        resetAt.toLocaleTimeString("en-US"),
        ipAddress,
        deviceInfo,
      );
    } catch (error) {
      this.logger.error(
        `Password reset confirmation email failed for user=${record.userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async changePassword(
    current: AuthenticatedUser,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.requireUser(current.userId);
    if (!user.auth?.passwordHash) {
      throw new AppError(
        ErrorCode.OAUTH_ACCOUNT_EXISTS,
        "This account uses social sign-in and has no password",
        HttpStatus.BAD_REQUEST,
      );
    }

    const matches = await bcrypt.compare(currentPassword, user.auth.passwordHash);
    if (!matches) {
      throw new AppError(
        ErrorCode.PASSWORD_INCORRECT,
        "Current password is incorrect",
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, this.config.bcryptRounds);
    await this.prisma.userAuth.update({ where: { userId: user.id }, data: { passwordHash } });
    await this.sessions.revokeAllUserSessions(user.id, current.sessionId);
  }

  /** Verifies the user's current password without mutating anything (e.g. before MFA disable). */
  async verifyUserPassword(userId: string, password: string): Promise<void> {
    const user = await this.requireUser(userId);
    if (!user.auth?.passwordHash) {
      throw new AppError(
        ErrorCode.OAUTH_ACCOUNT_EXISTS,
        "This account uses social sign-in and has no password",
        HttpStatus.BAD_REQUEST,
      );
    }
    const matches = await bcrypt.compare(password, user.auth.passwordHash);
    if (!matches) {
      throw new AppError(
        ErrorCode.PASSWORD_INCORRECT,
        "Password is incorrect",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ------------------------------------------------------------------
  // Profile
  // ------------------------------------------------------------------

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.requireUser(userId);
    return this.toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfileResponse> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
    });
    if (dto.timezone !== undefined || dto.locale !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
          ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        },
        update: {
          ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
          ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        },
      });
    }
    const user = await this.requireUser(userId);
    return this.toProfile(user);
  }

  // ------------------------------------------------------------------
  // OAuth
  // ------------------------------------------------------------------

  async loginWithOAuth(profile: OAuthProfile, context: SessionContext = {}): Promise<AuthTokensResponse> {
    const email = profile.email.toLowerCase();

    const identity = await this.prisma.userIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: { include: withAuth } },
    });

    let user: UserWithAuth;
    if (identity) {
      user = identity.user;
    } else {
      const existing = await this.prisma.user.findUnique({
        where: { email },
        include: withAuth,
      });
      if (existing) {
        if (existing.auth?.passwordHash && !profile.emailVerified) {
          throw new AppError(
            ErrorCode.OAUTH_ACCOUNT_EXISTS,
            "An account with this email exists; sign in with password and link the provider",
            HttpStatus.CONFLICT,
          );
        }
        user = await this.prisma.user.update({
          where: { id: existing.id },
          include: withAuth,
          data: {
            identities: {
              create: {
                provider: profile.provider,
                providerAccountId: profile.providerAccountId,
                email,
              },
            },
            status: existing.status === "PENDING_VERIFICATION" && profile.emailVerified ? "ACTIVE" : existing.status,
            auth: {
              upsert: {
                create: { emailVerifiedAt: profile.emailVerified ? new Date() : null },
                update: {
                  emailVerifiedAt: existing.auth?.emailVerifiedAt ?? (profile.emailVerified ? new Date() : null),
                },
              },
            },
          },
        });
      } else {
        user = await this.prisma.user.create({
          include: withAuth,
          data: {
            email,
            name: profile.name.trim() || email,
            avatarUrl: profile.avatarUrl,
            status: profile.emailVerified ? "ACTIVE" : "PENDING_VERIFICATION",
            auth: {
              create: { emailVerifiedAt: profile.emailVerified ? new Date() : null },
            },
            identities: {
              create: {
                provider: profile.provider,
                providerAccountId: profile.providerAccountId,
                email,
              },
            },
          },
        });
      }
    }

    await this.prisma.userAuth.upsert({
      where: { userId: user.id },
      create: { userId: user.id, lastLoginAt: new Date() },
      update: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
    });

    return this.issueTokens(user.id, user.email, context);
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private async issueTokens(
    userId: string,
    emailAddress: string,
    context: SessionContext,
  ): Promise<AuthTokensResponse> {
    const organization = await this.resolveDefaultOrganization(userId);
    const session = await this.sessions.createSession(userId, organization?.id ?? null, context);
    const user = await this.requireUser(userId);
    return this.buildTokenResponse(user, session, organization?.id ?? null, organization);
  }

  private async buildTokenResponse(
    user: User,
    session: { sessionId: string; refreshToken: string; expiresAt: Date },
    organizationId: string | null,
    organization: OrganizationResponse | null,
  ): Promise<AuthTokensResponse> {
    const accessToken = await this.tokens.signAccessToken({
      userId: user.id,
      sessionId: session.sessionId,
      organizationId,
      email: user.email,
    });

    return {
      accessToken,
      accessTokenExpiresIn: this.config.jwtAccessTtlSeconds,
      refreshToken: session.refreshToken,
      refreshTokenExpiresIn: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
      sessionId: session.sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      organization,
    };
  }

  private async resolveDefaultOrganization(userId: string): Promise<OrganizationResponse | null> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, organization: { deletedAt: null } },
      orderBy: { createdAt: "asc" },
      select: { organization: { select: { id: true, name: true } } },
    });
    return membership?.organization ?? null;
  }

  private async userIdFromMfaToken(mfaToken: string): Promise<string> {
    try {
      const payload = await this.tokens.verifyMfaToken(mfaToken);
      return payload.sub;
    } catch {
      throw new AppError(
        ErrorCode.TOKEN_INVALID,
        "MFA challenge is invalid or expired",
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private async consumeToken(
    token: string,
    type: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
    otp?: string,
    emailAddress?: string,
  ) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: this.tokens.hashToken(token) },
      include: { user: { select: { email: true, name: true } } },
    });

    if (!record || record.type !== type) {
      throw new AppError(ErrorCode.TOKEN_INVALID, "Token is invalid", HttpStatus.BAD_REQUEST);
    }
    const otpHash = (record as typeof record & { otpHash: string | null }).otpHash;
    if (type === "EMAIL_VERIFICATION" && (!otp || otpHash !== this.tokens.hashToken(otp))) {
      throw new AppError(ErrorCode.TOKEN_INVALID, "Verification code is invalid", HttpStatus.BAD_REQUEST);
    }
    if (type === "EMAIL_VERIFICATION" && record.user.email !== emailAddress?.trim().toLowerCase()) {
      throw new AppError(ErrorCode.TOKEN_INVALID, "Verification email is invalid", HttpStatus.BAD_REQUEST);
    }
    if (record.usedAt) {
      throw new AppError(ErrorCode.TOKEN_ALREADY_USED, "Token was already used", HttpStatus.BAD_REQUEST);
    }
    if (record.expiresAt <= new Date()) {
      throw new AppError(ErrorCode.TOKEN_EXPIRED, "Token has expired", HttpStatus.BAD_REQUEST);
    }

    return this.prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
      include: { user: { select: { email: true, name: true } } },
    });
  }

  private async issueVerificationToken(user: User): Promise<string> {
    const otp = this.tokens.generateSixDigitOtp();
    const token = this.tokens.generateOpaqueToken();
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: this.tokens.hashToken(token),
        otpHash: this.tokens.hashToken(otp),
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });

    const verificationUrl = `${this.config.webAppUrl}/verify?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
    await this.email.sendVerificationEmail(user.email, user.name, otp, verificationUrl);
    return token;
  }

  private assertNotLocked(user: UserWithAuth): void {
    const lockedUntil = user.auth?.lockedUntil;
    if (lockedUntil && lockedUntil > new Date()) {
      throw new AppError(
        ErrorCode.ACCOUNT_LOCKED,
        "Account is temporarily locked after too many failed attempts",
        HttpStatus.TOO_MANY_REQUESTS,
        { unlockAt: lockedUntil.toISOString() },
      );
    }
  }

  private async registerFailedAttempt(user: UserWithAuth): Promise<void> {
    const attempts = (user.auth?.failedLoginAttempts ?? 0) + 1;
    const shouldLock = attempts >= this.config.lockoutThreshold;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + this.config.lockoutDurationMinutes * 60 * 1000)
      : null;

    await this.prisma.userAuth.upsert({
      where: { userId: user.id },
      create: { userId: user.id, failedLoginAttempts: attempts, lockedUntil },
      update: { failedLoginAttempts: attempts, lockedUntil },
    });

    if (shouldLock && lockedUntil) {
      this.logger.warn(`Account locked user=${user.id} until=${lockedUntil.toISOString()}`);
      await this.email.sendAccountLockedEmail(user.email, user.name, lockedUntil);
    }
  }

  private invalidCredentials(): AppError {
    return new AppError(
      ErrorCode.INVALID_CREDENTIALS,
      "Email or password is incorrect",
      HttpStatus.UNAUTHORIZED,
    );
  }

  private async requireUser(userId: string): Promise<UserWithRelations> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: withAuthAndProfile,
    });
    if (!user || user.deletedAt) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }
    return user;
  }

  private async requireUserBySession(sessionId: string): Promise<UserWithRelations> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });
    if (!session) {
      throw new AppError(ErrorCode.SESSION_REVOKED, "Session not found", HttpStatus.UNAUTHORIZED);
    }
    return this.requireUser(session.userId);
  }

  private toProfile(user: UserWithRelations): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      timezone: user.profile?.timezone ?? "UTC",
      locale: user.profile?.locale ?? "en",
      status: user.status,
      emailVerified: user.auth?.emailVerifiedAt != null,
      mfaEnabled: user.auth?.mfaEnabled ?? false,
      lastLoginAt: user.auth?.lastLoginAt ? user.auth.lastLoginAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
