import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { CadencePhase, CadenceSessionType } from "@prisma/client";

export class CreateSessionDto {
  @ApiProperty({ enum: CadenceSessionType })
  @IsEnum(CadenceSessionType)
  type!: CadenceSessionType;

  @ApiProperty({ example: "Sprint 24 Retro" })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ default: true, description: "Hide card authors until facilitator reveals" })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class UpdatePhaseDto {
  @ApiProperty({ enum: CadencePhase })
  @IsEnum(CadencePhase)
  phase!: CadencePhase;
}

export class CreateCardDto {
  @ApiProperty({ example: "Release went smoothly" })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiProperty({ example: "went-well", description: "Column lane (went-well | to-improve | action-items | custom)" })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  column!: string;
}

export class GroupCardDto {
  @ApiPropertyOptional({ format: "uuid", description: "Group id to assign; null to ungroup" })
  @IsOptional()
  @IsUUID()
  groupId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  position?: number;
}

export class VoteCardDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  cardId!: string;
}
