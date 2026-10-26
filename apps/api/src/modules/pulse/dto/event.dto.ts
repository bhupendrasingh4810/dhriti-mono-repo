import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { CalendarEventKind, EventAvailability, EventPrivacy, RsvpStatus } from "@prisma/client";

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

  @ApiPropertyOptional({ enum: CalendarEventKind, default: CalendarEventKind.EVENT })
  @IsOptional()
  @IsEnum(CalendarEventKind)
  kind?: CalendarEventKind;

  @ApiPropertyOptional({ enum: EventAvailability, default: EventAvailability.BUSY })
  @IsOptional()
  @IsEnum(EventAvailability)
  availability?: EventAvailability;

  @ApiPropertyOptional({ enum: EventPrivacy, default: EventPrivacy.DEFAULT })
  @IsOptional()
  @IsEnum(EventPrivacy)
  privacy?: EventPrivacy;

  @ApiPropertyOptional({ description: "Minutes before the event to remind the organizer" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  reminderMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOnlineMeeting?: boolean;

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

  @ApiPropertyOptional({ description: "Weekly RFC 5545 RRULE only" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  recurrenceRule?: string;

  @ApiPropertyOptional({ enum: EventAvailability })
  @IsOptional()
  @IsEnum(EventAvailability)
  availability?: EventAvailability;

  @ApiPropertyOptional({ enum: EventPrivacy })
  @IsOptional()
  @IsEnum(EventPrivacy)
  privacy?: EventPrivacy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10080)
  reminderMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOnlineMeeting?: boolean;
}

export class CreateEventRequestDto extends CreateEventDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  calendarId!: string;
}

export class CreateMeetingDto extends CreateEventRequestDto {
  @ApiProperty({ type: [String], description: "One or more attendee user ids" })
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  declare attendeeUserIds: string[];
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

  @ApiPropertyOptional({ description: "Optional reason supplied when declining an invitation" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  declineReason?: string;
}

export class AddAttendeeDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  userId!: string;
}
