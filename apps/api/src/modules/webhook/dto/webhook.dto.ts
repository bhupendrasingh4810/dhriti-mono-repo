import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class CreateWebhookDto {
  @ApiProperty({ example: "https://hooks.example.com/dhriti" })
  @IsUrl({ require_tld: false, protocols: ["https", "http"] })
  @MaxLength(2048)
  url!: string;

  @ApiProperty({
    type: [String],
    example: ["flow.issue.created", "connect.message.created"],
    description: "Event types to subscribe to",
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;
}

export class UpdateWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ["https", "http"] })
  @MaxLength(2048)
  url?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;
}
