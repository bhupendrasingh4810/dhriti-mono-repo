"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { CircularProgress } from "@mui/material";
import type { ConnectConversation, ConnectMessage, ConnectFile, ConnectMeeting, ConnectMentionFeedItem } from "@/mocks/connect/types";
import { useConnect } from "@/hooks/use-connect";
import { useMessageDeletion } from "@/features/connect/hooks/use-message-deletion";
import { connectService } from "@/services/connect.service";
import { PersonAddAlt1Rounded } from "@mui/icons-material";
import ConnectSidebar from "@/features/connect/components/ConnectSidebar";
import { getMenuItems } from "@/utils/connect-menu-item.util";
import { CreateChannelDialog } from "@/components/dialogs/create-channel.dialog";
import { CreateTeamDialog } from "@/components/dialogs/create-team.dialog";
import { CreateSectionDialog } from "@/components/dialogs/create-section.dialog";
import { ConnectConversations } from "@/features/connect/components/ConnectConversations";
import { ConnectCascadingMenuItem } from "@/types/menu.types";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import {
  ConnectConversationMessage,
  ConnectPendingAttachment,
  ConnectSidebarConversation,
  ConnectSidebarMenuContext,
  ConnectSidebarTeamGroup,
} from "@/types/connect.types";
import ConnectMessageInput from "@/features/connect/components/ConnectMessageInput";
import { ConnectMentionsFilter, ConnectMentionsView } from "@/features/connect/components/ConnectMentionsView";
import { ConnectChannelDetailsPanel } from "@/features/connect/components/ConnectChannelDetailsPanel";
import { DeletedMessageToast, MessageOverlays, type MentionHoverState, type ReactionHoverState } from "@/features/connect/components/MessageOverlays";
import { useWorkspaceCall } from "@/features/connect/components/WorkspaceCallProvider";

const quickViewsConfig = [
  { icon: MentionIcon, label: "Mentions" },
  { icon: ListIcon, label: "Threads" },
  { icon: MailIcon, label: "Drafts" },
];

function PageIcon({ name, className = "" }: { name: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    mention: <path d="M16 8a4 4 0 1 0-8 0v5a4 4 0 0 0 8 0v-1h-3" />,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3" cy="6" r="1" fill="currentColor" /><circle cx="3" cy="12" r="1" fill="currentColor" /><circle cx="3" cy="18" r="1" fill="currentColor" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    palette: <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h2a7 7 0 0 0 0-10Z" />,
    archive: <><path d="M4 7h16v13H4zM3 4h18v3H3zM10 12h4" /></>,
    eye: <path d="M2 12s3-6 10-6 10 6 10 6-3 6-10 6-10-6-10-6Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    link: <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 16c2.5 0 4 1.3 4 4" /></>,
    pin: <path d="m14 4 6 6-3 1-4 4-1 5-2-2-5 1 1-5-2-2 5-1 4-4z" />,
    trash: <><path d="M4 7h16M10 11v5M14 11v5M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
    flag: <path d="M5 21V4m0 1h12l-1 4 1 4H5" />,
  };
  return <svg aria-hidden="true" className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.mail}</svg>;
}
function MentionIcon({ className }: { className?: string }) { return <PageIcon name="mention" className={className} />; }
function ListIcon({ className }: { className?: string }) { return <PageIcon name="list" className={className} />; }
function MailIcon({ className }: { className?: string }) { return <PageIcon name="mail" className={className} />; }
function PaletteIcon({ className }: { className?: string }) { return <PageIcon name="palette" className={className} />; }
function ArchiveIcon({ className }: { className?: string }) { return <PageIcon name="archive" className={className} />; }

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

