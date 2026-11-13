import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, MaxLength, MinLength, Min } from "class-validator";
import { AttendanceRegularizationType, AttendanceStatus } from "@prisma/client";

export class UpsertHrmsAttendanceDto {
  @ApiProperty({ format: "date" }) @IsDateString() date!: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() checkIn?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() checkOut?: string;
  @ApiPropertyOptional({ enum: AttendanceStatus }) @IsOptional() @IsEnum(AttendanceStatus) status?: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) workHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class ClockInDto {
  /** Fallback calendar day (YYYY-MM-DD) for employees without a shift; shifted employees use the shift's own day and zone. */
  @ApiProperty({ format: "date" }) @IsDateString({ strict: true }) date!: string;
}

export class CreateAttendanceRegularizationDto {
  @ApiProperty({ format: "date" }) @IsDateString({ strict: true }) date!: string;
  @ApiProperty({ enum: AttendanceRegularizationType }) @IsEnum(AttendanceRegularizationType) type!: AttendanceRegularizationType;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() requestedCheckIn?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() requestedCheckOut?: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) reason!: string;
}

export class DecideAttendanceRegularizationDto {
  @ApiProperty({ enum: ["APPROVED", "REJECTED"] }) @IsIn(["APPROVED", "REJECTED"]) status!: "APPROVED" | "REJECTED";
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) decisionNote!: string;
}
