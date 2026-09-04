"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Emoji, { type EmojiClickData } from "emoji-picker-react";
import {
  FlagOutlined,
  FormatListBulletedRounded,
  ForwardToInboxRounded,
  Inventory2Rounded,
  LinkRounded,
  MailOutlineRounded,
  MarkEmailUnreadRounded,
  MoreVertRounded,
  OpenInNewRounded,
  PaletteRounded,
  PeopleRounded,
  PushPinRounded,
  SaveAltRounded,
  TranslateRounded,
  VisibilityOffRounded,
  AlternateEmailRounded,
  DeleteOutlineRounded,
  EditRounded,
} from "@mui/icons-material";
import { Box, Button, Popover, Stack, Typography } from "@mui/material";
import {
  connectChannels,
  connectMentionFeed,
  connectConversations,
  connectFiles,
  connectMeetings,
  connectMessagesByConversation,
  connectPinnedItems,
  connectReportsToByUserId,
  connectSidebarState,
  connectTeams,
  connectTeamsById,
  connectUsers,
  connectUsersById,
  type ConnectConversation,
  type ConnectMessage,
} from "@/mocks/connect";
import { ConnectSidebar } from "@/features/connect";
import { getMenuItems } from "@/utils/connect-menu-item.util";
import { CreateChannelDialog } from "@/features/connect/dialogs/create-channel.dialog";
import { CreateTeamDialog } from "@/features/connect/dialogs/create-team.dialog";
import { CreateSectionDialog } from "@/features/connect/dialogs/create-section.dialog";
import { ConnectConversations } from "@/features/connect/components/ConnectConversations";
import { ConnectCascadingMenuItem } from "@/types/menu.types";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { ConnectConversationMessage, ConnectPendingAttachment, ConnectSidebarMenuContext, ConnectSidebarTeamGroup } from "@/types/connect.types";
import { ConnectMessageInput } from "@/features/connect/components/ConnectMessageInput";
import { ConnectMentionsFilter, ConnectMentionsView } from "@/features/connect/components/ConnectMentionsView";
import { ConnectChannelDetailsPanel } from "@/features/connect/components/ConnectChannelDetailsPanel";
import { ConnectReactionUsersList } from "@/features/connect/components/ConnectReactionUsersList";
import { ConnectUserDetailsCard } from "@/features/connect/components/ConnectUserDetailsCard";

const quickViewsConfig = [
  { icon: AlternateEmailRounded, label: "Mentions" },
  { icon: FormatListBulletedRounded, label: "Threads" },
  { icon: MailOutlineRounded, label: "Drafts" },
];

type MentionHoverState = {
  anchorEl: HTMLElement;
  userId: string;
};

type ReactionHoverState = {
  anchorEl: HTMLElement;
  emoji: string;
  userIds: string[];
};

type DeletedMessageState = {
  conversationId: string;
  message: ConnectMessage;
  index: number;
};

function getConversationLabel(conversation: ConnectConversation) {
  if (conversation.type === "channel") {
    return `# ${conversation.name.toLowerCase()}`;
  }

  return conversation.name;
}

function getConversationTypeLabel(conversation: ConnectConversation) {
  if (conversation.type === "channel") return "Channel";
  if (conversation.type === "group") return "Group";
  return "Direct";
}

