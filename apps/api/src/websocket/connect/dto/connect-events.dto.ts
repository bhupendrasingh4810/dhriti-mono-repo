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

export class MarkChannelReadEventDto extends ChannelRoomEventDto {
  @IsOptional()
  @IsUUID()
  messageId?: string;
}

export class CallInviteEventDto extends ChannelRoomEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  callId!: string;

  @IsIn(["audio", "video"])
  kind!: "audio" | "video";

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  conversationName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  callerName?: string;
}

export class CallResponseEventDto extends ChannelRoomEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  callId!: string;

  @IsIn(["accept", "reject", "cancel", "end"])
  action!: "accept" | "reject" | "cancel" | "end";
}

export type PresenceStatus = "online" | "away" | "dnd" | "in-meeting" | "offline";
