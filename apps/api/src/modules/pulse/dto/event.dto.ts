import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";
import { RsvpStatus } from "@prisma/client";

export class CreateEventDto {
  @ApiProperty({ example: "Sprint Review" })
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title!: string;

  @ApiProperty()
  @IsDateString()
  startsAt!: string;

  @ApiProperty()
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  meetingUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ description: "RFC 5545 RRULE for recurring events" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  recurrenceRule?: string;

  @ApiPropertyOptional({ type: [String], description: "Attendee user ids" })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  attendeeUserIds?: string[];
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  meetingUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;
}

export class ListEventsQueryDto {
  @ApiProperty({ description: "Start of the range (ISO 8601)" })
  @IsDateString()
  from!: string;

  @ApiProperty({ description: "End of the range (ISO 8601)" })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  calendarId?: string;
}

export class RsvpDto {
  @ApiProperty({ enum: RsvpStatus })
  @IsEnum(RsvpStatus)
  status!: RsvpStatus;
}

export class AddAttendeeDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  userId!: string;
}
