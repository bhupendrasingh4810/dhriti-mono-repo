import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp|gif);base64,[a-zA-Z0-9+/]+={0,2}$/;
const HEX_COLOR = /^(?:#[0-9a-fA-F]{3,8}|var\(--[a-zA-Z][a-zA-Z0-9-]*\))$/;

export class CreatePollOptionDto {
  @ApiProperty({ example: "Wednesday" })
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  content!: string;
}

export class CreatePollDto {
  @ApiProperty({ type: [CreatePollOptionDto], minItems: 2, maxItems: 20 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreatePollOptionDto)
  options!: CreatePollOptionDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowsVoteChanges?: boolean;

  @ApiPropertyOptional({ format: "date-time", description: "Frontend-selected poll closing time" })
  @IsOptional()
  @IsDateString()
  closesAt?: string;
}

export class CreatePostDto {
  @ApiPropertyOptional({ example: "Team offsite" })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @ApiProperty({ example: "Vote on your preferred date." })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  contentHtml?: string;

  @ApiPropertyOptional({ description: "A JPEG, PNG, WebP, or GIF data URL up to 2 MiB." })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(IMAGE_DATA_URL)
  imageUrl?: string;

  @ApiPropertyOptional({ description: "A JPEG, PNG, WebP, or GIF data URL up to 2 MiB." })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(IMAGE_DATA_URL)
  backgroundImageUrl?: string;

  @ApiPropertyOptional({ description: "A hex color or semantic CSS custom-property token." })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(HEX_COLOR)
  backgroundColor?: string;

  @ApiPropertyOptional({ type: CreatePollDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}

export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  contentHtml?: string;

  @ApiPropertyOptional({ description: "A JPEG, PNG, WebP, or GIF data URL up to 2 MiB." })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(IMAGE_DATA_URL)
  imageUrl?: string;

  @ApiPropertyOptional({ description: "A JPEG, PNG, WebP, or GIF data URL up to 2 MiB." })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(IMAGE_DATA_URL)
  backgroundImageUrl?: string;

  @ApiPropertyOptional({ description: "A hex color or semantic CSS custom-property token." })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(HEX_COLOR)
  backgroundColor?: string;
}

export class VotePollDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  optionId!: string;
}

export class CreatePostCommentDto {
  @ApiProperty({ example: "This is a great update." })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

export class UpdatePostCommentDto {
  @ApiProperty({ example: "This is an updated comment." })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}