export default function ConnectWorkspace() {
  const { startCall } = useWorkspaceCall();
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const live = useConnect(selectedConversationId);
  const connectUsersById = live.users;
  const connectUsers = Object.values(live.users);
  const connectTeams = live.teams;
  const connectTeamsById = Object.fromEntries(connectTeams.map((team) => [team.id, team]));
  const conversationsById = live.conversations;
  const connectConversations = Object.values(conversationsById);
  const messagesByConversation = live.messages;
  const connectSidebarState = {
    ...live.sidebar, currentUser: live.user?.id ?? "", unread: live.unread, mentions: {} as Record<string, number>,
  };
  const connectChannels = connectConversations.filter((conversation) => conversation.type === "channel").map((conversation) => ({
    ...conversation, slug: conversation.name, isArchived: conversation.archived, visibility: "team",
  }));
  const connectFiles: ConnectFile[] = [];
  const connectMeetings: ConnectMeeting[] = [];
  const connectPinnedItems: { conversationId: string }[] = [];
  const connectReportsToByUserId: Record<string, string> = {};
  const connectMentionFeed: ConnectMentionFeedItem[] = [];
  useEffect(() => {
    if (!selectedConversationId || !conversationsById[selectedConversationId]) {
      setSelectedConversationId(Object.keys(conversationsById)[0] ?? "");
    }
  }, [conversationsById, selectedConversationId]);
  const [showDetails, setShowDetails] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [composerMessage, setComposerMessage] = useState("");
  const [mentionComposerMessage, setMentionComposerMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ConnectPendingAttachment[]>([]);
  const [mentionPendingAttachments, setMentionPendingAttachments] = useState<ConnectPendingAttachment[]>([]);

  const [activeQuickViewId, setActiveQuickViewId] = useState<string | null>(null);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({ team_001: true });
  const [sectionViewMode, setSectionViewMode] = useState({
    favorites: "all",
    chats: "all",
    mentions: "always",
    threads: "always",
  });
  const [quotedMessage, setQuotedMessage] = useState<ConnectMessage | null>(null);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [mentionsFilter, setMentionsFilter] = useState<ConnectMentionsFilter>("unread");
  const [selectedMentionId, setSelectedMentionId] = useState<string | null>(null);
  const [mentionHover, setMentionHover] = useState<MentionHoverState | null>(null);
  const [reactionHover, setReactionHover] = useState<ReactionHoverState | null>(null);
  const reactionHoverCloseTimerRef = useRef<number | null>(null);

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
  const { deletedMessage, undoInProgress, deleteMessage, undoDeleteMessage } = useMessageDeletion({
    organizationId: live.organizationId,
    conversationId: selectedConversation?.id ?? "",
    messages: messagesByConversation[selectedConversation?.id] ?? [],
    loadMessages: live.loadMessages,
    onError: live.reportError,
  });

  const favoriteConversations = useMemo(() => {
    const items = [...connectSidebarState.favorites.channels, ...connectSidebarState.favorites.chats]
      .map((id) => conversationsById[id])
      .filter((conversation): conversation is ConnectConversation => Boolean(conversation));

    return sectionViewMode.favorites === "unread"
      ? items.filter((conversation) => (live.unread[conversation.id] ?? 0) > 0)
      : items;
  }, [conversationsById, sectionViewMode.favorites, live.sidebar, live.unread]);

  const chatConversations = useMemo(
    () =>
      Object.values(conversationsById).filter(
        (conversation) => conversation.type === "direct" || conversation.type === "group",
      ),
    [conversationsById, live.sidebar],
  );

  const recentConversations = useMemo(
    () =>
      connectSidebarState.recentChats
        .map((id) => conversationsById[id])
        .filter((conversation): conversation is ConnectConversation => Boolean(conversation)),
    [conversationsById],
  );

  const unreadTotal = useMemo(
    () => Object.values(connectSidebarState.unread).reduce((sum, count) => sum + count, 0),
    [live.unread],
  );
  const mentionTotal = useMemo(
    () => Object.values(connectSidebarState.mentions).reduce((sum, count) => sum + count, 0),
    [],
  );
  const draftCount = useMemo(() => (composerMessage.trim() ? 1 : 0), [composerMessage]);

  const threadCount = useMemo(
    () =>
      Object.values(messagesByConversation)
        .flat()
        .filter((message) => (message.replyCount ?? 0) > 0).length,
    [messagesByConversation],
  );

  const selectedMessages = useMemo(() => {
    const current = messagesByConversation[selectedConversation?.id] ?? [];
    const recipientId = selectedConversation?.type === "direct"
      ? selectedConversation.participants.find((userId) => userId !== live.user?.id) : undefined;
    const readAt = recipientId ? live.readReceipts[selectedConversation.id]?.[recipientId] : null;
    return current.map((message): ConnectMessage => ({
      ...message,
      status: message.senderId === live.user?.id && readAt && Date.parse(readAt) >= Date.parse(message.createdAt)
        ? "read" : message.status,
    })).sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
  }, [messagesByConversation, selectedConversation, live.readReceipts, live.user?.id]);

  const conversationFiles = useMemo(
    () => connectFiles.filter((file) => file.conversationId === selectedConversation?.id),
    [selectedConversation],
  );

  const pinnedCount = useMemo(
    () => connectPinnedItems.filter((item) => item.conversationId === selectedConversation?.id).length,
    [selectedConversation],
  );

  const relatedMeetings = useMemo(
    () => (selectedConversation?.type === "channel" ? connectMeetings.slice(0, 1) : []),
    [selectedConversation],
  );

  const sidebarTeams = useMemo<ConnectSidebarTeamGroup[]>(
    () =>
      connectTeams.map((team) => ({
        id: team.id,
        label: team.name,
        icon: team.name === "Design" ? PaletteIcon : ArchiveIcon,
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
    [expandedTeamIds, live.teams, live.conversations],
  );

  const sidebarQuickViews = useMemo(
    () =>
      quickViewsConfig.map((item) => ({
        id: item.label.toLowerCase() as "mentions" | "threads" | "drafts",
        icon: item.icon,
        label: item.label,
        value: item.label === "Mentions" ? mentionTotal : item.label === "Threads" ? threadCount : draftCount,
      })),
    [draftCount, mentionTotal, threadCount],
  );

  const visibleChatConversations = useMemo(() => {
    const merged = recentConversations
      .concat(chatConversations)
      .filter((conversation) => conversation.type === "direct" || conversation.type === "group")
      .filter((conversation, index, all) => all.findIndex((item) => item.id === conversation.id) === index);

    return sectionViewMode.chats === "unread"
      ? merged.filter((conversation) => (connectSidebarState.unread[conversation.id] ?? conversation.unreadCount) > 0)
      : merged;
  }, [chatConversations, recentConversations, sectionViewMode.chats, live.unread]);

  const sidebarChatRows: ConnectSidebarConversation[] = visibleChatConversations.map((conversation) => ({
    id: conversation.id,
    name: conversation.name,
    type: conversation.type,
    avatar: conversation.avatar,
    unreadCount: live.unread[conversation.id] ?? conversation.unreadCount,
  }));
  if (sectionViewMode.chats === "all") {
    const existingDirectUsers = new Set(chatConversations
      .filter((conversation) => conversation.type === "direct")
      .flatMap((conversation) => conversation.participants));
    sidebarChatRows.push(...connectUsers
      .filter((person) => person.organizationId === live.organizationId
        && person.id !== live.user?.id && !existingDirectUsers.has(person.id))
      .map((person): ConnectSidebarConversation => ({
        id: `contact-${person.id}`,
        userId: person.id,
        name: person.displayName,
        type: "direct",
        avatar: person.avatar,
        unreadCount: 0,
      })));
  }

  const mentionItems = useMemo(() => {
    const base = connectMentionFeed
      .filter((item) => item.mentionedUserId === currentUser?.id)
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
  }, [currentUser?.id, mentionsFilter]);

  const selectedMention = useMemo(
    () => mentionItems.find((item) => item.id === selectedMentionId) ?? null,
    [mentionItems, selectedMentionId],
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
    if (
      !activeMentionMenuId ||
      !selectedMention ||
      selectedMention.id !== activeMentionMenuId ||
      selectedMention.sourceType !== "channel"
    ) {
      return [];
    }

    return [
      { id: "unfollow-thread", label: "Unfollow thread", icon: <PageIcon name="eye" /> },
      { id: "mark-unread", label: "Mark as unread", icon: <PageIcon name="mail" /> },
      { id: "copy-link", label: "Copy link", icon: <PageIcon name="link" /> },
    ];
  }, [activeMentionMenuId, selectedMention]);

  const mentionCallMenuItems: ConnectCascadingMenuItem[] = [
    { id: "video-call", label: "Video Call", icon: <PageIcon name="link" /> },
    { id: "audio-call", label: "Audio Call", icon: <PageIcon name="users" /> },
  ];

  const sidebarMenuItems: ConnectCascadingMenuItem[] = getMenuItems(
        sidebarMenuContext,
        sectionViewMode,
        setSectionViewMode,
        setCreateSectionOpen,
        setCreateTeamOpen,
        setCreateChannelOpen,
        pushSystemMessage,
      );
  if (sidebarMenuContext?.id && ["user", "channel", "team"].includes(sidebarMenuContext.kind)) {
    const itemId = sidebarMenuContext.id;
    const itemType = sidebarMenuContext.kind === "team" ? "team" : sidebarMenuContext.kind === "channel" ? "channel" : "chat";
    const ids = itemType === "team" ? live.sidebar.favorites.teams : itemType === "channel" ? live.sidebar.favorites.channels : live.sidebar.favorites.chats;
    const isFavorite = ids.includes(itemId);
    sidebarMenuItems.unshift({ id: "toggle-favorite", label: isFavorite ? "Remove from favorites" : "Add to favorites", icon: <PageIcon name="pin" />, onClick: () => {
      void live.favorite(itemType, itemId, !isFavorite).catch(live.reportError);
      closeSidebarMenus();
    }});
  }

  const activeMenuMessage = activeMessageId
    ? selectedMessages.find((message) => message.id === activeMessageId)
    : undefined;
  const canEditActiveMessage = Boolean(activeMenuMessage && activeMenuMessage.senderId === currentUser?.id);

  const messageMenuItems: ConnectCascadingMenuItem[] = [
    ...(canEditActiveMessage ? [{ id: "edit", label: "Edit Message", icon: <PageIcon name="link" /> }] : []),
    { id: "forward", label: "Forward", icon: <PageIcon name="link" /> },
    { id: "copy-link", label: "Copy Link", icon: <PageIcon name="link" /> },
    { id: "pin", label: "Pin", icon: <PageIcon name="pin" /> },
    { id: "save", label: "Save this Message", icon: <PageIcon name="archive" /> },
    { id: "mark-unread", label: "Mark as unread", icon: <PageIcon name="mail" /> },
    { id: "translate", label: "Translations", icon: <PageIcon name="mention" /> },
    ...(canEditActiveMessage ? [{ id: "delete", label: "Delete Message", icon: <PageIcon name="trash" />, danger: true }] : []),
    { id: "report", label: "Report this Message", icon: <PageIcon name="flag" />, danger: true },
    { id: "more", label: "More actions", icon: <PageIcon name="list" /> },
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
    const existing = messagesByConversation[conversationId]?.find((message) => message.id === messageId)?.reactions?.find((reaction) => reaction.emoji === emoji);
    const action = existing?.userIds.includes(currentUser.id) ? connectService.removeReaction : connectService.addReaction;
    void action(live.organizationId, messageId, emoji).then(() => live.loadMessages(conversationId)).catch(live.reportError);
  }

  function pushSystemMessage(content: string) {
    live.setError(content);
  }

  async function handleSendMessageToConversation(
    conversationId: string,
    payload: { content: string; mentionUserIds: string[] },
    attachments?: ConnectPendingAttachment[],
  ) {
    const conversation = conversationsById[conversationId];
    if (!conversation || !currentUser) return;
    if (!payload.content.trim() && !attachments?.length) return;
    if (attachments?.length) throw new Error("Message attachments are not supported by the current API.");
    return live.send(conversationId, { ...payload, clientMessageId: crypto.randomUUID(), parentId: quotedMessage?.id });
  }

  async function handleSendMessage(payload: { content: string; mentionUserIds: string[] }) {
    if (!selectedConversation) return;
    try {
    await handleSendMessageToConversation(
      selectedConversation.id,
      payload,
      pendingAttachments.length ? pendingAttachments : undefined,
    );

    setComposerMessage("");
    setPendingAttachments([]);
    setQuotedMessage(null);
    live.typing(false);
    } catch (reason) { live.reportError(reason); }
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
    if (message.senderId !== currentUser?.id) return;

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

  async function saveEditMessage(payload: { content: string; mentionUserIds: string[] }) {
    if (!editingMessageId) return;
    const nextContent = payload.content.trim();
    if (!nextContent) return;

    try {
    await connectService.updateMessage(live.organizationId, editingMessageId, { content: nextContent });
    await live.loadMessages(selectedConversation.id);
    setEditingMessageId(null);
    setEditingMessageDraft("");
    } catch (reason) { live.reportError(reason); }
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

  if (live.loading || !live.user) return (
    <div className="flex h-full w-full items-center justify-center text-brand">
      <CircularProgress color="inherit" aria-label="Loading Connect" />
    </div>
  );

  const quotedPreview = quotedMessage
    ? {
      senderName: connectUsersById[quotedMessage.senderId]?.displayName ?? "Unknown",
      content: quotedMessage.content,
    }
    : null;

  const mentionQuotedPreview =
    quotedMessage && selectedMention
      ? {
        senderName: connectUsersById[quotedMessage.senderId]?.displayName ?? "Unknown",
        content: quotedMessage.content,
      }
      : null;

  const isMentionsView = activeQuickViewId === "mentions";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 p-4 text-slate-900">
      {live.error ? <div role="alert" className="mb-2 flex items-center justify-between bg-error/10 p-2 text-sm text-error"><span>{live.error}</span><button type="button" onClick={() => live.setError("")}>Dismiss</button></div> : null}
      {/* <div role="status" className="mb-2 text-xs text-text-secondary">{live.connected ? "Connected" : "Reconnecting"}{(live.typingUsers[selectedConversationId] ?? []).length ? ` · ${(live.typingUsers[selectedConversationId] ?? []).map((id) => connectUsersById[id]?.displayName ?? "Member").join(", ")} typing` : ""}</div> */}
      {/* <div className="mb-2 flex items-center gap-2">
        <button type="button" className="grid h-9 w-9 place-items-center rounded border border-border bg-surface" aria-label="New conversation" title="New conversation" onClick={() => setContactPickerOpen((open) => !open)}><PersonAddAlt1Rounded fontSize="small" /></button>
        {contactPickerOpen ? <select aria-label="Select organization member" defaultValue="" className="rounded border border-border bg-surface p-2 text-sm" onChange={(event) => {
          if (!event.target.value) return;
          void live.startDirect(event.target.value).then((id) => { setSelectedConversationId(id); setContactPickerOpen(false); }).catch(live.reportError);
        }}><option value="" disabled>Select a member</option>{connectUsers.filter((person) => person.id !== live.user?.id).map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</select> : null}
      </div> */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="mr-2 rounded-[10px]">
          <ConnectSidebar
            key={`${live.organizationId}-${live.user?.id}-${sectionViewMode.chats}`}
            quickViews={sidebarQuickViews}
            favoriteConversations={favoriteConversations.map((conversation) => ({
              id: conversation.id,
              name: conversation.name,
              type: conversation.type,
              avatar: conversation.avatar,
              unreadCount: live.unread[conversation.id] ?? 0,
              isSelfSpace: conversation.id.startsWith("personal_"),
            }))}
            chatConversations={sidebarChatRows}
            teams={sidebarTeams}
            selectedConversationId={selectedConversationId}
            activeQuickViewId={activeQuickViewId}
            onToggleTeam={handleToggleTeam}
            onSelectConversation={handleSelectConversation}
            onSelectUser={(userId) => {
              void live.startDirect(userId).then((conversationId) => {
                if (conversationId) handleSelectConversation(conversationId);
              }).catch(live.reportError);
            }}
            onSelectQuickView={handleSelectQuickView}
            onOpenSidebarMenu={openSidebarMenu}
          />
        </div>

        <div className="ml-2 flex min-w-0 flex-1 overflow-hidden rounded-[10px]">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {!selectedConversation || !currentUser ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-text-primary">
                <h2 className="text-base font-semibold">{live.error ? "Unable to load all Connect data" : "No conversations yet"}</h2>
                {live.error ? <button type="button" onClick={() => { void live.refresh()?.catch(live.reportError); }} className="rounded-md border border-border bg-surface px-3 py-2 text-sm">Retry</button> : null}
                {!live.error && connectUsers.filter((person) => person.id !== live.user?.id).length === 0 ? <p className="text-sm text-text-secondary">No other active members in this organization.</p> : null}
                <div className="flex flex-wrap justify-center gap-2">{connectUsers.filter((person) => person.id !== live.user?.id).map((person) => (
                  <button key={person.id} type="button" className="rounded-md border border-border bg-surface px-3 py-2 text-sm" onClick={() => {
                    void live.startDirect(person.id).then(setSelectedConversationId).catch(live.reportError);
                  }}>{person.displayName}</button>
                ))}</div>
              </div>
            ) : isMentionsView ? (
            <ConnectMentionsView
              items={mentionItems}
              usersById={Object.fromEntries(
                Object.values(connectUsersById).map((user) => [
                  user.id,
                  { id: user.id, displayName: user.displayName, avatar: user.avatar, jobTitle: user.jobTitle },
                ]),
              )}
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
                    conversationLabel={getConversationLabel(
                      conversationsById[selectedMention.conversationId] ?? selectedConversation,
                    )}
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
                      handleSendMessageToConversation(
                        selectedMention.conversationId,
                        payload,
                        mentionPendingAttachments.length ? mentionPendingAttachments : undefined,
                      );
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
              key={`${live.organizationId}-${selectedConversation.id}`}
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
              typingUserIds={live.typingUsers[selectedConversation.id] ?? []}
              messagesLoading={live.historyState[selectedConversation.id]?.loading ?? true}
              historyError={live.historyState[selectedConversation.id]?.error}
              firstUnreadId={live.historyState[selectedConversation.id]?.firstUnreadId}
              hasOlderMessages={Boolean(live.historyState[selectedConversation.id]?.olderCursor)}
              hasNewerMessages={Boolean(live.historyState[selectedConversation.id]?.newerCursor)}
              loadingMoreMessages={live.historyState[selectedConversation.id]?.paging}
              onLoadMoreMessages={(direction) => { void live.loadMoreMessages(selectedConversation.id, direction); }}
              onReadMessage={(messageId) => { void live.markVisibleMessageRead(selectedConversation.id, messageId); }}
              onRetryMessages={() => { void live.loadMessages(selectedConversation.id, true).catch(live.reportError); }}
              activeMessageMenuId={activeMessageId}
              activeMessageEmojiId={activeMessageForEmoji}
              getQuotedMessageById={(id) =>
                (messagesByConversation[selectedConversation.id] ?? []).find((message) => message.id === id) as
                ConnectConversationMessage | undefined
              }
              onOpenDetails={() => setShowDetails(true)}
              onStartCall={(kind) => startCall({
                conversationId: selectedConversation.id,
                conversationName: selectedConversation.name,
                participantIds: selectedConversation.participants,
                kind,
              })}
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
                onChange={(value) => { setComposerMessage(value); live.typing(Boolean(value.trim())); }}
                onSend={handleSendMessage}
                onClearQuotedMessage={() => setQuotedMessage(null)}
                onAttachFiles={handleAttachFiles}
                onRemovePendingAttachment={handleRemovePendingAttachment}
              />
            </ConnectConversations>
            )}
          </div>

          {!isMentionsView && selectedConversation ? (
            <ConnectChannelDetailsPanel
              open={showDetails}
              title={selectedConversation.name}
              type={selectedConversation.type}
              teamLabel={selectedTeam?.name ?? getConversationTypeLabel(selectedConversation)}
              description={selectedConversation.description ?? ""}
              memberCount={selectedConversation.participants.length}
              pinnedCount={pinnedCount}
              linkCount={
                (messagesByConversation[selectedConversation.id] ?? []).filter((message) =>
                  message.content.includes("http"),
                ).length
              }
              files={conversationFiles.map((file) => ({ id: file.id, originalName: file.originalName, size: file.size }))}
              meetings={relatedMeetings.map((meeting) => ({ id: meeting.id, title: meeting.title }))}
              onClose={() => setShowDetails(false)}
            />
          ) : null}
        </div>
      </div>

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
        onClose={() => {
          setMessageMenuAnchor(null);
          setActiveMessageId(null);
        }}
        items={messageMenuItems.map((item) => ({
          ...item,
          onClick: () => {
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
          },
        }))}
      />

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

      <DeletedMessageToast visible={Boolean(deletedMessage)} restoring={undoInProgress} onUndo={undoDeleteMessage} />
      <MessageOverlays
        emojiAnchor={messageEmojiAnchor}
        emojiMessageId={activeMessageForEmoji}
        onCloseEmoji={() => { setMessageEmojiAnchor(null); setActiveMessageForEmoji(null); }}
        onReaction={(messageId, emoji) => addReactionToMessage(selectedConversation.id, messageId, emoji)}
        reactionHover={reactionHover}
        onCloseReaction={scheduleReactionHoverClose}
        onKeepReactionOpen={cancelReactionHoverClose}
        mentionHover={mentionHover}
        onCloseMention={() => setMentionHover(null)}
        usersById={connectUsersById}
        reportsToByUserId={connectReportsToByUserId}
        viewerTimezone={currentUser?.timezone}
      />

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
    </div>
  );
}
