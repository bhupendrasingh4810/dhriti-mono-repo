import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
} from "@nestjs/common";
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

import { Public } from "../../../common/decorators/public.decorator";

import { AuthService } from "../services/auth.service";
import { RegisterDto } from "../dto/register.dto";
import { ResendVerificationDto, VerifyEmailDto, } from "../dto/token.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthRegistrationController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    // ---------------- Registration & email verification ----------------

    @Public()
    @Post("register")
    @ApiOperation({ summary: "Register a new user and send verification email" })
    @ApiResponse({ status: 201, description: "User created; verification email sent" })
    @ApiResponse({ status: 409, description: "Email already registered" })
    async register(@Body() dto: RegisterDto): Promise<{ userId: string; email: string }> {
        return this.authService.register(dto);
    }

    @Public()
    @Post("verify-email")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Verify email address with the emailed token" })
    @ApiResponse({ status: 204 })
    async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
        return this.authService.verifyEmail(dto.token);
    }

    @Public()
    @Post("resend-verification")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Resend the verification email (no account enumeration)" })
    @ApiResponse({ status: 204 })
    async resendVerification(@Body() dto: ResendVerificationDto): Promise<void> {
        return this.authService.resendVerification(dto.email);
    }
}
