import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class TrackEventDto {
  @ApiProperty({ example: "message.sent" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  event!: string;

  @ApiProperty({ example: "connect", description: "connect | flow | atlas | pulse | nexus | cadence | platform" })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  app!: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AnalyticsQueryDto {
  @ApiProperty({ description: "Start of the range (ISO 8601)" })
  @IsDateString()
  from!: string;

  @ApiProperty({ description: "End of the range (ISO 8601)" })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({ description: "Filter by app" })
  @IsOptional()
  @IsString()
  app?: string;

  @ApiPropertyOptional({ default: 30, maximum: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number;
}
