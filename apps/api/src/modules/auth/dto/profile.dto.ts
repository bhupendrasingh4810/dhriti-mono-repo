import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsLocale,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import type { PersonalProfileDetails, EmploymentProfileDetails, UpdatePersonalProfileInput } from "@dhriti/types";
import type { OrganizationResponse } from "./auth-response.dto";

export class UpdateProfileDto implements UpdatePersonalProfileInput {
  @ApiPropertyOptional({ example: "Jane Doe" })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatars/jane.png" })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: "Asia/Kolkata" })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsTimeZone()
  timezone?: string;

  @ApiPropertyOptional({ example: "en" })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsLocale()
  locale?: string;

  @ApiPropertyOptional({ nullable: true, example: "Ms." })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  prefix?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "date", example: "1995-06-15" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  gender?: string | null;

  @ApiPropertyOptional({ nullable: true, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] })
  @IsOptional()
  @IsIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
  bloodGroup?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nationality?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "jane@company.com" })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  workEmail?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "jane@example.com" })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  alternateEmail?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "+91" })
  @IsOptional()
  @Matches(/^\+[1-9]\d{0,3}$/)
  isdCode?: string | null;

  @ApiPropertyOptional({ nullable: true, example: "9876543210" })
  @IsOptional()
  @Matches(/^\d{4,14}$/)
  mobileNumber?: string | null;
}

export interface UserProfileResponse extends PersonalProfileDetails, EmploymentProfileDetails {
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
  isPlatformUser: boolean;
}
