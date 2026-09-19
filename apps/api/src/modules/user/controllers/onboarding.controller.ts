import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import {
	CurrentUser,
	type AuthenticatedUser,
} from "../../../common/decorators/current-user.decorator";
import {
	OnboardingProfileDto,
	type OnboardingProfileResponse,
} from "../dto/onboarding.dto";
import { OnboardingService } from "../services/onboarding.service";

@ApiTags("onboarding")
@ApiBearerAuth()
@Controller("onboarding")
export class OnboardingController {
	constructor(private readonly onboarding: OnboardingService) {}

	@Get()
	@ApiOperation({ summary: "Get the current user's onboarding progress" })
	async getProfile(@CurrentUser() user: AuthenticatedUser): Promise<OnboardingProfileResponse> {
		return this.onboarding.getProfile(user.userId);
	}

	@Patch()
	@ApiOperation({ summary: "Update the current user's onboarding progress" })
	async updateProfile(
		@CurrentUser() user: AuthenticatedUser,
		@Body() dto: OnboardingProfileDto,
	): Promise<OnboardingProfileResponse> {
		return this.onboarding.updateProfile(user.userId, dto);
	}
}
