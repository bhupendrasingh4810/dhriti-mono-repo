import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ChannelVisibility } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from "class-validator";

export class CreateConnectTeamDto {
  @ApiProperty({ example: "Engineering" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "engineering" })
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  @Matches(/^[a-z0-9][a-z0-9-]*$/, { message: "Slug must be lowercase letters, numbers and dashes" })
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: ChannelVisibility, default: ChannelVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ChannelVisibility)
  visibility?: ChannelVisibility;
}

export class UpdateConnectTeamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: ChannelVisibility })
  @IsOptional()
  @IsEnum(ChannelVisibility)
  visibility?: ChannelVisibility;
}

export class UpsertConnectMemberDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ enum: ["ADMIN", "MEMBER"], default: "MEMBER" })
  @IsOptional()
  @IsEnum(["ADMIN", "MEMBER"])
  role?: "ADMIN" | "MEMBER";
}
