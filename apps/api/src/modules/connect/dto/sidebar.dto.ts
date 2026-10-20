import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";

export class SidebarSectionDto {
  @ApiProperty()
  @IsUUID()
  id!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  name!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  conversationIds!: string[];
}

export class UpdateSidebarSettingsDto {
  @ApiPropertyOptional({ enum: ["always", "unread", "hidden"] })
  @IsOptional()
  @IsIn(["always", "unread", "hidden"])
  mentions?: "always" | "unread" | "hidden";

  @ApiPropertyOptional({ enum: ["always", "unread", "hidden"] })
  @IsOptional()
  @IsIn(["always", "unread", "hidden"])
  threads?: "always" | "unread" | "hidden";

  @ApiPropertyOptional({ enum: ["visible", "hidden"] })
  @IsOptional()
  @IsIn(["visible", "hidden"])
  drafts?: "visible" | "hidden";

  @ApiPropertyOptional({ enum: ["all", "unread"] })
  @IsOptional()
  @IsIn(["all", "unread"])
  favoritesFilter?: "all" | "unread";

  @ApiPropertyOptional({ enum: ["all", "unread"] })
  @IsOptional()
  @IsIn(["all", "unread"])
  chatsFilter?: "all" | "unread";

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  expandedTeamIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  hiddenConversationIds?: string[];

  @ApiPropertyOptional({ type: [SidebarSectionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SidebarSectionDto)
  customSections?: SidebarSectionDto[];
}

export class SetPersonalMessageDto {
  @ApiProperty({ enum: ["saved", "followed"] })
  @IsIn(["saved", "followed"])
  kind!: "saved" | "followed";

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}

export class SetSidebarFavoriteDto {
  @ApiProperty({ enum: ["chat", "team", "channel"] })
  @IsIn(["chat", "team", "channel"])
  itemType!: "chat" | "team" | "channel";

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  itemId!: string;

  @ApiProperty()
  @IsBoolean()
  isFavorite!: boolean;
}

export class UpdateConversationNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  muted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyWhenAvailable?: boolean;
}

export class CreateDirectConversationDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  userId!: string;
}
