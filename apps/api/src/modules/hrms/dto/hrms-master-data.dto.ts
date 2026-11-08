import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

class MasterDataDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(120)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(64)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateMasterDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Matches(/\S/)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(64)
  code?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateHrmsLocationDto extends MasterDataDto {
  @ApiProperty({ example: "IN" })
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: "countryCode must be an ISO 3166-1 alpha-2 code" })
  countryCode!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiProperty({ example: "Asia/Kolkata" })
  @IsString()
  @IsTimeZone()
  @MaxLength(120)
  timezone!: string;
}

export class UpdateHrmsLocationDto extends UpdateMasterDataDto {
  @ApiPropertyOptional({ example: "IN" })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: "countryCode must be an ISO 3166-1 alpha-2 code" })
  countryCode?: string;

  @ApiPropertyOptional({ nullable: true })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @ApiPropertyOptional({ example: "Asia/Kolkata" })
  @IsOptional()
  @IsString()
  @IsTimeZone()
  @MaxLength(120)
  timezone?: string;
}

export class CreateHrmsDesignationDto extends MasterDataDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}

export class UpdateHrmsDesignationDto extends UpdateMasterDataDto {
  @ApiPropertyOptional({ nullable: true })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null)
  @IsUUID()
  departmentId?: string | null;
}

export class CreateHrmsEmploymentTypeDto extends MasterDataDto {}
export class UpdateHrmsEmploymentTypeDto extends UpdateMasterDataDto {}
