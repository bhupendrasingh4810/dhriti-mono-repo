import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateOrgSettingsDto {
  @ApiPropertyOptional({ example: "acme.com" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  domain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  brandingLogoUrl?: string;

  @ApiPropertyOptional({ example: "Asia/Kolkata" })
  @IsOptional()
  @IsTimeZone()
  timezone?: string;

  @ApiPropertyOptional({ example: "en" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @ApiPropertyOptional({ description: "Require MFA for all members" })
  @IsOptional()
  @IsBoolean()
  mfaEnforced?: boolean;

  @ApiPropertyOptional({ minimum: 8, maximum: 64 })
  @IsOptional()
  @IsInt()
  @Min(8)
  @Max(64)
  passwordMinLength?: number;

  @ApiPropertyOptional({ description: "Session timeout in minutes" })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(43200)
  sessionTimeoutMinutes?: number;

  @ApiPropertyOptional({ description: "Auto-delete data older than N days (null = keep forever)" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  dataRetentionDays?: number | null;
}

export class UpdateOrgEntitlementDto {
  @ApiProperty({ description: "Product key, e.g. connect | flow | atlas | pulse | nexus | cadence" })
  @IsString()
  productKey!: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}

export class UpsertOrgFeatureFlagDto {
  @ApiProperty({ example: "ai-summaries" })
  @IsString()
  @MaxLength(120)
  key!: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}
