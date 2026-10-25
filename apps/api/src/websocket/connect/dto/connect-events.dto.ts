import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

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
  @IsIn(["online", "away", "dnd", "in-meeting", "sharing", "offline"])
  status!: PresenceStatus;
}

export class MarkChannelReadEventDto extends ChannelRoomEventDto {
  @IsOptional()
  @IsUUID()
  messageId?: string;
}

export class CallInviteEventDto extends ChannelRoomEventDto {
  @IsUUID()
  callId!: string;

  @IsOptional()
  @IsIn(["audio", "video"])
  type?: "audio" | "video";

  @IsOptional()
  @IsIn(["audio", "video"])
  kind?: "audio" | "video";

  @IsOptional()
  @IsIn(["meeting"])
  scope?: "meeting";

  @IsString()
  @MaxLength(200)
  conversationName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  receiverName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  callerName?: string;
}

export class CallResponseEventDto extends ChannelRoomEventDto {
  @IsUUID()
  callId!: string;

  @IsIn(["accept", "reject", "miss", "cancel", "end", "leave"])
  action!: "accept" | "reject" | "miss" | "cancel" | "end" | "leave";

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  durationSeconds?: number;
}

export type PresenceStatus = "online" | "away" | "dnd" | "in-meeting" | "sharing" | "offline";
