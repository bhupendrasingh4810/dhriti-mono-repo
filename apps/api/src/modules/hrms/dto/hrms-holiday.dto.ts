import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

/** The client downscales images to a small JPEG/PNG/WebP data URL; ~400 KB is a generous ceiling. */
const IMAGE_MAX_LENGTH = 400_000;
const IMAGE_PATTERN = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

export class UpsertHrmsHolidayDto {
  @ApiPropertyOptional({ description: "Existing holiday id when editing" }) @IsOptional() @IsUUID() id?: string;
  @ApiProperty({ example: "2026-01-26" }) @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHalfDay?: boolean;
  @ApiPropertyOptional({ nullable: true, description: "Null/omitted = all locations" }) @IsOptional() @IsUUID() workLocationId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(IMAGE_MAX_LENGTH) @Matches(IMAGE_PATTERN) imageUrl?: string | null;
}

export class HolidayImportItemDto {
  @ApiProperty() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHalfDay?: boolean;
  @ApiPropertyOptional({ description: "Work location name; blank = all locations" }) @IsOptional() @IsString() @MaxLength(120) locationName?: string;
}

export class ImportHrmsHolidaysDto {
  @ApiProperty({ type: [HolidayImportItemDto] })
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => HolidayImportItemDto)
  items!: HolidayImportItemDto[];
}

export class HolidayListQueryDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(2000) @Max(2100) year!: number;
}

export class SendHrmsHolidayListDto {
  @ApiProperty() @IsInt() @Min(2000) @Max(2100) year!: number;
  @ApiPropertyOptional({ description: "Employee ids; omit to send to every active employee" })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @IsUUID("all", { each: true })
  employeeIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) message?: string;
  @ApiPropertyOptional({ description: "Only include holidays changed since the previous send for the year" })
  @IsOptional()
  @IsBoolean()
  changesOnly?: boolean;
}
