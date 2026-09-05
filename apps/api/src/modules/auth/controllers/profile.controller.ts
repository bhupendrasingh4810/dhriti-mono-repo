import {
    Body,
    Controller,
    Get,
    Patch,
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
import { UpdateProfileDto, type UserProfileResponse } from "../dto/profile.dto";


@ApiTags("auth")
@Controller("auth")
export class AuthProfileController {
    constructor(
        private readonly auth: AuthService,
    ) { }

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
}
