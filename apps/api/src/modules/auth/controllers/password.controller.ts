import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Ip,
    Post,
    Req,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";

import { Public } from "../../../common/decorators/public.decorator";
import {
    CurrentUser,
    type AuthenticatedUser,
} from "../../../common/decorators/current-user.decorator";

import { PasswordService } from "../services/password.service";
import {
    ChangePasswordDto,
    ForgotPasswordDto,
    ResetPasswordDto,
} from "../dto/password.dto";

@ApiTags("auth")
@Controller("auth")
export class PasswordController {
    constructor(
        private readonly passwordService: PasswordService,
    ) { }

    @Public()
    @Post("forgot-password")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Request a password reset email (always succeeds)" })
    async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
        return this.passwordService.forgotPassword(dto.email);
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
        console.log(dto, ipAddress, request);
        return this.passwordService.resetPassword(dto.token, dto.newPassword, ipAddress, request.get("user-agent") ?? "Unknown device");
    }

    @Post("change-password")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Change password; revokes all other sessions" })
    async changePassword(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: ChangePasswordDto,
    ): Promise<void> {
        return this.passwordService.changePassword(user, dto.currentPassword, dto.newPassword);
    }
}
