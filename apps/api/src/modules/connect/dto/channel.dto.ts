import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from "class-validator";
import { ChannelLayout, ChannelType, ChannelVisibility } from "@prisma/client";

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

  @ApiPropertyOptional({ enum: ChannelLayout, default: ChannelLayout.THREADS })
  @IsOptional()
  @IsEnum(ChannelLayout)
  layout?: ChannelLayout;

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

  @ApiPropertyOptional({ description: "A JPEG, PNG, WebP, or GIF data URL up to 2 MiB." })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(/^data:image\/(jpeg|png|webp|gif);base64,[a-zA-Z0-9+/]+={0,2}$/)
  imageUrl?: string;
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

  @ApiPropertyOptional({ enum: ChannelLayout })
  @IsOptional()
  @IsEnum(ChannelLayout)
  layout?: ChannelLayout;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({ description: "A JPEG, PNG, WebP, or GIF data URL up to 2 MiB." })
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(/^data:image\/(jpeg|png|webp|gif);base64,[a-zA-Z0-9+/]+={0,2}$/)
  imageUrl?: string;
}

export class AddChannelMemberDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: ["ADMIN", "MEMBER"], default: "MEMBER" })
  @IsOptional()
  @IsEnum(["ADMIN", "MEMBER"])
  role?: "ADMIN" | "MEMBER";
}
