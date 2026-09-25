import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class ChannelRoomEventDto {
  @IsUUID()
  channelId!: string;
}

export class TypingEventDto extends ChannelRoomEventDto {
  @IsBoolean()
  isTyping!: boolean;
}

export class SendMessageEventDto extends ChannelRoomEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  clientMessageId?: string;
}

export class PresenceSetEventDto {
  @IsIn(["online", "away", "dnd", "in-meeting", "offline"])
  status!: PresenceStatus;
}

export class MarkChannelReadEventDto extends ChannelRoomEventDto {}

export type PresenceStatus = "online" | "away" | "dnd" | "in-meeting" | "offline";
