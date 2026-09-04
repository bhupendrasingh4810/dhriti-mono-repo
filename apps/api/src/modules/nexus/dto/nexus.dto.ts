import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SummarizeConversationDto {
  @ApiProperty({ format: "uuid", description: "Connect channel to summarize" })
  @IsUUID()
  channelId!: string;

  @ApiPropertyOptional({ description: "Limit to recent messages", default: 50 })
  @IsOptional()
  messageLimit?: number;
}

export class SummarizePageDto {
  @ApiProperty({ format: "uuid", description: "Atlas page to summarize" })
  @IsUUID()
  pageId!: string;
}

export class ExtractTasksDto {
  @ApiProperty({ description: "Free text to extract action items from" })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  text!: string;
}

export class AskDto {
  @ApiProperty({ example: "What changed in the payment project this week?" })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  question!: string;

  @ApiPropertyOptional({ description: "Continue an existing conversation" })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
