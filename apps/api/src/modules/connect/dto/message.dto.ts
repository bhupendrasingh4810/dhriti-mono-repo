import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { CreatePollDto } from "./post.dto";

export class CreateMessageDto {
  @ApiPropertyOptional({ description: "Client-generated UUID used to make retries idempotent" })
  @IsOptional()
  @IsUUID()
  clientMessageId?: string;

  @ApiProperty({ example: "Shipping the fix in [ENG-123]" })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @ApiPropertyOptional({ description: "Parent message id when replying in a thread" })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ type: [String], description: "User ids mentioned with @" })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  mentionUserIds?: string[];

  @ApiPropertyOptional({ type: CreatePollDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}

export class ListMessagesQueryDto {
  @ApiPropertyOptional({ enum: ["unread"] })
  @IsOptional()
  @IsIn(["unread"])
  initial?: "unread";

  @ApiPropertyOptional({ description: "Return messages newer than this message id" })
  @IsOptional()
  @IsUUID()
  after?: string;

  @ApiPropertyOptional({ description: "Return messages older than this cursor (message id)" })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @ApiPropertyOptional({ default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AddReactionDto {
  @ApiProperty({ example: "👍" })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  emoji!: string;
}

export class MarkMessagesReadDto {
  @ApiPropertyOptional({ description: "Newest message actually viewed" })
  @IsOptional()
  @IsUUID()
  messageId!: string;
}
