import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { ChannelType, ChannelVisibility } from "@prisma/client";

export class CreateChannelDto {
  @ApiProperty({ example: "payments" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: "payments" })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, {
    message: "Slug must be lowercase letters, numbers and dashes",
  })
  slug!: string;

  @ApiPropertyOptional({ enum: ChannelType, default: ChannelType.CHANNEL })
  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @ApiPropertyOptional({ enum: ChannelVisibility, default: ChannelVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ChannelVisibility)
  visibility?: ChannelVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ example: "Payment integration work" })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateChannelDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class AddChannelMemberDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  userId!: string;
}
