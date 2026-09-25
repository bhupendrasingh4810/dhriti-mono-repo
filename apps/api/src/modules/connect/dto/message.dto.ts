import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

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
}

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;
}

export class ListMessagesQueryDto {
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
