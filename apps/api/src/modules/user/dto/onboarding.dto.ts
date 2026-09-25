import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsString } from "class-validator";

export class OnboardingProfileDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isOnBoarded!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  isOrgAdded!: boolean;

  @ApiProperty({ example: "professional" })
  @IsString()
  usageType!: string;

  @ApiProperty({ example: "beginner" })
  @IsString()
  experience!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isProfilePhotoSkipped!: boolean;

  @ApiProperty({ example: "2026-09-19T12:00:00.000Z" })
  @IsDateString()
  acceptedAt!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  privacyPolicyAccepted!: boolean;

  @ApiProperty({ example: "2026-09-01" })
  @IsString()
  privacyPolicyVersion!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  termsAccepted!: boolean;

  @ApiProperty({ example: "2026-09-01" })
  @IsString()
  termsVersion!: string;
}

export interface OnboardingProfileResponse {
  isOnBoarded: boolean;
  isOrgAdded: boolean;
  usageType: string;
  experience: string;
  isProfilePhotoSkipped: boolean;
  acceptedAt: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyVersion: string;
  termsAccepted: boolean;
  termsVersion: string;
}
