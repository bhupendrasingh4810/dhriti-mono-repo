import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";

class EmployeeLifecycleDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  biometricId?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "date" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  retirementDate?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "date" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  resignationDate?: string | null;
}

export class CreateHrmsEmployeeDto extends EmployeeLifecycleDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiProperty() @IsString() @MinLength(1) @Matches(/\S/) @MaxLength(64) employeeNumber!: string;
  @ApiProperty({ example: "ACTIVE" }) @IsString() @MinLength(1) @MaxLength(64) status!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) employmentType?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateHrmsEmployeeDto extends EmployeeLifecycleDto {
  @ApiPropertyOptional()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(64)
  employeeNumber?: string;
  @ApiPropertyOptional({ example: "ACTIVE" }) @IsOptional() @IsString() @MinLength(1) @MaxLength(64) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) employmentType?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() endDate?: string;
}
