import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from "class-validator";

export class CreatePageDto {
  @ApiProperty({ example: "Payment Architecture" })
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title!: string;

  @ApiPropertyOptional({ description: "Parent page id for nesting" })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: "Initial content (markdown/JSON stringified)" })
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdatePageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200000)
  content?: string;

  @ApiPropertyOptional({ description: "Move under a new parent (null to make top-level)" })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class CreateCommentDto {
  @ApiProperty({ example: "Can we add the rate-limiting section?" })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}
