"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  CallRounded,
  DescriptionOutlined,
  MoreVertRounded,
  PeopleRounded,
  SearchRounded,
  StarRounded,
  VideocamRounded,
} from "@mui/icons-material";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { ConnectMessageHoverActions } from "./ConnectMessageHoverActions";

type ConversationUser = {
  id: string;
  displayName: string;
  avatar: string;
  jobTitle: string;
  location?: string;
};

type ConversationAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

type ConversationReaction = {
  emoji: string;
  count: number;
  userIds: string[];
};

export type ConnectConversationWindowMessage = {
  id: string;
  senderId: string;
  content: string;
  contentType: string;
  createdAt: string;
  quotedMessageId?: string;
  attachments?: ConversationAttachment[];
  reactions?: ConversationReaction[];
};

type ConnectConversationWindowProps = {
  conversation: {
    id: string;
    name: string;
    type: "channel" | "direct" | "group";
    isFavorite?: boolean;
    participants: string[];
  };
  teamLabel: string;
  currentUserId: string;
  usersById: Record<string, ConversationUser>;
  messages: ConnectConversationWindowMessage[];
  activeMessageMenuId?: string | null;
  activeMessageEmojiId?: string | null;
  getQuotedMessageById: (id: string) => ConnectConversationWindowMessage | undefined;
  renderMessageContent: (message: ConnectConversationWindowMessage) => ReactNode;
  onOpenDetails: () => void;
  onOpenParticipantsMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onOpenMessageEmoji: (event: React.MouseEvent<HTMLElement>, messageId: string) => void;
  onOpenMessageMenu: (event: React.MouseEvent<HTMLElement>, messageId: string) => void;
  onQuoteMessage: (message: ConnectConversationWindowMessage) => void;
  onOpenReactionHover: (event: React.MouseEvent<HTMLElement>, emoji: string, userIds: string[]) => void;
  onCloseReactionHover: () => void;
  onOpenUserHover: (event: React.MouseEvent<HTMLElement>, userId: string) => void;
  onCloseUserHover: () => void;
  disableHoverActions?: boolean;
  children?: ReactNode;
};

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConnectConversationWindow({
  conversation,
  teamLabel,
  currentUserId,
  usersById,
  messages,
  activeMessageMenuId,
  activeMessageEmojiId,
  getQuotedMessageById,
  renderMessageContent,
  onOpenDetails,
  onOpenParticipantsMenu,
  onAddReaction,
  onOpenMessageEmoji,
  onOpenMessageMenu,
  onQuoteMessage,
  onOpenReactionHover,
  onCloseReactionHover,
  onOpenUserHover,
  onCloseUserHover,
  disableHoverActions = false,
  children,
}: ConnectConversationWindowProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesBottomRef = useRef<HTMLDivElement | null>(null);
  const hoverActionCloseTimerRef = useRef<number | null>(null);

  function clearHoverActionCloseTimer() {
    if (hoverActionCloseTimerRef.current) {
      window.clearTimeout(hoverActionCloseTimerRef.current);
      hoverActionCloseTimerRef.current = null;
    }
  }

  function handleHoverStart(messageId: string) {
    clearHoverActionCloseTimer();
    setHoveredMessageId(messageId);
  }

  function handleHoverEnd(messageId: string) {
    clearHoverActionCloseTimer();
    hoverActionCloseTimerRef.current = window.setTimeout(() => {
      setHoveredMessageId((previous) => (previous === messageId ? null : previous));
      hoverActionCloseTimerRef.current = null;
    }, 160);
  }

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.id, messages.length]);

  useEffect(
    () => () => {
      clearHoverActionCloseTimer();
    },
    []
  );

  useEffect(() => {
    if (disableHoverActions) {
      clearHoverActionCloseTimer();
      setHoveredMessageId(null);
    }
  }, [disableHoverActions]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", bgcolor: "#fff", overflow: "hidden" }}>
      <Box sx={{ height: 56, px: 3, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontSize: 22, color: "#9ca3af", fontWeight: 700 }}>{conversation.type === "channel" ? "#" : "@"}</Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, cursor: "pointer" }} onClick={onOpenDetails}>
            {conversation.name}
          </Typography>
          {conversation.isFavorite ? <StarRounded sx={{ fontSize: 16, color: "#facc15" }} /> : null}
          <Stack direction="row" spacing={1} sx={{ ml: 2, pl: 2, borderLeft: "1px solid #f3f4f6", color: "#9ca3af", alignItems: "center" }}>
            <Typography sx={{ fontSize: 12 }}>{teamLabel}</Typography>
            <Box sx={{ width: 4, height: 4, borderRadius: 99, bgcolor: "#e5e7eb" }} />
            <Typography sx={{ fontSize: 12 }}>{conversation.participants.length} members</Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Button startIcon={<PeopleRounded sx={{ fontSize: 14 }} />} size="small" sx={{ color: "#4b5563", minWidth: "unset" }} onClick={onOpenParticipantsMenu}>
            {conversation.participants.length}
          </Button>
          {[VideocamRounded, CallRounded, SearchRounded, MoreVertRounded].map((Icon, index) => (
            <Box key={`${index}-head`} sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", color: "#9ca3af", "&:hover": { bgcolor: "#f9fafb" } }}>
              <Icon sx={{ fontSize: 17 }} />
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {sortedMessages.map((message, index) => {
          const sender = usersById[message.senderId];
          const isOwn = message.senderId === currentUserId;
          const showActions = !disableHoverActions && hoveredMessageId === message.id;
          const previousMessage = sortedMessages[index - 1];
          const previousTime = previousMessage ? new Date(previousMessage.createdAt).getTime() : 0;
          const currentTime = new Date(message.createdAt).getTime();
          const showTimeByGap = !previousMessage || currentTime - previousTime > 60_000;
          const isContinuation =
            Boolean(previousMessage) &&
            previousMessage.senderId === message.senderId &&
            message.contentType !== "system" &&
            previousMessage.contentType !== "system" &&
            !showTimeByGap;

          const quoted = message.quotedMessageId ? getQuotedMessageById(message.quotedMessageId) : undefined;

          if (message.contentType === "system") {
            return (
              <Stack key={message.id} sx={{ alignItems: "center", py: 0.5 }}>
                <Typography sx={{ fontSize: 12, color: "#6b7280", bgcolor: "#f8fafc", px: 1.5, py: 0.6, borderRadius: 99 }}>
                  {message.content}
                </Typography>
              </Stack>
            );
          }

          return (
            <Stack
              key={message.id}
              direction={isOwn ? "row-reverse" : "row"}
              spacing={1.25}
              sx={{ alignItems: "flex-start" }}
            >
              {!isOwn && !isContinuation ? (
                <Avatar
                  src={sender?.avatar}
                  onMouseEnter={(event: MouseEvent<HTMLElement>) => onOpenUserHover(event, message.senderId)}
                  onMouseLeave={onCloseUserHover}
                  sx={{ width: 34, height: 34, borderRadius: 2, flexShrink: 0, cursor: "pointer" }}
                />
              ) : (
                <Box sx={{ width: 34, flexShrink: 0 }} />
              )}

              <Box sx={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", maxWidth: "75%", position: "relative" }}>
                {!isOwn && !isContinuation ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mb: 0.4 }}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 700, color: "#1f2937", cursor: "pointer" }}
                      onClick={onOpenDetails}
                    >
                      {sender?.displayName ?? "Unknown User"}
                    </Typography>
                    {showTimeByGap ? <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{formatTime(message.createdAt)}</Typography> : null}
                  </Stack>
                ) : null}

                {isOwn && showTimeByGap ? (
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", mb: 0.4 }}>
                    {formatTime(message.createdAt)}
                  </Typography>
                ) : null}

                <Box
                  sx={{ width: "fit-content", maxWidth: "100%", p: 1.25, borderRadius: 1, bgcolor: isOwn ? "#fffef7" : "#f1f5f9", border: "1px solid #e5e7eb" }}
                  onMouseEnter={() => handleHoverStart(message.id)}
                  onMouseLeave={() => handleHoverEnd(message.id)}
                >
                  {quoted ? (
                    <Box sx={{ mb: 1, p: 0.9, borderRadius: 1, bgcolor: "#fffbeb", borderLeft: "3px solid #f59e0b" }}>
                      <Typography sx={{ fontSize: 11, color: "#92400e", fontWeight: 700, mb: 0.2 }}>
                        {usersById[quoted.senderId]?.displayName ?? "Unknown"}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#78350f" }} noWrap>
                        {quoted.content}
                      </Typography>
                    </Box>
                  ) : null}

                  <Box
                    component="div"
                    sx={{
                      fontSize: 14,
                      color: "#374151",
                      lineHeight: 1.65,
                      wordBreak: "break-word",
                    }}
                  >
                    {renderMessageContent(message)}
                  </Box>
                </Box>

                {message.attachments?.length ? (
                  <Stack spacing={1} sx={{ mt: 1.5, alignItems: isOwn ? "flex-end" : "flex-start" }}>
                    {message.attachments.map((attachment) => (
                      <Stack key={attachment.id} direction="row" spacing={1.5} sx={{ maxWidth: 420, p: 1.5, bgcolor: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 1, alignItems: "center" }}>
                        <Box sx={{ width: 40, height: 40, bgcolor: "#fff", border: "1px solid #f3f4f6", borderRadius: 1, display: "grid", placeItems: "center", color: "#3b82f6" }}>
                          <DescriptionOutlined sx={{ fontSize: 16 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700 }} noWrap>{attachment.name}</Typography>
                          <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>{(attachment.size / 1024).toFixed(0)} KB</Typography>
                        </Box>
                        <MoreVertRounded sx={{ fontSize: 14, color: "#d1d5db" }} />
                      </Stack>
                    ))}
                  </Stack>
                ) : null}

                {message.reactions?.length ? (
                  <Stack direction={isOwn ? "row-reverse" : "row"} spacing={1} sx={{ mt: 1.2 }}>
                    {message.reactions.map((reaction) => (
                      <Box
                        key={`${message.id}-${reaction.emoji}`}
                        onMouseEnter={(event: MouseEvent<HTMLElement>) => onOpenReactionHover(event, reaction.emoji, reaction.userIds)}
                        onMouseLeave={onCloseReactionHover}
                        onClick={() => onAddReaction(message.id, reaction.emoji)}
                        sx={{ px: 1, py: 0.45, borderRadius: 1, fontSize: 11, fontWeight: 700, bgcolor: "#f9fafb", border: "1px solid #f3f4f6", color: "#6b7280", cursor: "pointer" }}
                      >
                        {reaction.emoji} {reaction.count}
                      </Box>
                    ))}
                  </Stack>
                ) : null}

                <ConnectMessageHoverActions
                  open={showActions}
                  align={isOwn ? "right" : "left"}
                  placement={index < 2 ? "below" : "above"}
                  onQuickReaction={(emoji) => onAddReaction(message.id, emoji)}
                  onOpenEmoji={(event) => onOpenMessageEmoji(event, message.id)}
                  onQuote={() => onQuoteMessage(message)}
                  onOpenMenu={(event) => onOpenMessageMenu(event, message.id)}
                  onHoverStart={() => handleHoverStart(message.id)}
                  onHoverEnd={() => handleHoverEnd(message.id)}
                />
              </Box>
            </Stack>
          );
        })}
        <Box ref={messagesBottomRef} />
      </Box>

      {children}
    </Box>
  );
}
