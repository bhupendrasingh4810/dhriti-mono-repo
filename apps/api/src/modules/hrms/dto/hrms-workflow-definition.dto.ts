import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { HrmsWorkflowDefinitionStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateHrmsWorkflowDefinitionDto {
  @ApiProperty() @IsString() @MaxLength(160) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiProperty({ type: [Object] }) @IsArray() stages!: Record<string, unknown>[];
  @ApiProperty({ type: [Object] }) @IsArray() transitions!: Record<string, unknown>[];
}

export class UpdateHrmsWorkflowDefinitionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() stages?: Record<string, unknown>[];
  @ApiPropertyOptional({ type: [Object] }) @IsOptional() @IsArray() transitions?: Record<string, unknown>[];
  @ApiPropertyOptional({ enum: ["DRAFT", "ARCHIVED"] })
  @IsOptional()
  @IsIn(["DRAFT", "ARCHIVED"])
  status?: Extract<HrmsWorkflowDefinitionStatus, "DRAFT" | "ARCHIVED">;
}

export class ListHrmsWorkflowDefinitionsDto {
  @ApiPropertyOptional({ enum: ["DRAFT", "ACTIVE", "ARCHIVED"] })
  @IsOptional()
  @IsIn(["DRAFT", "ACTIVE", "ARCHIVED"])
  status?: HrmsWorkflowDefinitionStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === "true"))
  isTemplate?: boolean;
}

export class CloneHrmsWorkflowDefinitionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) name?: string;
}

export class CreateHrmsWorkflowInstanceDto {
  @ApiProperty() @IsString() definitionId!: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() context?: Record<string, unknown>;
}

export class ListHrmsWorkflowInstancesDto {
  @ApiPropertyOptional({ enum: ["ACTIVE", "COMPLETED", "REJECTED", "CANCELLED"] })
  @IsOptional()
  @IsIn(["ACTIVE", "COMPLETED", "REJECTED", "CANCELLED"])
  status?: "ACTIVE" | "COMPLETED" | "REJECTED" | "CANCELLED";
  @ApiPropertyOptional() @IsOptional() @IsString() definitionId?: string;
}

export class ActOnHrmsWorkflowInstanceDto {
  @ApiProperty({ enum: ["APPROVE", "REJECT", "COMPLETE"] })
  @IsIn(["APPROVE", "REJECT", "COMPLETE"])
  action!: "APPROVE" | "REJECT" | "COMPLETE";
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) comment?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}
