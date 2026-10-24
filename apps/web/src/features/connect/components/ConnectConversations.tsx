"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConversationHistory } from "@/features/connect/hooks/use-conversation-history";
import { ConversationTypingIndicator, MessageDeliveryStatus } from "@/features/connect/components/MessageStatus";
import type { MouseEvent, ReactNode } from "react";
import type {
  CallType,
  ConnectConversationMessage,
  ConversationUser,
  ConversationAttachment,
} from "@/types/connect.types";
import { ConnectMessageHoverActions } from "./ConnectMessageHoverActions";
import ConnectMessageInput from "./ConnectMessageInput";
import { RenderMessageContent, getMessagePriority, isSingleEmojiMessage } from "./RenderMessageContent";
import { ConversationHeader } from "./ConversationHeader";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConnectCascadingMenuItem } from "@/types/menu.types";
import { SystemMessage } from "./SystemMessage";
import { CircleAlert, Download, ExternalLink, Link2, Pin, Share2, X } from "lucide-react";
import { AttachmentsMessage } from "./AttachmentsMessage";

type ConnectConversationProps = {
  conversation: {
    id: string;
    name: string;
    type: "channel" | "direct" | "group";
    avatar?: string;
    isFavorite?: boolean;
    participants: string[];
  };
  teamLabel: string;
  currentUserId: string;
  usersById: Record<string, ConversationUser>;
  messages: ConnectConversationMessage[];
  typingUserIds?: string[];
  messagesLoading?: boolean;
  historyError?: string;
  firstUnreadId?: string | null;
  hasOlderMessages?: boolean;
  hasNewerMessages?: boolean;
  loadingMoreMessages?: boolean;
  onLoadMoreMessages?: (direction: "older" | "newer") => void;
  onReadMessage?: (messageId: string) => void;
  onRetryMessages?: () => void;
  activeMessageMenuId?: string | null;
  activeMessageEmojiId?: string | null;
  getQuotedMessageById: (id: string) => ConnectConversationMessage | undefined;
  onOpenDetails: () => void;
  onStartCall: (type: CallType) => void;
  isChannelAdmin?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onDeleteChannel?: () => void;
  onOpenInNewTab?: () => void;
  onClearPinnedMessages: () => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onOpenMessageEmoji: (event: MouseEvent<HTMLElement>, messageId: string) => void;
  onOpenMessageMenu: (event: MouseEvent<HTMLElement>, messageId: string) => void;
  onQuoteMessage: (message: ConnectConversationMessage) => void;
  onOpenReactionHover: (event: MouseEvent<HTMLElement>, emoji: string, userIds: string[]) => void;
  onCloseReactionHover: () => void;
  onOpenUserHover: (event: MouseEvent<HTMLElement>, userId: string) => void;
  onCloseUserHover: () => void;
  editingMessageId?: string | null;
  editingMessageValue?: string;
  onStartEditMessage: (message: ConnectConversationMessage) => void;
  onChangeEditMessage: (value: string) => void;
  onSaveEditMessage: (payload: { content: string; mentionUserIds: string[] }) => void;
  onCancelEditMessage: () => void;
  onSendGreeting: () => Promise<void>;
  disableHoverActions?: boolean;
  children?: ReactNode;
};

function getFileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
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
  typingUserIds = [],
  messagesLoading = false,
  historyError = "",
  firstUnreadId = null,
  hasOlderMessages = false,
  hasNewerMessages = false,
  loadingMoreMessages = false,
  onLoadMoreMessages,
  onReadMessage,
  onRetryMessages,
  activeMessageMenuId,
  activeMessageEmojiId,
  getQuotedMessageById,
  onOpenDetails,
  onStartCall,
  isChannelAdmin,
  isMuted,
  onToggleMute,
  onDeleteChannel,
  onOpenInNewTab,
  onClearPinnedMessages,
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
  onSendGreeting,
  disableHoverActions = false,
  children,
}: ConnectConversationProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [attachmentMenu, setAttachmentMenu] = useState<{
    anchorEl: HTMLElement;
    attachment: ConversationAttachment;
  } | null>(null);
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
          icon: <ExternalLink size={16} />,
          onClick: handleOpenInBrowser,
        },
        { id: "download", label: "Download", icon: <Download size={16} />, onClick: handleDownload },
        { id: "share", label: "Share", icon: <Share2 size={16} />, onClick: handleShare },
        { id: "copy-link", label: "Copy link", icon: <Link2 size={16} />, onClick: handleCopyLink },
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

  useEffect(
    () => () => {
      clearHoverActionCloseTimer();
    },
    [],
  );

  useEffect(() => {
    if (disableHoverActions) {
      clearHoverActionCloseTimer();
      const timer = window.setTimeout(() => setHoveredMessageId(null), 0);
      return () => window.clearTimeout(timer);
    }
  }, [disableHoverActions]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages],
  );
  const pinnedMessages = useMemo(() => sortedMessages.filter((message) => message.isPinned), [sortedMessages]);
  const connectUsers = Object.values(usersById);
  const greetingRecipient =
    conversation.type === "direct"
      ? (conversation.participants.map((userId) => usersById[userId]).find((user) => user?.id !== currentUserId)
          ?.displayName ?? conversation.name)
      : conversation.name;
  const lastOutgoingMessage = sortedMessages.findLast(
    (message) => message.senderId === currentUserId && message.contentType !== "system",
  );
  const { messageListRef, positioned, loadMore, onScroll } = useConversationHistory({
    conversationId: conversation.id,
    currentUserId,
    messages: sortedMessages,
    loading: messagesLoading,
    error: historyError,
    firstUnreadId,
    hasOlderMessages,
    hasNewerMessages,
    loadingMore: loadingMoreMessages,
    onLoadMore: onLoadMoreMessages,
    onReadMessage,
  });

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <ConversationHeader
        conversation={conversation}
        teamLabel={teamLabel}
        usersById={usersById}
        onOpenDetails={onOpenDetails}
        onStartCall={onStartCall}
        isChannelAdmin={isChannelAdmin}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onDeleteChannel={onDeleteChannel}
        onOpenInNewTab={onOpenInNewTab}
      />
      {pinnedMessages.length > 0 ? (
        <section className="border-b border-brand/15 bg-brand/5 py-2 pl-[2.3rem] pr-[1.6rem]" aria-label="Pinned messages">
          <div className="flex w-full items-start gap-2">
            <Pin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            <div className="flex max-h-[180px] min-w-0 flex-1 flex-col gap-1 overflow-y-auto">
              {pinnedMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => document.querySelector(`[data-message-id="${message.id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" })}
                  className="truncate text-left text-sm text-text-primary hover:text-brand"
                  title={message.content}
                >
                  <span className="font-semibold text-brand">{usersById[message.senderId]?.displayName ?? "Unknown"}: </span>
                  {message.content}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClearPinnedMessages}
              className="grid size-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-brand/10 hover:text-brand"
              aria-label="Unpin all messages"
              title="Unpin all messages"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : null}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {messagesLoading || (!positioned && !historyError) ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface text-brand">
            <span
              aria-label="Loading messages"
              className="size-8 animate-spin rounded-full border-4 border-brand border-t-transparent"
              role="status"
            />
          </div>
        ) : null}
        {historyError ? (
          <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-error">
            <p>{historyError}</p>
            <button
              type="button"
              onClick={onRetryMessages}
              className="rounded border border-border px-3 py-2 text-sm text-text-primary"
            >
              Retry
            </button>
          </div>
        ) : null}
        <div
          ref={messageListRef}
          className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 ${messagesLoading || !positioned || historyError ? "invisible" : ""}`}
          onScroll={onScroll}
        >
          {!messagesLoading && !historyError && sortedMessages.length === 0 ? (
            <div className="m-auto flex max-w-sm flex-col items-center px-6 text-center">
              <img
                src="/media/empty_conversation.png"
                alt="People having a conversation"
                className="h-70 w-90 rounded-md object-cover"
              />
              <p className="text-sm text-text-secondary">
                You have not yet started a conversation with {greetingRecipient}.
              </p>
              <button
                type="button"
                onClick={() => void onSendGreeting()}
                className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
              >
                Say Hi
              </button>
            </div>
          ) : null}
          {!messagesLoading &&
            sortedMessages.map((message, index) => {
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
              const priority = getMessagePriority(message.content);

              if (message.contentType === "system") {
                return <SystemMessage key={message.id} message={message} />;
              }

              return (
                <div
                  key={message.id}
                  data-message-id={message.id}
                  className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isOwn && !isContinuation ? (
                    <button
                      type="button"
                      onMouseEnter={(event: MouseEvent<HTMLElement>) => onOpenUserHover(event, message.senderId)}
                      onMouseLeave={onCloseUserHover}
                      className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-200"
                      aria-label={`View ${sender?.displayName ?? "user"} details`}
                    >
                      {sender?.avatar ? (
                        <img src={sender.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-xs font-bold text-slate-600">
                          {(sender?.displayName ?? "U").slice(0, 1)}
                        </span>
                      )}
                    </button>
                  ) : (
                    <div className="w-[34px] shrink-0" />
                  )}

                  <div className={`relative flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && !isContinuation ? (
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <button type="button" onClick={onOpenDetails} className="text-[13px] font-bold text-slate-900">
                          {sender?.displayName ?? "Unknown User"}
                        </button>
                        <time dateTime={message.createdAt} className="text-xs font-medium text-text-secondary">
                          {formatTime(message.createdAt)}
                        </time>
                      </div>
                    ) : null}

                    {isOwn && !isContinuation ? (
                      <time dateTime={message.createdAt} className="mb-0.5 text-xs font-medium text-text-secondary">
                        {formatTime(message.createdAt)}
                      </time>
                    ) : null}

                    {message.isPinned ? (
                      <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-brand">
                        <Pin className="size-3" aria-hidden="true" />
                        Pinned
                      </span>
                    ) : null}

                    <div className="flex max-w-full items-start gap-1.5">
                      {isOwn && priority ? <PriorityBadge priority={priority} /> : null}

                      {isEditingMessage ? (
                        <div className="min-w-[320px] max-w-[560px] sm:min-w-[420px]">
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
                        </div>
                      ) : (
                        <div
                          className={`w-fit max-w-full ${singleEmojiOnly ? "" : `rounded-md p-1.5 ${isOwn ? "bg-emerald-50" : "bg-slate-50"}`}`}
                          onMouseEnter={() => handleHoverStart(message.id)}
                          onMouseLeave={() => handleHoverEnd(message.id)}
                        >
                          {quoted ? (
                            <div className="mb-1 rounded-md border-l-[3px] border-emerald-600 bg-white px-3 py-3">
                              <p className="mb-0.5 text-xs font-bold text-emerald-700">
                                {usersById[quoted.senderId]?.displayName ?? "Unknown"}
                              </p>
                              <p className="truncate text-xs text-slate-500">{quoted.content}</p>
                            </div>
                          ) : null}

                          <div className="break-words p-1.5 text-sm leading-[1.65] text-slate-600">
                            <RenderMessageContent
                              message={message}
                              connectUsers={connectUsers}
                              openMentionHover={onOpenUserHover}
                            />
                          </div>

                          {message.attachments?.length ? (
                            <AttachmentsMessage message={message} openAttachmentMenu={openAttachmentMenu} />
                          ) : null}
                        </div>
                      )}

                      {!isOwn && priority ? <PriorityBadge priority={priority} /> : null}
                      {conversation.type === "direct" && message.id === lastOutgoingMessage?.id ? (
                        <MessageDeliveryStatus status={message.status} />
                      ) : null}
                    </div>

                    {message.reactions?.length ? (
                      <div className={`mt-1 flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                        {message.reactions.map((reaction) => (
                          <button
                            type="button"
                            key={`${message.id}-${reaction.emoji}`}
                            onMouseEnter={(event: MouseEvent<HTMLElement>) =>
                              onOpenReactionHover(event, reaction.emoji, reaction.userIds)
                            }
                            onMouseLeave={onCloseReactionHover}
                            onClick={() => onAddReaction(message.id, reaction.emoji)}
                            className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-bold text-slate-600"
                          >
                            {reaction.emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
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
                  </div>
                </div>
              );
            })}
          {loadingMoreMessages ? (
            <div className="flex justify-center py-2 text-brand">
              <span
                aria-label="Loading more messages"
                className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent"
                role="status"
              />
            </div>
          ) : hasNewerMessages ? (
            <button
              type="button"
              onClick={() => loadMore("newer")}
              className="self-center text-xs font-semibold text-brand"
            >
              Load newer messages
            </button>
          ) : null}
        </div>
      </div>

      <ConnectCascadingMenu
        anchorEl={attachmentMenu?.anchorEl ?? null}
        open={Boolean(attachmentMenu)}
        onClose={closeAttachmentMenu}
        items={attachmentMenuItems}
        minWidth={200}
      />

      <ConversationTypingIndicator userIds={typingUserIds} currentUserId={currentUserId} usersById={usersById} />
      {children}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "IMPORTANT" | "URGENT" }) {
  const urgent = priority === "URGENT";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 py-1 text-sm font-extrabold ${urgent ? "text-red-600" : "text-amber-700"}`}
    >
      <CircleAlert size={18} aria-hidden="true" />
      {priority.slice(0, 1) + priority.slice(1).toLowerCase()}
    </span>
  );
}
