import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsLocale, IsOptional, IsString, IsTimeZone, IsUrl, MaxLength, MinLength } from "class-validator";
import type { OrganizationResponse } from "./auth-response.dto";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Jane Doe" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatars/jane.png" })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: "Asia/Kolkata" })
  @IsOptional()
  @IsTimeZone()
  timezone?: string;

  @ApiPropertyOptional({ example: "en" })
  @IsOptional()
  @IsLocale()
  locale?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  organization: OrganizationResponse | null;
  timezone: string;
  role: string;
  locale: string;
  status: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
