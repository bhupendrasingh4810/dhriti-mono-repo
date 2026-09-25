import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { UserRole, type OAuthProvider, type User, type UserAuth, type UserProfile } from "@prisma/client";

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
import type { AuthTokensResponse, LoginResponse, OrganizationResponse } from "../dto/auth-response.dto";

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
  ) {}

  // ------------------------------------------------------------------
  // Registration
  // ------------------------------------------------------------------

  /**
   * Registers a new user and issues an email verification token.
   * @param dto The registration details.
   * @returns The email and verification token.
   * @throws AppError if the email is already registered.
   */
  async register(dto: RegisterDto): Promise<{ email: string }> {
    const email = dto.email.toLowerCase();
    this.assertBcryptPasswordLength(dto.password);
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
        role: UserRole.ORG_ADMIN,
        isPlatformUser: false,
        onboardingProfile: {
          create: {
            isOrgAdded: false,
            isOnBoarded: false,
            usageType: "",
            experience: "",
            isProfilePhotoSkipped: false,
            legalAcceptedAt: new Date(),
            legalTermsAccepted: true,
            legalPrivacyPolicyAccepted: true,
            legalTermsVersion: "2026-09-01",
            legalPrivacyPolicyVersion: "2026-09-01",
          },
        },
        auth: {
          create: { passwordHash },
        },
      },
    });

    await this.issueVerificationToken(user);
    this.logger.log(`Registered user=${user.id}`);
    return { email: user.email };
  }

  /**
   * Verifies the email using the provided token and OTP.
   * @param emailAddress The email address to verify.
   * @param token The email verification token.
   * @param otp The one-time password sent to the email.
   * @returns The authentication tokens upon successful verification.
   * @throws AppError if the token is invalid or expired.
   */
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

  /**
   * Resends the email verification OTP.
   * @param emailAddress The email address to resend the verification to.
   * @param token The email verification token.
   * @throws AppError if the verification request is invalid.
   */
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
    const expiresAt = new Date(Date.now() + this.config.emailVerificationTokenTtlSeconds * 1000);
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

  /**
   * Logs in a user with the provided credentials.
   * @param dto The login details.
   * @param context The session context.
   * @returns The login response, which may include MFA requirements or authentication tokens.
   * @throws AppError if the credentials are invalid or the account is suspended.
   */
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
      throw new AppError(ErrorCode.EMAIL_NOT_VERIFIED, "Verify your email before signing in", HttpStatus.FORBIDDEN);
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

  /**
   * Completes the MFA login process using the provided MFA token and code.
   * @param mfaToken The MFA token obtained from the initial login response.
   * @param code The one-time password from the authenticator app.
   * @param context The session context.
   * @returns The authentication tokens upon successful verification.
   * @throws AppError if the MFA code is invalid.
   */
  async completeMfaLogin(mfaToken: string, code: string, context: SessionContext = {}): Promise<AuthTokensResponse> {
    const userId = await this.userIdFromMfaToken(mfaToken);
    const valid = await this.mfa.verifyTotpForUser(userId, code);
    if (!valid) {
      throw new AppError(ErrorCode.MFA_CODE_INVALID, "Invalid authenticator code", HttpStatus.UNAUTHORIZED);
    }
    const user = await this.requireUser(userId);
    return this.issueTokens(user.id, user.email, context);
  }

  /**
   * Completes the recovery login process using the provided MFA token and recovery code.
   * @param mfaToken The MFA token obtained from the initial login response.
   * @param recoveryCode The recovery code for account access.
   * @param context The session context.
   * @returns The authentication tokens upon successful verification.
   * @throws AppError if the recovery code is invalid or already used.
   */
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

  /**
   * Logs out the current user by revoking their session.
   * @param current The currently authenticated user.
   */
  async logout(current: AuthenticatedUser): Promise<void> {
    await this.sessions.revokeSession(current.sessionId);
  }

  /**
   * Logs out the current user from all sessions.
   * @param current The currently authenticated user.
   * @returns The number of revoked sessions.
   */
  async logoutAll(current: AuthenticatedUser): Promise<{ revoked: number }> {
    const revoked = await this.sessions.revokeAllUserSessions(current.userId);
    return { revoked };
  }

  /**
   * Refreshes the authentication tokens using the provided refresh token.
   * @param refreshToken The refresh token.
   * @param context The session context.
   * @returns The new authentication tokens.
   * @throws AppError if the refresh token is invalid or expired.
   */
  async refresh(refreshToken: string, context: SessionContext = {}): Promise<AuthTokensResponse> {
    const rotated = await this.sessions.rotateSession(refreshToken, context);
    const user = await this.requireUserBySession(rotated.sessionId);
    const organizationId = await this.sessions.getSessionOrganization(rotated.sessionId);
    const organization = organizationId ? await this.resolveDefaultOrganization(user.id) : null;
    return this.buildTokenResponse(user, rotated, organizationId, organization);
  }

  // ------------------------------------------------------------------
  // OAuth
  // ------------------------------------------------------------------
  /**
   * Logs in a user using an OAuth provider.
   * @param profile The OAuth profile information.
   * @param context The session context.
   * @returns The authentication tokens for the user.
   * @throws AppError if the OAuth login fails or if an account conflict occurs.
   */
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

  /**
   * Issues authentication tokens for the specified user.
   * @param userId The ID of the user.
   * @param emailAddress The email address of the user.
   * @param context The session context.
   * @returns The authentication tokens for the user.
   * @throws AppError if the user does not exist or if token issuance fails.
   */
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

  /**
   * Builds the token response for the specified user and session.
   * @param user The user for whom the tokens are being issued.
   * @param session The session information including session ID, refresh token, and expiration.
   * @param organizationId The ID of the user's default organization, if any.
   * @param organization The user's default organization details, if any.
   * @returns The authentication tokens and related information for the user.
   */
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
        role: user.role,
        avatarUrl: user.avatarUrl,
        organization,
      },
    };
  }

  /**
   * Resolves the default organization for the specified user.
   * @param userId The ID of the user.
   * @returns The user's default organization details, or null if none exists.
   */
  private async resolveDefaultOrganization(userId: string): Promise<OrganizationResponse | null> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId, deletedAt: null, organization: { deletedAt: null } },
      orderBy: { createdAt: "asc" },
      select: { organization: { select: { id: true, name: true, slug: true } } },
    });
    return membership?.organization ?? null;
  }

  /**
   * Extracts the user ID from the provided MFA token.
   * @param mfaToken The MFA token to be verified.
   * @returns The user ID associated with the MFA token.
   * @throws AppError if the MFA token is invalid or expired.
   */
  private async userIdFromMfaToken(mfaToken: string): Promise<string> {
    try {
      const payload = await this.tokens.verifyMfaToken(mfaToken);
      return payload.sub;
    } catch {
      throw new AppError(ErrorCode.TOKEN_INVALID, "MFA challenge is invalid or expired", HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Consumes a verification token, marking it as used and validating its type, OTP, and email address.
   * @param token The verification token to be consumed.
   * @param type The type of the verification token ("EMAIL_VERIFICATION" or "PASSWORD_RESET").
   * @param otp The one-time password associated with the token, if applicable.
   * @param emailAddress The email address associated with the token, if applicable.
   * @returns The updated verification token record.
   * @throws AppError if the token is invalid, already used, expired, or does not match the provided OTP or email address.
   */
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
    const otpHash = record.otpHash;
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

    const usedAt = new Date();
    const consumed = await this.prisma.verificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: usedAt } },
      data: { usedAt },
    });
    if (consumed.count !== 1) {
      throw new AppError(ErrorCode.TOKEN_ALREADY_USED, "Token was already used", HttpStatus.BAD_REQUEST);
    }
    return { ...record, usedAt };
  }

  /**
   * Issues a new email verification token for the specified user.
   * @param user The user for whom the verification token is being issued.
   * @returns The newly issued verification token.
   */
  private async issueVerificationToken(user: User): Promise<string> {
    const otp = this.tokens.generateSixDigitOtp();
    const token = this.tokens.generateOpaqueToken();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.verificationToken.updateMany({
        where: { userId: user.id, type: "EMAIL_VERIFICATION", usedAt: null },
        data: { usedAt: new Date() },
      });
      await transaction.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: this.tokens.hashToken(token),
          otpHash: this.tokens.hashToken(otp),
          type: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + this.config.emailVerificationTokenTtlSeconds * 1000),
        },
      });
    });

    const verificationUrl = `${this.config.webAppUrl}/verify?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
    await this.email.sendVerificationEmail(user.email, user.name, otp, verificationUrl);
    return token;
  }

  /**
   * Asserts that the specified user account is not currently locked due to too many failed login attempts.
   * @param user The user whose account lock status is being checked.
   * @throws AppError if the account is temporarily locked.
   */
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

  private assertBcryptPasswordLength(password: string): void {
    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Password must not exceed 72 UTF-8 bytes",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Registers a failed login attempt for the specified user and locks the account if the threshold is exceeded.
   * @param user The user for whom the failed login attempt is being registered.
   */
  private async registerFailedAttempt(user: UserWithAuth): Promise<void> {
    const attempts = (user.auth?.failedLoginAttempts ?? 0) + 1;
    const shouldLock = attempts >= this.config.lockoutThreshold;
    const lockedUntil = shouldLock ? new Date(Date.now() + this.config.lockoutDurationMinutes * 60 * 1000) : null;

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

  /**
   * Creates an AppError indicating that the provided credentials are invalid.
   * @returns An AppError representing invalid credentials.
   */
  private invalidCredentials(): AppError {
    return new AppError(ErrorCode.INVALID_CREDENTIALS, "Email or password is incorrect", HttpStatus.UNAUTHORIZED);
  }

  /**
   * Retrieves the user with the specified ID, throwing an error if the user does not exist or has been deleted.
   * @param userId The ID of the user to retrieve.
   * @returns The user with the specified ID.
   * @throws AppError if the user is not found or has been deleted.
   */
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

  /**
   * Retrieves the user associated with the specified session ID, throwing an error if the session does not exist or has been revoked.
   * @param sessionId The ID of the session to retrieve the user for.
   * @returns The user associated with the specified session ID.
   * @throws AppError if the session is not found or has been revoked.
   */
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
}
