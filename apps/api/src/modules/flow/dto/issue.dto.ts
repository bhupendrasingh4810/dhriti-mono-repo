import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
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
import { IssuePriority, IssueStatus } from "@prisma/client";
import { Type } from "class-transformer";

export class CreateIssueDto {
  @ApiProperty({ example: "Fix duplicate payment transactions" })
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional({ enum: IssueStatus, default: IssueStatus.BACKLOG })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: IssuePriority, default: IssuePriority.NONE })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional({ description: "Story-point estimate" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  estimate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateIssueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: IssuePriority })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ description: "Set to null to unassign" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;

  @ApiPropertyOptional({ description: "Set to null to remove from sprint" })
  @IsOptional()
  @IsUUID()
  sprintId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  estimate?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;
}

export class ListIssuesQueryDto {
  @ApiPropertyOptional({ enum: IssueStatus })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({ enum: IssuePriority })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @ApiPropertyOptional({ default: 100, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class MoveIssueDto {
  @ApiProperty({ enum: IssueStatus })
  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @ApiPropertyOptional({ description: "Board/list ordering position" })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