export default function ConnectPage() {
  const initialConversationId = connectSidebarState.recentChats[0] ?? connectConversations[0]?.id ?? "";

  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId);
  const [showDetails, setShowDetails] = useState(false);
  const [composerMessage, setComposerMessage] = useState("");
  const [mentionComposerMessage, setMentionComposerMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ConnectPendingAttachment[]>([]);
  const [mentionPendingAttachments, setMentionPendingAttachments] = useState<ConnectPendingAttachment[]>([]);

  const [activeQuickViewId, setActiveQuickViewId] = useState<string | null>(null);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({ team_001: true });
  const [sectionViewMode, setSectionViewMode] = useState({ favorites: "all", chats: "all", mentions: "always", threads: "always" });
  const [quotedMessage, setQuotedMessage] = useState<ConnectMessage | null>(null);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [mentionsFilter, setMentionsFilter] = useState<ConnectMentionsFilter>("unread");
  const [selectedMentionId, setSelectedMentionId] = useState<string | null>(null);
  const [mentionHover, setMentionHover] = useState<MentionHoverState | null>(null);
  const [reactionHover, setReactionHover] = useState<ReactionHoverState | null>(null);
  const [deletedMessage, setDeletedMessage] = useState<DeletedMessageState | null>(null);
  const reactionHoverCloseTimerRef = useRef<number | null>(null);

  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ConnectMessage[]>>(() =>
    Object.fromEntries(
      Object.entries(connectMessagesByConversation).map(([conversationId, messages]) => [conversationId, [...messages]])
    )
  );

  const [conversationsById, setConversationsById] = useState<Record<string, ConnectConversation>>(() =>
    connectConversations.reduce<Record<string, ConnectConversation>>((acc, conversation) => {
      acc[conversation.id] = { ...conversation };
      return acc;
    }, {})
  );

  const [sidebarMenuAnchor, setSidebarMenuAnchor] = useState<HTMLElement | null>(null);
  const [sidebarMenuContext, setSidebarMenuContext] = useState<ConnectSidebarMenuContext | null>(null);
  const [mentionSourceMenuAnchor, setMentionSourceMenuAnchor] = useState<HTMLElement | null>(null);
  const [mentionCallMenuAnchor, setMentionCallMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeMentionMenuId, setActiveMentionMenuId] = useState<string | null>(null);

  const [messageMenuAnchor, setMessageMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const [messageEmojiAnchor, setMessageEmojiAnchor] = useState<HTMLElement | null>(null);
  const [activeMessageForEmoji, setActiveMessageForEmoji] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageDraft, setEditingMessageDraft] = useState("");
  const [discardEditDialogOpen, setDiscardEditDialogOpen] = useState(false);


  useEffect(() => {
    return () => {
      if (reactionHoverCloseTimerRef.current) {
        window.clearTimeout(reactionHoverCloseTimerRef.current);
      }
    };
  }, []);

  const currentUser = connectUsersById[connectSidebarState.currentUser];
  const selectedConversation = conversationsById[selectedConversationId] ?? connectConversations[0];
  const selectedTeam = selectedConversation?.teamId ? connectTeamsById[selectedConversation.teamId] : null;

  const favoriteConversations = useMemo(
    () => {
      const items = [...connectSidebarState.favorites.channels, ...connectSidebarState.favorites.chats]
        .map((id) => conversationsById[id])
        .filter((conversation): conversation is ConnectConversation => Boolean(conversation));

      const withPersonal = currentUser
        ? [{
          id: `personal_${currentUser.id}`,
          type: "direct" as const,
          organizationId: selectedConversation.organizationId,
          name: `${currentUser.displayName} (You)`,
          avatar: currentUser.avatar,
          createdBy: currentUser.id,
          createdAt: currentUser.createdAt,
          participants: [currentUser.id],
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          isFavorite: true,
          muted: false,
          pinned: true,
          archived: false,
          description: "Personal messages visible only to you.",
        }, ...items]
        : items;

      return sectionViewMode.favorites === "unread" ? withPersonal.filter((conversation) => conversation.unreadCount > 0) : withPersonal;
    },
    [conversationsById, currentUser, sectionViewMode.favorites, selectedConversation.organizationId]
  );

  const chatConversations = useMemo(
    () => Object.values(conversationsById).filter((conversation) => conversation.type === "direct" || conversation.type === "group"),
    [conversationsById]
  );

  const recentConversations = useMemo(
    () =>
      connectSidebarState.recentChats
        .map((id) => conversationsById[id])
        .filter((conversation): conversation is ConnectConversation => Boolean(conversation)),
    [conversationsById]
  );

  const unreadTotal = useMemo(() => Object.values(connectSidebarState.unread).reduce((sum, count) => sum + count, 0), []);
  const mentionTotal = useMemo(() => Object.values(connectSidebarState.mentions).reduce((sum, count) => sum + count, 0), []);
  const draftCount = useMemo(() => (composerMessage.trim() ? 1 : 0), [composerMessage]);

  const threadCount = useMemo(
    () => Object.values(messagesByConversation).flat().filter((message) => (message.replyCount ?? 0) > 0).length,
    [messagesByConversation]
  );

  const selectedMessages = useMemo(() => {
    const current = messagesByConversation[selectedConversation?.id] ?? [];
    return [...current].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messagesByConversation, selectedConversation]);

  const conversationFiles = useMemo(
    () => connectFiles.filter((file) => file.conversationId === selectedConversation?.id),
    [selectedConversation]
  );

  const pinnedCount = useMemo(
    () => connectPinnedItems.filter((item) => item.conversationId === selectedConversation?.id).length,
    [selectedConversation]
  );

  const relatedMeetings = useMemo(
    () => (selectedConversation?.type === "channel" ? connectMeetings.slice(0, 1) : []),
    [selectedConversation]
  );

  const sidebarTeams = useMemo<ConnectSidebarTeamGroup[]>(
    () =>
      connectTeams.map((team) => ({
        id: team.id,
        label: team.name,
        icon: team.name === "Design" ? PaletteRounded : Inventory2Rounded,
        isExpanded: expandedTeamIds[team.id] ?? false,
        channels: connectChannels
          .filter((channel) => channel.teamId === team.id && !channel.isArchived)
          .map((channel) => ({
            id: channel.id,
            name: channel.name,
            slug: channel.slug,
            isPrivate: channel.visibility === "private",
          })),
      })),
    [expandedTeamIds]
  );

  const sidebarQuickViews = useMemo(
    () =>
      quickViewsConfig.map((item) => ({
        id: item.label.toLowerCase() as "mentions" | "threads" | "drafts",
        icon: item.icon,
        label: item.label,
        value: item.label === "Mentions" ? mentionTotal : item.label === "Threads" ? threadCount : draftCount,
      })),
    [draftCount, mentionTotal, threadCount]
  );

  const visibleChatConversations = useMemo(() => {
    const merged = recentConversations
      .concat(chatConversations)
      .filter((conversation, index, all) => all.findIndex((item) => item.id === conversation.id) === index);

    return sectionViewMode.chats === "unread" ? merged.filter((conversation) => (connectSidebarState.unread[conversation.id] ?? conversation.unreadCount) > 0) : merged;
  }, [chatConversations, recentConversations, sectionViewMode.chats]);

  const mentionItems = useMemo(() => {
    const base = connectMentionFeed
      .filter((item) => item.mentionedUserId === currentUser.id)
      .map((item) => {
        const sender = connectUsersById[item.senderId];
        return {
          ...item,
          senderName: sender?.displayName ?? "Unknown User",
          senderAvatar: sender?.avatar ?? "",
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (mentionsFilter === "unread") {
      return base.filter((item) => item.unread);
    }

    if (mentionsFilter === "channels") {
      return base.filter((item) => item.sourceType === "channel");
    }

    return base.filter((item) => item.sourceType === "person");
  }, [currentUser.id, mentionsFilter]);

  const selectedMention = useMemo(
    () => mentionItems.find((item) => item.id === selectedMentionId) ?? null,
    [mentionItems, selectedMentionId]
  );

  const mentionDetail = useMemo(() => {
    if (!selectedMention) {
      return null;
    }

    const conversation = conversationsById[selectedMention.conversationId];
    const messages = (messagesByConversation[selectedMention.conversationId] ?? [])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-12)
      .map((message) => ({
        id: message.id,
        senderId: message.senderId,
        createdAt: message.createdAt,
        content: message.content,
      }));

    return {
      mentionId: selectedMention.id,
      conversationId: selectedMention.conversationId,
      highlightedMessageId: selectedMention.messageId,
      sourceType: selectedMention.sourceType,
      title: selectedMention.sourceName,
      avatar: selectedMention.sourceType === "person" ? selectedMention.sourceAvatar : conversation?.avatar,
      subtitle: conversation?.description,
      lastMessage: selectedMention.excerpt,
      messages,
    };
  }, [conversationsById, messagesByConversation, selectedMention]);

  const mentionSourceMenuItems = useMemo<ConnectCascadingMenuItem[]>(() => {
    if (!activeMentionMenuId || !selectedMention || selectedMention.id !== activeMentionMenuId || selectedMention.sourceType !== "channel") {
      return [];
    }

    return [
      { id: "unfollow-thread", label: "Unfollow thread", icon: <VisibilityOffRounded fontSize="small" /> },
      { id: "mark-unread", label: "Mark as unread", icon: <MarkEmailUnreadRounded fontSize="small" /> },
      { id: "copy-link", label: "Copy link", icon: <LinkRounded fontSize="small" /> },
    ];
  }, [activeMentionMenuId, selectedMention]);

  const mentionCallMenuItems: ConnectCascadingMenuItem[] = [
    { id: "video-call", label: "Video Call", icon: <OpenInNewRounded fontSize="small" /> },
    { id: "audio-call", label: "Audio Call", icon: <PeopleRounded fontSize="small" /> },
  ];



  const sidebarMenuItems = useMemo<ConnectCascadingMenuItem[]>(
    () => getMenuItems(
      sidebarMenuContext,
      sectionViewMode,
      setSectionViewMode,
      setCreateSectionOpen,
      setCreateTeamOpen,
      setCreateChannelOpen,
      pushSystemMessage
    ),
    [sectionViewMode, sidebarMenuContext, setSectionViewMode, setCreateSectionOpen, setCreateTeamOpen, setCreateChannelOpen, pushSystemMessage]
  );

  const activeMenuMessage = activeMessageId ? selectedMessages.find((message) => message.id === activeMessageId) : undefined;
  const canEditActiveMessage = Boolean(activeMenuMessage && activeMenuMessage.senderId === currentUser.id);

  const messageMenuItems: ConnectCascadingMenuItem[] = [
    ...(canEditActiveMessage ? [{ id: "edit", label: "Edit Message", icon: <EditRounded fontSize="small" /> }] : []),
    { id: "forward", label: "Forward", icon: <ForwardToInboxRounded fontSize="small" /> },
    { id: "copy-link", label: "Copy Link", icon: <LinkRounded fontSize="small" /> },
    { id: "pin", label: "Pin", icon: <PushPinRounded fontSize="small" /> },
    { id: "save", label: "Save this Message", icon: <SaveAltRounded fontSize="small" /> },
    { id: "mark-unread", label: "Mark as unread", icon: <MarkEmailUnreadRounded fontSize="small" /> },
    { id: "translate", label: "Translations", icon: <TranslateRounded fontSize="small" /> },
    { id: "delete", label: "Delete Message", icon: <DeleteOutlineRounded fontSize="small" />, danger: true },
    { id: "report", label: "Report this Message", icon: <FlagOutlined fontSize="small" />, danger: true },
    { id: "more", label: "More actions", icon: <MoreVertRounded fontSize="small" /> },
  ];

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    setActiveQuickViewId(null);
    setShowDetails(false);
  }

  function handleSelectQuickView(quickViewId: "mentions" | "threads" | "drafts") {
    setActiveQuickViewId(quickViewId);
    setShowDetails(false);

    if (quickViewId === "mentions") {
      setSelectedMentionId((current) => current ?? mentionItems[0]?.id ?? null);
    }
  }

  function handleToggleTeam(teamId: string) {
    setExpandedTeamIds((previous) => ({ ...previous, [teamId]: !(previous[teamId] ?? false) }));
  }

  function openReactionHover(event: MouseEvent<HTMLElement>, emoji: string, userIds: string[]) {
    if (reactionHoverCloseTimerRef.current) {
      window.clearTimeout(reactionHoverCloseTimerRef.current);
      reactionHoverCloseTimerRef.current = null;
    }

    setReactionHover({ anchorEl: event.currentTarget, emoji, userIds });
  }

  function scheduleReactionHoverClose() {
    if (reactionHoverCloseTimerRef.current) {
      window.clearTimeout(reactionHoverCloseTimerRef.current);
    }

    reactionHoverCloseTimerRef.current = window.setTimeout(() => {
      setReactionHover(null);
      reactionHoverCloseTimerRef.current = null;
    }, 260);
  }

  function cancelReactionHoverClose() {
    if (reactionHoverCloseTimerRef.current) {
      window.clearTimeout(reactionHoverCloseTimerRef.current);
      reactionHoverCloseTimerRef.current = null;
    }
  }

  function openMentionHover(event: MouseEvent<HTMLElement>, userId: string) {
    setMentionHover({ anchorEl: event.currentTarget, userId });
  }

  function scheduleMentionHoverClose() {
    // Intentionally no-op: user card should stay open until outside click.
  }

  function cancelMentionHoverClose() {
    // Intentionally no-op: user card should stay open until outside click.
  }

  function addReactionToMessage(conversationId: string, messageId: string, emoji: string) {
    if (!currentUser) return;

    setMessagesByConversation((previous) => {
      const nextList = (previous[conversationId] ?? []).map((message) => {
        if (message.id !== messageId) return message;

        const reactions = message.reactions ? [...message.reactions] : [];
        const existing = reactions.find((reaction) => reaction.emoji === emoji);

        if (existing) {
          const hasUser = existing.userIds.includes(currentUser.id);
          return {
            ...message,
            reactions: reactions.map((reaction) =>
              reaction.emoji === emoji
                ? {
                  ...reaction,
                  count: reaction.count + 1,
                  userIds: hasUser ? reaction.userIds : [...reaction.userIds, currentUser.id],
                }
                : reaction
            ),
          };
        }

        return {
          ...message,
          reactions: [...reactions, { emoji, count: 1, userIds: [currentUser.id] }],
        };
      });

      return {
        ...previous,
        [conversationId]: nextList,
      };
    });
  }

  function pushSystemMessage(content: string) {
    if (!currentUser || !selectedConversation) return;

    const now = new Date().toISOString();
    const newMessage: ConnectMessage = {
      id: `msg_system_${Date.now()}`,
      conversationType: selectedConversation.type,
      conversationId: selectedConversation.id,
      senderId: currentUser.id,
      content,
      contentType: "system",
      createdAt: now,
      status: "sent",
    };

    setMessagesByConversation((previous) => ({
      ...previous,
      [selectedConversation.id]: [...(previous[selectedConversation.id] ?? []), newMessage],
    }));
  }

  function handleSendMessageToConversation(conversationId: string, payload: { content: string; mentionUserIds: string[] }, attachments?: ConnectPendingAttachment[]) {
    const conversation = conversationsById[conversationId];
    if (!conversation || !currentUser) return;
    if (!payload.content.trim() && !attachments?.length) return;
    const now = new Date().toISOString();

    const newMessage: ConnectMessage = {
      id: `msg_local_${Date.now()}`,
      conversationType: conversation.type,
      conversationId,
      senderId: currentUser.id,
      content: payload.content,
      contentType: attachments?.length ? "file" : "text",
      createdAt: now,
      status: "sent",
      quotedMessageId: quotedMessage?.id,
      mentions: payload.mentionUserIds,
      attachments,
    };

    setMessagesByConversation((previous) => ({
      ...previous,
      [conversationId]: [...(previous[conversationId] ?? []), newMessage],
    }));

    setConversationsById((previous) => ({
      ...previous,
      [conversationId]: {
        ...previous[conversationId],
        lastMessageAt: now,
      },
    }));

    return newMessage;
  }

  function handleSendMessage(payload: { content: string; mentionUserIds: string[] }) {
    if (!selectedConversation) return;

    handleSendMessageToConversation(selectedConversation.id, payload, pendingAttachments.length ? pendingAttachments : undefined);

    setComposerMessage("");
    setPendingAttachments([]);
    setQuotedMessage(null);
  }

  function openSidebarMenu(event: MouseEvent<HTMLElement>, context: ConnectSidebarMenuContext) {
    event.stopPropagation();
    setSidebarMenuAnchor(event.currentTarget);
    setSidebarMenuContext(context);
  }

  function closeSidebarMenus() {
    setSidebarMenuAnchor(null);
    setSidebarMenuContext(null);
  }

  function closeMentionMenus() {
    setMentionSourceMenuAnchor(null);
    setMentionCallMenuAnchor(null);
    setActiveMentionMenuId(null);
  }

  function openMessageMenu(event: MouseEvent<HTMLElement>, messageId: string) {
    event.stopPropagation();
    setMessageEmojiAnchor(null);
    setActiveMessageForEmoji(null);
    setMessageMenuAnchor(event.currentTarget);
    setActiveMessageId(messageId);
  }

  function openMessageEmojiMenu(event: MouseEvent<HTMLElement>, messageId: string) {
    event.stopPropagation();
    setMessageMenuAnchor(null);
    setActiveMessageId(null);
    setMessageEmojiAnchor(event.currentTarget);
    setActiveMessageForEmoji(messageId);
  }

  function startEditMessage(message: ConnectConversationMessage) {
    if (message.senderId !== currentUser.id) return;

    setMessageMenuAnchor(null);
    setActiveMessageId(null);
    setMessageEmojiAnchor(null);
    setActiveMessageForEmoji(null);
    setEditingMessageId(message.id);
    setEditingMessageDraft(message.content.replace(/^\[(IMPORTANT|URGENT)\]\s*/i, ""));
  }

  function requestCancelEditMessage() {
    setDiscardEditDialogOpen(true);
  }

  function keepEditingMessage() {
    setDiscardEditDialogOpen(false);
  }

  function discardEditMessage() {
    setDiscardEditDialogOpen(false);
    setEditingMessageId(null);
    setEditingMessageDraft("");
  }

  function saveEditMessage(payload: { content: string; mentionUserIds: string[] }) {
    if (!editingMessageId) return;
    const nextContent = payload.content.trim();
    if (!nextContent) return;

    setMessagesByConversation((previous) => ({
      ...previous,
      [selectedConversation.id]: (previous[selectedConversation.id] ?? []).map((message) =>
        message.id === editingMessageId
          ? {
            ...message,
            content: nextContent,
            mentions: payload.mentionUserIds,
          }
          : message
      ),
    }));
    setEditingMessageId(null);
    setEditingMessageDraft("");
  }

  function deleteMessage(messageId: string) {
    const conversationId = selectedConversation.id;
    const currentMessages = messagesByConversation[conversationId] ?? [];
    const index = currentMessages.findIndex((message) => message.id === messageId);
    if (index === -1) return;

    setDeletedMessage({ conversationId, message: currentMessages[index], index });
    setMessagesByConversation((previous) => ({
      ...previous,
      [conversationId]: (previous[conversationId] ?? []).filter((message) => message.id !== messageId),
    }));
  }

  function undoDeleteMessage() {
    if (!deletedMessage) return;

    setMessagesByConversation((previous) => {
      const currentMessages = [...(previous[deletedMessage.conversationId] ?? [])];
      const insertAt = Math.min(deletedMessage.index, currentMessages.length);
      currentMessages.splice(insertAt, 0, deletedMessage.message);

      return {
        ...previous,
        [deletedMessage.conversationId]: currentMessages,
      };
    });
    setDeletedMessage(null);
  }

  function createPendingAttachmentsFromFiles(fileList: FileList | null): ConnectPendingAttachment[] {
    if (!fileList) return [];

    return Array.from(fileList).map((file, index) => ({
      id: `upload_${Date.now()}_${index}`,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      url: URL.createObjectURL(file),
    }));
  }

  function handleAttachFiles(fileList: FileList | null) {
    const attachments = createPendingAttachmentsFromFiles(fileList);
    if (attachments.length === 0) return;

    setPendingAttachments((previous) => [...previous, ...attachments]);
  }

  function handleRemovePendingAttachment(attachmentId: string) {
    setPendingAttachments((previous) => previous.filter((attachment) => attachment.id !== attachmentId));
  }

  function handleAttachFilesForMention(fileList: FileList | null) {
    const attachments = createPendingAttachmentsFromFiles(fileList);
    if (attachments.length === 0) return;

    setMentionPendingAttachments((previous) => [...previous, ...attachments]);
  }

  function handleRemoveMentionPendingAttachment(attachmentId: string) {
    setMentionPendingAttachments((previous) => previous.filter((attachment) => attachment.id !== attachmentId));
  }




  if (!selectedConversation || !currentUser) return null;

  const quotedPreview = quotedMessage
    ? {
      senderName: connectUsersById[quotedMessage.senderId]?.displayName ?? "Unknown",
      content: quotedMessage.content,
    }
    : null;

  const mentionQuotedPreview = quotedMessage && selectedMention
    ? {
      senderName: connectUsersById[quotedMessage.senderId]?.displayName ?? "Unknown",
      content: quotedMessage.content,
    }
    : null;

  const isMentionsView = activeQuickViewId === "mentions";

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "background.default", color: "text.primary" }}>
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ConnectSidebar
          quickViews={sidebarQuickViews}
          favoriteConversations={favoriteConversations.map((conversation) => ({
            id: conversation.id,
            name: conversation.name,
            type: conversation.type,
            avatar: conversation.avatar,
            unreadCount: conversation.unreadCount,
            isSelfSpace: conversation.id.startsWith("personal_"),
          }))}
          chatConversations={visibleChatConversations.map((conversation) => ({
            id: conversation.id,
            name: conversation.name,
            type: conversation.type,
            avatar: conversation.avatar,
            unreadCount: connectSidebarState.unread[conversation.id] ?? conversation.unreadCount,
          }))}
          teams={sidebarTeams}
          selectedConversationId={selectedConversation.id}
          activeQuickViewId={activeQuickViewId}
          onToggleTeam={handleToggleTeam}
          onSelectConversation={handleSelectConversation}
          onSelectQuickView={handleSelectQuickView}
          onOpenSidebarMenu={openSidebarMenu}
        />

        {isMentionsView ? (
          <ConnectMentionsView
            items={mentionItems}
            usersById={Object.fromEntries(Object.values(connectUsersById).map((user) => [user.id, { id: user.id, displayName: user.displayName, avatar: user.avatar, jobTitle: user.jobTitle }]))}
            selectedMentionId={selectedMentionId}
            filter={mentionsFilter}
            detail={mentionDetail}
            onSelectMention={setSelectedMentionId}
            onFilterChange={setMentionsFilter}
            onOpenChannelMenu={(event, mentionId) => {
              setMentionSourceMenuAnchor(event.currentTarget);
              setActiveMentionMenuId(mentionId);
            }}
            onOpenCallOptions={(event, mentionId) => {
              setMentionCallMenuAnchor(event.currentTarget);
              setActiveMentionMenuId(mentionId);
            }}
            onOpenInNewWindow={() => {
              pushSystemMessage("Open in new window requested from mentions.");
            }}
            onGoToChannel={(conversationId) => {
              if (!conversationId) return;
              setSelectedConversationId(conversationId);
              setActiveQuickViewId(null);
              setShowDetails(false);
            }}
            composer={
              selectedMention ? (
                <ConnectMessageInput
                  conversationLabel={getConversationLabel(conversationsById[selectedMention.conversationId] ?? selectedConversation)}
                  value={mentionComposerMessage}
                  users={connectUsers.map((user) => ({
                    id: user.id,
                    displayName: user.displayName,
                    avatar: user.avatar,
                    subtitle: user.jobTitle,
                  }))}
                  currentUserId={currentUser.id}
                  quotedMessage={mentionQuotedPreview}
                  pendingAttachments={mentionPendingAttachments}
                  onChange={setMentionComposerMessage}
                  onSend={(payload) => {
                    handleSendMessageToConversation(selectedMention.conversationId, payload, mentionPendingAttachments.length ? mentionPendingAttachments : undefined);
                    setMentionComposerMessage("");
                    setMentionPendingAttachments([]);
                    setQuotedMessage(null);
                  }}
                  onClearQuotedMessage={() => setQuotedMessage(null)}
                  onAttachFiles={handleAttachFilesForMention}
                  onRemovePendingAttachment={handleRemoveMentionPendingAttachment}
                />
              ) : null
            }
          />
        ) : (
          <ConnectConversations
            conversation={{
              id: selectedConversation.id,
              name: selectedConversation.name,
              type: selectedConversation.type,
              isFavorite: selectedConversation.isFavorite,
              participants: selectedConversation.participants,
            }}
            teamLabel={selectedTeam?.name ?? getConversationTypeLabel(selectedConversation)}
            currentUserId={currentUser.id}
            usersById={connectUsersById}
            messages={selectedMessages as ConnectConversationMessage[]}
            activeMessageMenuId={activeMessageId}
            activeMessageEmojiId={activeMessageForEmoji}
            getQuotedMessageById={(id) => (messagesByConversation[selectedConversation.id] ?? []).find((message) => message.id === id) as ConnectConversationMessage | undefined}
            onOpenDetails={() => setShowDetails(true)}
            onAddReaction={(messageId, emoji) => addReactionToMessage(selectedConversation.id, messageId, emoji)}
            onOpenMessageEmoji={openMessageEmojiMenu}
            onOpenMessageMenu={openMessageMenu}
            onQuoteMessage={(message) => setQuotedMessage(message as ConnectMessage)}
            onOpenReactionHover={openReactionHover}
            onCloseReactionHover={scheduleReactionHoverClose}
            onOpenUserHover={openMentionHover}
            onCloseUserHover={scheduleMentionHoverClose}
            editingMessageId={editingMessageId}
            editingMessageValue={editingMessageDraft}
            onStartEditMessage={startEditMessage}
            onChangeEditMessage={setEditingMessageDraft}
            onSaveEditMessage={saveEditMessage}
            onCancelEditMessage={requestCancelEditMessage}
            disableHoverActions={Boolean(mentionHover)}
          >
            <ConnectMessageInput
              conversationLabel={getConversationLabel(selectedConversation)}
              value={composerMessage}
              users={connectUsers.map((user) => ({
                id: user.id,
                displayName: user.displayName,
                avatar: user.avatar,
                subtitle: user.jobTitle,
              }))}
              currentUserId={currentUser.id}
              quotedMessage={quotedPreview}
              pendingAttachments={pendingAttachments}
              onChange={setComposerMessage}
              onSend={handleSendMessage}
              onClearQuotedMessage={() => setQuotedMessage(null)}
              onAttachFiles={handleAttachFiles}
              onRemovePendingAttachment={handleRemovePendingAttachment}
            />
          </ConnectConversations>
        )}

        {!isMentionsView ? <ConnectChannelDetailsPanel
          open={showDetails}
          title={selectedConversation.name}
          type={selectedConversation.type}
          teamLabel={selectedTeam?.name ?? getConversationTypeLabel(selectedConversation)}
          description={selectedConversation.description ?? ""}
          memberCount={selectedConversation.participants.length}
          pinnedCount={pinnedCount}
          linkCount={(messagesByConversation[selectedConversation.id] ?? []).filter((message) => message.content.includes("http")).length}
          files={conversationFiles.map((file) => ({ id: file.id, originalName: file.originalName, size: file.size }))}
          meetings={relatedMeetings.map((meeting) => ({ id: meeting.id, title: meeting.title }))}
          onClose={() => setShowDetails(false)}
        /> : null}
      </Box>

      <ConnectCascadingMenu
        anchorEl={sidebarMenuAnchor}
        open={Boolean(sidebarMenuAnchor)}
        onClose={closeSidebarMenus}
        items={sidebarMenuItems}
      />

      <ConnectCascadingMenu
        anchorEl={mentionSourceMenuAnchor}
        open={Boolean(mentionSourceMenuAnchor) && mentionSourceMenuItems.length > 0}
        onClose={closeMentionMenus}
        items={mentionSourceMenuItems.map((item) => ({
          ...item,
          onClick: (event) => {
            if (item.id === "copy-link" && selectedMention) {
              const link = `${window.location.origin}${window.location.pathname}?message=${selectedMention.messageId}`;
              void navigator.clipboard.writeText(link);
            }
            item.onClick?.(event);
          },
        }))}
      />

      <ConnectCascadingMenu
        anchorEl={mentionCallMenuAnchor}
        open={Boolean(mentionCallMenuAnchor)}
        onClose={closeMentionMenus}
        items={mentionCallMenuItems}
      />

      <ConnectCascadingMenu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor) && Boolean(activeMessageId)}
        onClose={() => { setMessageMenuAnchor(null); setActiveMessageId(null); }}
        items={messageMenuItems.map((item) => ({
          ...item, onClick: () => {
            if (item.id === "edit" && activeMessageId) {
              const message = selectedMessages.find((entry) => entry.id === activeMessageId);
              if (message) startEditMessage(message as ConnectConversationMessage);
              return;
            }

            if (item.id === "copy-link" && activeMessageId) {
              const link = `${window.location.origin}${window.location.pathname}?message=${activeMessageId}`;
              void navigator.clipboard.writeText(link);
            }

            if (item.id === "delete" && activeMessageId) {
              deleteMessage(activeMessageId);
            }

            setMessageMenuAnchor(null);
            setActiveMessageId(null);
          }
        }))} />

      <ConfirmationDialog
        open={discardEditDialogOpen}
        title="Discard draft"
        description="You can discard your draft or cancel to keep editing."
        cancelLabel="Cancel"
        confirmLabel="Discard"
        confirmColor="error"
        onCancel={keepEditingMessage}
        onConfirm={discardEditMessage}
      />

      {deletedMessage ? (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            alignItems: "center",
            px: 2,
            py: 1.2,
            bgcolor: "grey.900",
            color: "common.white",
            borderRadius: (theme) => theme.tokens.radius.sm,
            boxShadow: (theme) => theme.tokens.elevation.high,
            zIndex: "snackbar",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Message deleted</Typography>
          <Button size="small" onClick={undoDeleteMessage} sx={{ color: "warning.light", fontWeight: 800 }}>
            UNDO
          </Button>
        </Stack>
      ) : null}

      <Popover open={Boolean(messageEmojiAnchor) && Boolean(activeMessageForEmoji)} anchorEl={messageEmojiAnchor} onClose={() => { setMessageEmojiAnchor(null); setActiveMessageForEmoji(null); }} disableScrollLock anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
        <Emoji
          width={320}
          height={380}
          onEmojiClick={(emojiData: EmojiClickData) => {
            if (activeMessageForEmoji) {
              addReactionToMessage(selectedConversation.id, activeMessageForEmoji, emojiData.emoji);
            }
            setMessageEmojiAnchor(null);
            setActiveMessageForEmoji(null);
          }}
        />
      </Popover>



      <Popover
        open={Boolean(reactionHover)}
        anchorEl={reactionHover?.anchorEl ?? null}
        onClose={scheduleReactionHoverClose}
        disableScrollLock
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box onMouseEnter={cancelReactionHoverClose} onMouseLeave={scheduleReactionHoverClose}>
          <ConnectReactionUsersList
            emoji={reactionHover?.emoji ?? ""}
            users={(reactionHover?.userIds ?? []).map((userId) => connectUsersById[userId]).filter(Boolean).map((user) => ({
              id: user.id,
              avatar: user.avatar,
              displayName: user.displayName,
              jobTitle: user.jobTitle,
            }))}
          />
        </Box>
      </Popover>

      <Popover
        open={Boolean(mentionHover)}
        anchorEl={mentionHover?.anchorEl ?? null}
        onClose={() => setMentionHover(null)}
        disableScrollLock
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
      >
        <Box>
          {mentionHover ? (() => {
            const user = connectUsersById[mentionHover.userId];
            if (!user) return null;

            const reportsToUserId = connectReportsToByUserId[user.id];
            const reportsToUser = reportsToUserId ? connectUsersById[reportsToUserId] : undefined;

            return (
              <ConnectUserDetailsCard
                avatar={user.avatar}
                displayName={user.displayName}
                jobTitle={user.jobTitle}
                email={user.email}
                phone={user.phone}
                location={user.location}
                timezone={user.timezone}
                viewerTimezone={currentUser.timezone}
                reportsTo={reportsToUser ? { displayName: reportsToUser.displayName, jobTitle: reportsToUser.jobTitle } : undefined}
              />
            );
          })() : null}
        </Box>
      </Popover>

      <CreateSectionDialog
        createSectionOpen={createSectionOpen}
        setCreateSectionOpen={setCreateSectionOpen}
        pushSystemMessage={pushSystemMessage}
        closeSidebarMenus={closeSidebarMenus}
      />

      <CreateChannelDialog
        open={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        pushSystemMessage={pushSystemMessage}
        closeSidebarMenus={closeSidebarMenus}
      />

      <CreateTeamDialog
        createTeamOpen={createTeamOpen}
        setCreateTeamOpen={setCreateTeamOpen}
        pushSystemMessage={pushSystemMessage}
        closeSidebarMenus={closeSidebarMenus}
      />
    </Box>
  );
}
