import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateHrmsEmployeeDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(64) employeeNumber!: string;
  @ApiProperty({ example: "ACTIVE" }) @IsString() @MinLength(1) @MaxLength(64) status!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) employmentType?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateHrmsEmployeeDto {
  @ApiPropertyOptional({ example: "ACTIVE" }) @IsOptional() @IsString() @MinLength(1) @MaxLength(64) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) employmentType?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() endDate?: string;
}