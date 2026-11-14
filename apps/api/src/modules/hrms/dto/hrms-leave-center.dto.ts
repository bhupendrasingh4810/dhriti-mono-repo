import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LeaveType } from "@prisma/client";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpsertHrmsLeaveTypeDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() id?: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) name!: string;
  @ApiProperty() @IsString() @Matches(/^[A-Z0-9_]{2,20}$/) code!: string;
  @ApiPropertyOptional({ enum: LeaveType }) @IsOptional() @IsEnum(LeaveType) category?: LeaveType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) annualDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) carryForwardDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPaid?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowHalfDay?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCompOff?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ApplyHrmsLeaveDto {
  @ApiProperty() @IsUUID() leaveTypeId!: string;
  @ApiProperty({ format: "date" }) @IsDateString() startDate!: string;
  @ApiProperty({ format: "date" }) @IsDateString() endDate!: string;
  @ApiProperty() @IsNumber() @Min(0.5) totalDays!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  /** StoredFile id returned by POST organization/files; must be uploaded by the caller. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() attachmentFileId?: string;
  /** Only honoured on the on-behalf route. */
  @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string;
}

export class ApplyHrmsCompOffDto {
  @ApiProperty({ format: "date" }) @IsDateString() workedDate!: string;
  /** Last day worked; omit for a single day. */
  @ApiPropertyOptional({ format: "date" }) @IsOptional() @IsDateString() workedEndDate?: string;
  @ApiProperty() @IsNumber() @Min(0.5) days!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string;
}

export class DecideHrmsRequestDto {
  @ApiProperty({ enum: ["APPROVED", "REJECTED"] }) @IsIn(["APPROVED", "REJECTED"]) status!: "APPROVED" | "REJECTED";
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}

export class RequestMoreInfoDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) note!: string;
}

export class ReplyMoreInfoDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) reply!: string;
}

export class TeamLeaveQueryDto {
  @ApiProperty({ format: "date" }) @IsDateString() from!: string;
  @ApiProperty({ format: "date" }) @IsDateString() to!: string;
}
