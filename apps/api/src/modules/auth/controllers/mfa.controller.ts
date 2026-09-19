import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";

import {
    CurrentUser,
    type AuthenticatedUser,
} from "../../../common/decorators/current-user.decorator";

import { AuthService } from "../services/auth.service";
import { MfaService } from "../services/mfa.service";
import {
    MfaConfirmDto,
    MfaDisableDto,
    type MfaConfirmResponse,
    type MfaSetupResponse,
} from "../dto/mfa.dto";
import { PasswordService } from "../services/password.service";

@ApiTags("auth/mfa")
@Controller("auth/mfa")
export class MfaController {
    constructor(
        private readonly auth: AuthService,
        private readonly mfa: MfaService,
        private readonly passwordService: PasswordService,
    ) { }

    // ---------------- MFA management ----------------

    @Post("setup")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Start TOTP setup; returns secret and QR code" })
    async setupMfa(@CurrentUser() user: AuthenticatedUser): Promise<MfaSetupResponse> {
        return this.mfa.beginSetup(user.userId, user.email);
    }

    @Post("confirm")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Confirm TOTP setup; returns one-time recovery codes" })
    async confirmMfa(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: MfaConfirmDto,
    ): Promise<MfaConfirmResponse> {
        return this.mfa.confirmSetup(user.userId, dto.code);
    }

    @Post("disable")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Disable MFA with password and current TOTP" })
    async disableMfa(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: MfaDisableDto,
    ): Promise<void> {
        await this.passwordService.verifyUserPassword(user.userId, dto.password);
        return this.mfa.disable(user.userId, dto.code);
    }
}
