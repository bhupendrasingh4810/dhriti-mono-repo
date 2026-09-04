import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

const ENTITY_TYPES = ["message", "issue", "page", "event", "user"] as const;
export type SearchEntityType = (typeof ENTITY_TYPES)[number];

export class SearchQueryDto {
  @ApiProperty({ example: "payment" })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  q!: string;

  @ApiPropertyOptional({ enum: ENTITY_TYPES, description: "Restrict to one entity type" })
  @IsOptional()
  @IsIn(ENTITY_TYPES)
  type?: SearchEntityType;

  @ApiPropertyOptional({ default: 25, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
