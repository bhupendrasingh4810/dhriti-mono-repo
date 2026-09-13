import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard as PassportAuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";

import { ApiConfigService } from "../../config/config.service";
import { Public } from "../../common/decorators/public.decorator";
import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";

import { AuthService, type OAuthProfile } from "./services/auth.service";
import { MfaService } from "./services/mfa.service";
import type { SessionContext } from "./services/session.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  MfaRecoveryLoginDto,
  MfaVerifyLoginDto,
  RefreshTokenDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from "./dto/token.dto";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/password.dto";
import { UpdateProfileDto, type UserProfileResponse } from "./dto/profile.dto";
import {
  MfaConfirmDto,
  MfaDisableDto,
  type MfaConfirmResponse,
  type MfaSetupResponse,
} from "./dto/mfa.dto";
import type { AuthTokensResponse, LoginResponse } from "./dto/auth-response.dto";

interface PassportRequest extends Request {
  user?: OAuthProfile;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly mfa: MfaService,
    private readonly config: ApiConfigService,
  ) {}

  // ---------------- Registration & email verification ----------------

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user and send verification email" })
  @ApiResponse({ status: 201, description: "User created; verification email sent" })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async register(@Body() dto: RegisterDto): Promise<{ email: string; token: string }> {
    return this.auth.register(dto);
  }

  @Public()
  @Post("verify-email")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Verify email address with the emailed token" })
  @ApiResponse({ status: 204 })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<AuthTokensResponse> {
    return this.auth.verifyEmail(dto.email, dto.token, dto.otp);
  }

  @Public()
  @Post("resend-verification")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Resend the verification email (no account enumeration)" })
  @ApiResponse({ status: 204 })
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<void> {
    return this.auth.resendVerification(dto.email, dto.token);
  }

  // ---------------- Login / tokens / logout ----------------

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Tokens, or MFA challenge when enabled" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 403, description: "Email not verified / suspended" })
  @ApiResponse({ status: 429, description: "Account locked" })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Req() request: Request,
  ): Promise<LoginResponse> {
    return this.auth.login(dto, this.sessionContext(ip, request));
  }

  @Public()
  @Post("mfa/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete MFA login with a TOTP code" })
  @ApiResponse({ status: 200, description: "Full token set" })
  async verifyMfaLogin(
    @Body() dto: MfaVerifyLoginDto,
    @Ip() ip: string,
    @Req() request: Request,
  ): Promise<AuthTokensResponse> {
    return this.auth.completeMfaLogin(dto.mfaToken, dto.code, this.sessionContext(ip, request));
  }

  @Public()
  @Post("mfa/recovery")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete MFA login with a one-time recovery code" })
  async recoveryMfaLogin(
    @Body() dto: MfaRecoveryLoginDto,
    @Ip() ip: string,
    @Req() request: Request,
  ): Promise<AuthTokensResponse> {
    return this.auth.completeRecoveryLogin(dto.mfaToken, dto.recoveryCode, this.sessionContext(ip, request));
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate the refresh token and issue a new access token" })
  @ApiResponse({ status: 200, description: "Rotated token set" })
  @ApiResponse({ status: 401, description: "Invalid or reused refresh token" })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Req() request: Request,
  ): Promise<AuthTokensResponse> {
    return this.auth.refresh(dto.refreshToken, this.sessionContext(ip, request));
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke the current session" })
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.auth.logout(user);
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revoke every session for the current user" })
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<{ revoked: number }> {
    return this.auth.logoutAll(user);
  }

  // ---------------- Password flows ----------------

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Request a password reset email (always succeeds)" })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reset password with the emailed token; revokes all sessions" })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ): Promise<void> {
    return this.auth.resetPassword(dto.token, dto.newPassword, ipAddress, request.get("user-agent") ?? "Unknown device");
  }

  @Post("change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change password; revokes all other sessions" })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.auth.changePassword(user, dto.currentPassword, dto.newPassword);
  }

  // ---------------- Profile ----------------

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current user profile" })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileResponse> {
    return this.auth.getProfile(user.userId);
  }

  @Patch("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update profile: name, avatar, timezone, locale" })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    return this.auth.updateProfile(user.userId, dto);
  }

  // ---------------- MFA management ----------------

  @Post("mfa/setup")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start TOTP setup; returns secret and QR code" })
  async setupMfa(@CurrentUser() user: AuthenticatedUser): Promise<MfaSetupResponse> {
    return this.mfa.beginSetup(user.userId, user.email);
  }

  @Post("mfa/confirm")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm TOTP setup; returns one-time recovery codes" })
  async confirmMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaConfirmDto,
  ): Promise<MfaConfirmResponse> {
    return this.mfa.confirmSetup(user.userId, dto.code);
  }

  @Post("mfa/disable")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Disable MFA with password and current TOTP" })
  async disableMfa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MfaDisableDto,
  ): Promise<void> {
    await this.auth.verifyUserPassword(user.userId, dto.password);
    return this.mfa.disable(user.userId, dto.code);
  }

  // ---------------- OAuth ----------------

  @Public()
  @Get("oauth/google")
  @UseGuards(PassportAuthGuard("google"))
  @ApiOperation({ summary: "Start Google OAuth flow" })
  googleLogin(): void {
    // Redirect handled by passport.
  }

  @Public()
  @Get("oauth/google/callback")
  @UseGuards(PassportAuthGuard("google"))
  async googleCallback(
    @Req() request: PassportRequest,
    @Res() response: Response,
    @Ip() ip: string,
  ): Promise<void> {
    return this.finishOAuth(request, response, ip);
  }

  @Public()
  @Get("oauth/github")
  @UseGuards(PassportAuthGuard("github"))
  @ApiOperation({ summary: "Start GitHub OAuth flow" })
  githubLogin(): void {
    // Redirect handled by passport.
  }

  @Public()
  @Get("oauth/github/callback")
  @UseGuards(PassportAuthGuard("github"))
  async githubCallback(
    @Req() request: PassportRequest,
    @Res() response: Response,
    @Ip() ip: string,
  ): Promise<void> {
    return this.finishOAuth(request, response, ip);
  }

  // ---------------- Internals ----------------

  private async finishOAuth(
    request: PassportRequest,
    response: Response,
    ip: string,
  ): Promise<void> {
    const profile = request.user;
    if (!profile) {
      response.redirect(`${this.config.webAppUrl}/login?error=oauth_failed`);
      return;
    }

    const tokens = await this.auth.loginWithOAuth(profile, this.sessionContext(ip, request));
    const redirectUrl = new URL("/login", this.config.webAppUrl);
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);
    response.redirect(redirectUrl.toString());
  }

  private sessionContext(ip: string, request: Request): SessionContext {
    const userAgentHeader = request.headers["user-agent"];
    return {
      ipAddress: ip,
      userAgent: Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader,
    };
  }
}
