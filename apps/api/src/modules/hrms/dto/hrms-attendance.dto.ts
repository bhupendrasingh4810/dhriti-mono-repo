import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { AttendanceStatus } from "@prisma/client";

export class UpsertHrmsAttendanceDto {
  @ApiProperty({ format: "date" }) @IsDateString() date!: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() checkIn?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() checkOut?: string;
  @ApiPropertyOptional({ enum: AttendanceStatus }) @IsOptional() @IsEnum(AttendanceStatus) status?: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) workHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
