import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { IssueStatus } from "@prisma/client";

export class CreateColumnDto {
  @ApiProperty({ example: "QA" })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiProperty({ enum: IssueStatus, description: "Status bucket issues land in when dropped here" })
  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @ApiPropertyOptional({ description: "Column order" })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: "Work-in-progress limit" })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  wipLimit?: number;
}

export class UpdateColumnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  wipLimit?: number | null;
}
