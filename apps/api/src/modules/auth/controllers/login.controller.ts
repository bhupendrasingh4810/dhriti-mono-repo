import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Ip,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";

import { Public } from "../../../common/decorators/public.decorator";
import { PublicAuthRateLimitGuard } from "../../../common/guards/public-auth-rate-limit.guard";
import {
    CurrentUser,
    type AuthenticatedUser,
} from "../../../common/decorators/current-user.decorator";

import { AuthService } from "../services/auth.service";
import type { SessionContext } from "../services/session.service";
import { LoginDto } from "../dto/login.dto";
import {
    MfaRecoveryLoginDto,
    MfaVerifyLoginDto,
    RefreshTokenDto,
} from "../dto/token.dto";
import type { AuthTokensResponse, LoginResponse } from "../dto/auth-response.dto";

@ApiTags("auth")
@Controller("auth")
export class LoginController {
    constructor(
        private readonly auth: AuthService,
    ) { }


    @Public()
    @UseGuards(PublicAuthRateLimitGuard)
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
    @UseGuards(PublicAuthRateLimitGuard)
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
    @UseGuards(PublicAuthRateLimitGuard)
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
    @UseGuards(PublicAuthRateLimitGuard)
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

    // ---------------- Internals ----------------

    private sessionContext(ip: string, request: Request): SessionContext {
        const userAgentHeader = request.headers["user-agent"];
        return {
            ipAddress: ip,
            userAgent: Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader,
        };
    }
}
