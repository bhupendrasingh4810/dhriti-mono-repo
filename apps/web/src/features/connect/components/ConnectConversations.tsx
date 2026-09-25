"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import type { ConversationUser, ConnectConversationMessage, ConversationAttachment } from "@/types/connect.types";
import {
  DescriptionOutlined,
  DownloadRounded,
  LinkRounded,
  MoreVertRounded,
  OpenInNewRounded,
  PlayArrowRounded,
  ShareRounded,
  PriorityHighRounded,
} from "@mui/icons-material";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import { ConnectMessageHoverActions } from "./ConnectMessageHoverActions";
import { ConnectMessageInput } from "./ConnectMessageInput";
import { RenderMessageContent, getMessagePriority, isSingleEmojiMessage } from "./RenderMessageContent";
import { connectUsers } from "@/mocks/connect";
import { ConversationHeader } from "./ConversationHeader";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConnectCascadingMenuItem } from "@/types/menu.types";
import { SystemMessage } from "./SystemMessage";
import { AttachmentsMessage } from "./AttachmentsMessage";

function getFileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
}

interface ConnectConversationProps {
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
  messages: ConnectConversationMessage[];
  activeMessageMenuId?: string | null;
  activeMessageEmojiId?: string | null;
  getQuotedMessageById: (id: string) => ConnectConversationMessage | undefined;
  onOpenDetails: () => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onOpenMessageEmoji: (event: React.MouseEvent<HTMLElement>, messageId: string) => void;
  onOpenMessageMenu: (event: React.MouseEvent<HTMLElement>, messageId: string) => void;
  onQuoteMessage: (message: ConnectConversationMessage) => void;
  onOpenReactionHover: (event: React.MouseEvent<HTMLElement>, emoji: string, userIds: string[]) => void;
  onCloseReactionHover: () => void;
  onOpenUserHover: (event: React.MouseEvent<HTMLElement>, userId: string) => void;
  onCloseUserHover: () => void;
  editingMessageId?: string | null;
  editingMessageValue?: string;
  onStartEditMessage: (message: ConnectConversationMessage) => void;
  onChangeEditMessage: (value: string) => void;
  onSaveEditMessage: (payload: { content: string; mentionUserIds: string[] }) => void;
  onCancelEditMessage: () => void;
  disableHoverActions?: boolean;
  children?: ReactNode;
}

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConnectConversations({
  conversation,
  teamLabel,
  currentUserId,
  usersById,
  messages,
  activeMessageMenuId,
  activeMessageEmojiId,
  getQuotedMessageById,
  onOpenDetails,
  onAddReaction,
  onOpenMessageEmoji,
  onOpenMessageMenu,
  onQuoteMessage,
  onOpenReactionHover,
  onCloseReactionHover,
  onOpenUserHover,
  onCloseUserHover,
  editingMessageId,
  editingMessageValue = "",
  onStartEditMessage,
  onChangeEditMessage,
  onSaveEditMessage,
  onCancelEditMessage,
  disableHoverActions = false,
  children,
}: ConnectConversationProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [attachmentMenu, setAttachmentMenu] = useState<{
    anchorEl: HTMLElement;
    attachment: ConversationAttachment;
  } | null>(null);
  const messagesBottomRef = useRef<HTMLDivElement | null>(null);
  const hoverActionCloseTimerRef = useRef<number | null>(null);

  function openAttachmentMenu(event: MouseEvent<HTMLElement>, attachment: ConversationAttachment) {
    event.stopPropagation();
    setAttachmentMenu({ anchorEl: event.currentTarget, attachment });
  }

  function closeAttachmentMenu() {
    setAttachmentMenu(null);
  }

  function handleOpenInBrowser() {
    if (attachmentMenu) {
      window.open(attachmentMenu.attachment.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleDownload() {
    if (attachmentMenu) {
      const link = document.createElement("a");
      link.href = attachmentMenu.attachment.url;
      link.download = attachmentMenu.attachment.name;
      link.click();
    }
  }

  async function handleShare() {
    if (attachmentMenu) {
      const { attachment } = attachmentMenu;
      if (navigator.share) {
        await navigator.share({ title: attachment.name, url: attachment.url }).catch(() => undefined);
      } else {
        await navigator.clipboard.writeText(attachment.url).catch(() => undefined);
      }
    }
  }

  async function handleCopyLink() {
    if (attachmentMenu) {
      await navigator.clipboard.writeText(attachmentMenu.attachment.url).catch(() => undefined);
    }
  }

  const attachmentMenuItems: ConnectCascadingMenuItem[] = attachmentMenu
    ? [
        {
          id: "open-in-browser",
          label: "Open In Browser",
          icon: <OpenInNewRounded fontSize="small" />,
          onClick: handleOpenInBrowser,
        },
        { id: "download", label: "Download", icon: <DownloadRounded fontSize="small" />, onClick: handleDownload },
        { id: "share", label: "Share", icon: <ShareRounded fontSize="small" />, onClick: handleShare },
        { id: "copy-link", label: "Copy link", icon: <LinkRounded fontSize="small" />, onClick: handleCopyLink },
      ]
    : [];

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
    [],
  );

  useEffect(() => {
    if (disableHoverActions) {
      clearHoverActionCloseTimer();
      setHoveredMessageId(null);
    }
  }, [disableHoverActions]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <ConversationHeader conversation={conversation} teamLabel={teamLabel} onOpenDetails={onOpenDetails} />
      <Box sx={{ flex: 1, overflowY: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        {sortedMessages.map((message, index) => {
          const sender = usersById[message.senderId];
          const isOwn = message.senderId === currentUserId;
          const showActions =
            !disableHoverActions &&
            (hoveredMessageId === message.id ||
              activeMessageMenuId === message.id ||
              activeMessageEmojiId === message.id);
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
          const singleEmojiOnly = isSingleEmojiMessage(message.content);
          const isEditingMessage = editingMessageId === message.id;

          if (message.contentType === "system") {
            return <SystemMessage key={message.id} message={message} />;
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
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: (theme) => theme.tokens.radius.md,
                    flexShrink: 0,
                    cursor: "pointer",
                  }}
                />
              ) : (
                <Box sx={{ width: 34, flexShrink: 0 }} />
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isOwn ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  position: "relative",
                }}
              >
                {!isOwn && !isContinuation ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mb: 0.4 }}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 700, color: "text.primary", cursor: "pointer" }}
                      onClick={onOpenDetails}
                    >
                      {sender?.displayName ?? "Unknown User"}
                    </Typography>
                    {showTimeByGap ? (
                      <Typography variant="overline" color="text.disabled">
                        {formatTime(message.createdAt)}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : null}

                {isOwn && showTimeByGap ? (
                  <Typography variant="overline" color="text.disabled" sx={{ mb: 0.4 }}>
                    {formatTime(message.createdAt)}
                  </Typography>
                ) : null}

                <Stack direction="row" spacing={0.6} sx={{ alignItems: "flex-start", maxWidth: "100%" }}>
                  {isOwn
                    ? (() => {
                        const priority = getMessagePriority(message.content);
                        return priority ? (
                          <Box
                            sx={{
                              width: "fit-content",
                              flexShrink: 0,
                              py: 0.25,
                              fontSize: 14,
                              fontWeight: 800,
                              color: priority === "IMPORTANT" ? "warning.dark" : "error.main",
                            }}
                          >
                            <PriorityHighRounded sx={{ fontSize: 20, mr: 0.4, verticalAlign: "middle" }} />
                            {priority.at(0)?.toUpperCase() + priority.slice(1).toLowerCase()}
                          </Box>
                        ) : null;
                      })()
                    : null}

                  {isEditingMessage ? (
                    <Box sx={{ minWidth: { xs: 320, sm: 420 }, width: "min(560px, 100%)" }}>
                      <ConnectMessageInput
                        mode="edit"
                        conversationLabel={conversation.name}
                        value={editingMessageValue}
                        users={connectUsers.map((user) => ({
                          id: user.id,
                          displayName: user.displayName,
                          avatar: user.avatar,
                          subtitle: user.jobTitle,
                        }))}
                        currentUserId={currentUserId}
                        onChange={onChangeEditMessage}
                        onSend={onSaveEditMessage}
                        onCancelEdit={onCancelEditMessage}
                        onClearQuotedMessage={onCancelEditMessage}
                        onAttachFiles={() => undefined}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: "fit-content",
                        maxWidth: "100%",
                        p: singleEmojiOnly ? 0 : 1.25,
                        borderRadius: (theme) => theme.tokens.radius.sm,
                        bgcolor: singleEmojiOnly
                          ? "transparent"
                          : isOwn
                            ? "surfaces.surfaceSelected"
                            : "surfaces.surfaceHover",
                      }}
                      onMouseEnter={() => handleHoverStart(message.id)}
                      onMouseLeave={() => handleHoverEnd(message.id)}
                    >
                      {quoted ? (
                        <Box
                          sx={{
                            mb: 1,
                            py: 3,
                            px: 3,
                            borderRadius: (theme) => theme.tokens.radius.sm,
                            bgcolor: "background.paper",
                            borderLeft: 3,
                            borderColor: "primary.main",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700, mb: 0.2 }}>
                            {usersById[quoted.senderId]?.displayName ?? "Unknown"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {quoted.content}
                          </Typography>
                        </Box>
                      ) : null}

                      <Box
                        component="div"
                        sx={{
                          fontSize: 14,
                          color: "text.secondary",
                          lineHeight: 1.65,
                          wordBreak: "break-word",
                          p: 1.5,
                        }}
                      >
                        <RenderMessageContent
                          message={message}
                          connectUsers={connectUsers}
                          openMentionHover={onOpenUserHover}
                        />
                      </Box>

                      {message.attachments?.length ? (
                        <AttachmentsMessage message={message} openAttachmentMenu={openAttachmentMenu} />
                      ) : null}
                    </Box>
                  )}

                  {!isOwn
                    ? (() => {
                        const priority = getMessagePriority(message.content);
                        return priority ? (
                          <Box
                            sx={{
                              width: "fit-content",
                              flexShrink: 0,
                              py: 0.25,
                              fontSize: 14,
                              fontWeight: 800,
                              color: priority === "IMPORTANT" ? "warning.dark" : "error.main",
                            }}
                          >
                            <PriorityHighRounded sx={{ fontSize: 20, mr: 0.4, verticalAlign: "middle" }} />
                            {priority.at(0)?.toUpperCase() + priority.slice(1).toLowerCase()}
                          </Box>
                        ) : null;
                      })()
                    : null}
                </Stack>

                {message.reactions?.length ? (
                  <Stack direction={isOwn ? "row-reverse" : "row"} spacing={1} sx={{ mt: 1.2 }}>
                    {message.reactions.map((reaction) => (
                      <Box
                        key={`${message.id}-${reaction.emoji}`}
                        onMouseEnter={(event: MouseEvent<HTMLElement>) =>
                          onOpenReactionHover(event, reaction.emoji, reaction.userIds)
                        }
                        onMouseLeave={onCloseReactionHover}
                        onClick={() => onAddReaction(message.id, reaction.emoji)}
                        sx={{
                          px: 1,
                          py: 0.45,
                          borderRadius: (theme) => theme.tokens.radius.sm,
                          fontSize: 14,
                          fontWeight: 700,
                          bgcolor: "surfaces.surfaceHover",
                          border: 1,
                          borderColor: "borders.borderSubtle",
                          color: "text.secondary",
                          cursor: "pointer",
                        }}
                      >
                        {reaction.emoji} {reaction.count}
                      </Box>
                    ))}
                  </Stack>
                ) : null}

                <ConnectMessageHoverActions
                  open={showActions && !isEditingMessage}
                  align={isOwn ? "right" : "left"}
                  placement={index < 2 ? "below" : "above"}
                  isOwn={isOwn}
                  onQuickReaction={(emoji) => onAddReaction(message.id, emoji)}
                  onOpenEmoji={(event) => {
                    clearHoverActionCloseTimer();
                    setHoveredMessageId(message.id);
                    onOpenMessageEmoji(event, message.id);
                  }}
                  onEdit={() => onStartEditMessage(message)}
                  onQuote={() => onQuoteMessage(message)}
                  onOpenMenu={(event) => {
                    clearHoverActionCloseTimer();
                    setHoveredMessageId(message.id);
                    onOpenMessageMenu(event, message.id);
                  }}
                  onHoverStart={() => handleHoverStart(message.id)}
                  onHoverEnd={() => handleHoverEnd(message.id)}
                />
              </Box>
            </Stack>
          );
        })}
        <Box ref={messagesBottomRef} />
      </Box>

      <ConnectCascadingMenu
        anchorEl={attachmentMenu?.anchorEl ?? null}
        open={Boolean(attachmentMenu)}
        onClose={closeAttachmentMenu}
        items={attachmentMenuItems}
        minWidth={200}
      />

      {children}
    </Box>
  );
}
