import {
    Controller,
    Get,
    Ip,
    Req,
    Res,
    UseGuards,
} from "@nestjs/common";
import { AuthGuard as PassportAuthGuard } from "@nestjs/passport";
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";

import { ApiConfigService } from "../../../config/config.service";
import { Public } from "../../../common/decorators/public.decorator";

import { AuthService, type OAuthProfile } from "../services/auth.service";
import type { SessionContext } from "../services/session.service";

interface PassportRequest extends Request {
    user?: OAuthProfile;
}

@ApiTags("auth")
@Controller("auth")
export class AuthOAuthController {
    constructor(
        private readonly auth: AuthService,
        private readonly config: ApiConfigService,
    ) { }

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
