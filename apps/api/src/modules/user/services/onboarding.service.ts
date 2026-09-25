import { HttpStatus, Injectable } from "@nestjs/common";
import type { OnBoardingProfile } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { OnboardingProfileDto, type OnboardingProfileResponse } from "../dto/onboarding.dto";

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<OnboardingProfileResponse> {
    await this.assertActiveUser(userId);
    const profile = await this.prisma.onBoardingProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "Onboarding profile not found", HttpStatus.NOT_FOUND);
    }

    return this.toResponse(profile);
  }

  async updateProfile(userId: string, dto: OnboardingProfileDto): Promise<OnboardingProfileResponse> {
    await this.assertActiveUser(userId);

    if (dto.isOnBoarded && (!dto.privacyPolicyAccepted || !dto.termsAccepted)) {
      throw new AppError(
        ErrorCode.TERMS_NOT_ACCEPTED,
        "Terms of service and privacy policy must be accepted before completing onboarding",
        HttpStatus.BAD_REQUEST,
      );
    }

    const legalAcceptedAt = dto.privacyPolicyAccepted && dto.termsAccepted ? new Date() : new Date(dto.acceptedAt);

    const profile = await this.prisma.onBoardingProfile.upsert({
      where: { userId },
      create: {
        userId,
        isOnBoarded: dto.isOnBoarded,
        isOrgAdded: dto.isOrgAdded,
        usageType: dto.usageType.trim(),
        experience: dto.experience.trim(),
        isProfilePhotoSkipped: dto.isProfilePhotoSkipped,
        legalAcceptedAt,
        legalPrivacyPolicyAccepted: dto.privacyPolicyAccepted,
        legalPrivacyPolicyVersion: dto.privacyPolicyVersion.trim(),
        legalTermsAccepted: dto.termsAccepted,
        legalTermsVersion: dto.termsVersion.trim(),
      },
      update: {
        isOnBoarded: dto.isOnBoarded,
        isOrgAdded: dto.isOrgAdded,
        usageType: dto.usageType.trim(),
        experience: dto.experience.trim(),
        isProfilePhotoSkipped: dto.isProfilePhotoSkipped,
        legalAcceptedAt,
        legalPrivacyPolicyAccepted: dto.privacyPolicyAccepted,
        legalPrivacyPolicyVersion: dto.privacyPolicyVersion.trim(),
        legalTermsAccepted: dto.termsAccepted,
        legalTermsVersion: dto.termsVersion.trim(),
      },
    });

    return this.toResponse(profile);
  }

  private async assertActiveUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }
  }

  private toResponse(profile: OnBoardingProfile): OnboardingProfileResponse {
    return {
      isOnBoarded: profile.isOnBoarded,
      isOrgAdded: profile.isOrgAdded,
      usageType: profile.usageType,
      experience: profile.experience,
      isProfilePhotoSkipped: profile.isProfilePhotoSkipped,
      acceptedAt: profile.legalAcceptedAt.toISOString(),
      privacyPolicyAccepted: profile.legalPrivacyPolicyAccepted,
      privacyPolicyVersion: profile.legalPrivacyPolicyVersion,
      termsAccepted: profile.legalTermsAccepted,
      termsVersion: profile.legalTermsVersion,
    };
  }
}
