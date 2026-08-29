"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  Add,
  AddRounded,
  CheckRounded,
  DeleteOutlineRounded,
  EditRounded,
  ExitToAppRounded,
  FlagOutlined,
  FormatListBulletedRounded,
  ForwardToInboxRounded,
  Inventory2Rounded,
  LinkRounded,
  MailOutlineRounded,
  MarkEmailUnreadRounded,
  MoreVertRounded,
  OpenInNewRounded,
  PersonAddAlt1Rounded,
  PersonRemoveRounded,
  NotificationsNoneRounded,
  PaletteRounded,
  PeopleRounded,
  PushPinRounded,
  ChevronRightRounded,
  SettingsRounded,
  SaveAltRounded,
  TranslateRounded,
  VisibilityOffRounded,
  WbSunnyOutlined,
  AlternateEmailRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
import {
  ConnectMessageHoverActions,
  ConnectChannelDetailsPanel,
  ConnectConversationWindow,
  ConnectMentionsView,
  ConnectMessageInput,
  ConnectSidebarNavigation,
  ConnectReactionUsersList,
  ConnectCascadingMenu,
  type ConnectMentionsFilter,
  type ConnectSidebarMenuContext,
  type ConnectSidebarTeamGroup,
  ConnectUserDetailsCard,
  type ConnectConversationWindowMessage,
  type ConnectCascadingMenuItem,
} from "@dhriti/ui";

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

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const [quickViewsOpen, setQuickViewsOpen] = useState(true);
  const [favouritesOpen, setFavouritesOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [activeQuickViewId, setActiveQuickViewId] = useState<string | null>(null);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({ team_001: true });
  const [sectionViewMode, setSectionViewMode] = useState({ favorites: "all", chats: "all", mentions: "always", threads: "always" });
  const [participantSearch, setParticipantSearch] = useState("");
  const [quotedMessage, setQuotedMessage] = useState<ConnectMessage | null>(null);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [sectionName, setSectionName] = useState("");
  const [sectionEmoji, setSectionEmoji] = useState("");
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelType, setChannelType] = useState("standard");
  const [channelLayout, setChannelLayout] = useState("threads");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamVisibility, setTeamVisibility] = useState("public");
  const [teamFirstChannelName, setTeamFirstChannelName] = useState("");
  const [mentionsFilter, setMentionsFilter] = useState<ConnectMentionsFilter>("unread");
  const [selectedMentionId, setSelectedMentionId] = useState<string | null>(null);
  const [mentionHover, setMentionHover] = useState<MentionHoverState | null>(null);
  const [reactionHover, setReactionHover] = useState<ReactionHoverState | null>(null);
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

  const [participantsAnchor, setParticipantsAnchor] = useState<HTMLElement | null>(null);

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

  const participants = useMemo(
    () => selectedConversation.participants.map((id) => connectUsersById[id]).filter(Boolean),
    [selectedConversation]
  );

  const addableUsers = useMemo(() => {
    const set = new Set(selectedConversation.participants);
    return connectUsers
      .filter((user) => !set.has(user.id))
      .filter((user) => user.displayName.toLowerCase().includes(participantSearch.toLowerCase()))
      .slice(0, 8);
  }, [selectedConversation, participantSearch]);

  const sidebarMenuItems = useMemo<ConnectCascadingMenuItem[]>(() => {
    if (!sidebarMenuContext) return [];

    if (sidebarMenuContext.kind === "section" && sidebarMenuContext.sectionId === "quick-views") {
      return [
        { id: "show-always", label: "Always", selected: true, sectionTitle: "Show" },
        { id: "show-unread", label: "When unread" },
      ];
    }

    if (sidebarMenuContext.kind === "quick-view") {
      if (sidebarMenuContext.id === "drafts") {
        return [{ id: "hide-drafts", label: "Hide", icon: <VisibilityOffRounded fontSize="small" />, sectionTitle: "Options" }];
      }

      const key = sidebarMenuContext.id as "mentions" | "threads";
      return [
        {
          id: "show-always",
          label: "Always",
          selected: sectionViewMode[key] === "always",
          sectionTitle: "Show",
          onClick: () => setSectionViewMode((previous) => ({ ...previous, [key]: "always" })),
        },
        {
          id: "show-unread",
          label: "When unread",
          selected: sectionViewMode[key] === "unread",
          onClick: () => setSectionViewMode((previous) => ({ ...previous, [key]: "unread" })),
        },
      ];
    }

    if (sidebarMenuContext.kind === "section" && (sidebarMenuContext.sectionId === "favorites" || sidebarMenuContext.sectionId === "chats")) {
      const key = sidebarMenuContext.sectionId;
      return [
        {
          id: "view-all",
          label: "All",
          selected: sectionViewMode[key] === "all",
          sectionTitle: "View",
          onClick: () => setSectionViewMode((previous) => ({ ...previous, [key]: "all" })),
        },
        {
          id: "view-unread",
          label: "Unread only",
          selected: sectionViewMode[key] === "unread",
          onClick: () => setSectionViewMode((previous) => ({ ...previous, [key]: "unread" })),
        },
      ];
    }

    if (sidebarMenuContext.kind === "section" && sidebarMenuContext.sectionId === "teams") {
      return [
        {
          id: "create-team",
          label: "Create Team",
          icon: <AddRounded fontSize="small" />,
          sectionTitle: "Options",
          onClick: () => setCreateTeamOpen(true),
        },
      ];
    }

    if (sidebarMenuContext.kind === "personal") {
      return [
        { id: "open-window", label: "Open in new window", icon: <OpenInNewRounded fontSize="small" /> },
        {
          id: "move-section",
          label: "Move to section",
          closeOnClick: false,
          children: [
            { id: "move-favorites", label: "Favorites" },
            { id: "move-new-section", label: "New Section", onClick: () => setCreateSectionOpen(true) },
          ],
        },
        { id: "hide", label: "Hide", icon: <VisibilityOffRounded fontSize="small" /> },
      ];
    }

    if (sidebarMenuContext.kind === "user") {
      return [
        { id: "open-window", label: "Open in new window", icon: <OpenInNewRounded fontSize="small" /> },
        { id: "mark-read", label: "Mark as read", icon: <CheckRounded fontSize="small" /> },
        {
          id: "move-section",
          label: "Move to section",
          closeOnClick: false,
          children: [
            { id: "move-favorites", label: "Favorites" },
            { id: "move-new-section", label: "New Section", onClick: () => setCreateSectionOpen(true) },
          ],
        },
        { id: "mute", label: "Mute", icon: <NotificationsNoneRounded fontSize="small" /> },
        { id: "notify", label: "Notify when available", icon: <WbSunnyOutlined fontSize="small" /> },
        { id: "workflows", label: "Workflows", icon: <SettingsRounded fontSize="small" /> },
        { id: "copy-link", label: "Copy link", icon: <LinkRounded fontSize="small" /> },
        { id: "remove-history", label: "Remove Chat History", icon: <DeleteOutlineRounded fontSize="small" />, dividerAbove: true, danger: true },
        { id: "hide", label: "Hide", icon: <VisibilityOffRounded fontSize="small" /> },
      ];
    }

    if (sidebarMenuContext.kind === "channel") {
      return [
        { id: "open-window", label: "Open in new window", icon: <OpenInNewRounded fontSize="small" /> },
        { id: "channel-notifications", label: "Channel notifications", icon: <NotificationsNoneRounded fontSize="small" /> },
        {
          id: "move-section",
          label: "Move to section",
          closeOnClick: false,
          children: [
            { id: "move-new-section", label: "New Section", onClick: () => setCreateSectionOpen(true) },
          ],
        },
        { id: "remove-section", label: "Remove from section", icon: <DeleteOutlineRounded fontSize="small" /> },
        { id: "hide", label: "Hide", icon: <VisibilityOffRounded fontSize="small" /> },
        { id: "manage-channel", label: "Manage channel", icon: <SettingsRounded fontSize="small" />, dividerAbove: true, onClick: () => pushSystemMessage(`Manage channel requested for ${sidebarMenuContext.label}.`) },
        { id: "manage-tags", label: "Manage channel tags", icon: <EditRounded fontSize="small" /> },
        { id: "copy-link", label: "Copy Link", icon: <LinkRounded fontSize="small" /> },
        { id: "workflows", label: "Work flows", icon: <SettingsRounded fontSize="small" /> },
        { id: "go-team", label: "Go to team", icon: <ChevronRightRounded fontSize="small" /> },
      ];
    }

    if (sidebarMenuContext.kind === "team") {
      return [
        { id: "hide-channels", label: "Hide all Channels", icon: <VisibilityOffRounded fontSize="small" /> },
        { id: "add-member", label: "Add member", icon: <PersonAddAlt1Rounded fontSize="small" /> },
        { id: "add-channel", label: "Add channel", icon: <AddRounded fontSize="small" />, onClick: () => setCreateChannelOpen(true) },
        { id: "manage-team", label: "Manage team", icon: <SettingsRounded fontSize="small" />, onClick: () => pushSystemMessage(`Manage team requested for ${sidebarMenuContext.label}.`) },
        { id: "manage-tags", label: "Manage tags", icon: <EditRounded fontSize="small" /> },
        { id: "copy-link", label: "Copy link", icon: <LinkRounded fontSize="small" /> },
        { id: "leave-team", label: "Leave team", icon: <ExitToAppRounded fontSize="small" /> },
      ];
    }

    return [];
  }, [sectionViewMode, sidebarMenuContext]);

  const messageMenuItems: ConnectCascadingMenuItem[] = [
    { id: "forward", label: "Forward", icon: <ForwardToInboxRounded fontSize="small" /> },
    { id: "copy-link", label: "Copy Link", icon: <LinkRounded fontSize="small" /> },
    { id: "pin", label: "Pin", icon: <PushPinRounded fontSize="small" /> },
    { id: "save", label: "Save this Message", icon: <SaveAltRounded fontSize="small" /> },
    { id: "mark-unread", label: "Mark as unread", icon: <MarkEmailUnreadRounded fontSize="small" /> },
    { id: "translate", label: "Translations", icon: <TranslateRounded fontSize="small" /> },
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

  function handleSendMessageToConversation(conversationId: string, payload: { content: string; mentionUserIds: string[] }) {
    const conversation = conversationsById[conversationId];
    if (!conversation || !currentUser) return;
    const now = new Date().toISOString();

    const newMessage: ConnectMessage = {
      id: `msg_local_${Date.now()}`,
      conversationType: conversation.type,
      conversationId,
      senderId: currentUser.id,
      content: payload.content,
      contentType: "text",
      createdAt: now,
      status: "sent",
      quotedMessageId: quotedMessage?.id,
      mentions: payload.mentionUserIds,
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

    handleSendMessageToConversation(selectedConversation.id, payload);

    setComposerMessage("");
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
    setMessageMenuAnchor(event.currentTarget);
    setActiveMessageId(messageId);
  }

  function openMessageEmojiMenu(event: MouseEvent<HTMLElement>, messageId: string) {
    event.stopPropagation();
    setMessageEmojiAnchor(event.currentTarget);
    setActiveMessageForEmoji(messageId);
  }

  function handleAttachFilesToConversation(conversationId: string, fileList: FileList | null) {
    const conversation = conversationsById[conversationId];
    if (!fileList || !conversation || !currentUser) return;

    const files = Array.from(fileList);
    if (files.length === 0) return;

    const now = new Date().toISOString();
    const attachments = files.map((file, index) => ({
      id: `upload_${Date.now()}_${index}`,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      url: URL.createObjectURL(file),
    }));

    const newMessage: ConnectMessage = {
      id: `msg_upload_${Date.now()}`,
      conversationType: conversation.type,
      conversationId,
      senderId: currentUser.id,
      content: `Shared ${files.length} attachment${files.length > 1 ? "s" : ""}`,
      contentType: "file",
      createdAt: now,
      status: "sent",
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

  function handleAttachFiles(fileList: FileList | null) {
    if (!selectedConversation) return;

    handleAttachFilesToConversation(selectedConversation.id, fileList);

    setComposerMessage("");
  }

  function handleAddParticipant(userId: string) {
    const user = connectUsersById[userId];

    setConversationsById((previous) => {
      const conversation = previous[selectedConversation.id];
      if (!conversation || conversation.participants.includes(userId)) return previous;

      return {
        ...previous,
        [selectedConversation.id]: {
          ...conversation,
          participants: [...conversation.participants, userId],
        },
      };
    });

    if (user) {
      pushSystemMessage(`${user.displayName} was added to this conversation.`);
    }
  }

  function handleRemoveParticipant(userId: string) {
    const user = connectUsersById[userId];

    setConversationsById((previous) => {
      const conversation = previous[selectedConversation.id];
      if (!conversation || !conversation.participants.includes(userId) || userId === currentUser.id) return previous;

      return {
        ...previous,
        [selectedConversation.id]: {
          ...conversation,
          participants: conversation.participants.filter((id) => id !== userId),
        },
      };
    });

    if (user) {
      pushSystemMessage(`${user.displayName} was removed from this conversation.`);
    }
  }

  function renderMessageContent(message: ConnectMessage) {
    const singleEmojiPattern = /^(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*|[\u{1F1E6}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3)$/u;

    function renderMentionToken(token: string, key: string) {
      const displayName = token.slice(2, -1);
      const user = connectUsers.find((candidate) => candidate.displayName.toLowerCase() === displayName.toLowerCase());

      return (
        <Box
          key={key}
          component="span"
          onMouseEnter={(event: MouseEvent<HTMLElement>) => {
            if (user) {
              openMentionHover(event, user.id);
            }
          }}
          sx={{ color: "#92400e", fontWeight: 700, cursor: user ? "pointer" : "default" }}
        >
          @{displayName}
        </Box>
      );
    }

    function renderInlineMarkdown(text: string, keyPrefix: string) {
      const tokens = text.split(/(@\[[^\]]+\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+==|\[[^\]]+\]\([^\)]+\))/g);

      return tokens.map((token, index) => {
        if (!token) return null;

        if (/^@\[[^\]]+\]$/.test(token)) {
          return renderMentionToken(token, `${keyPrefix}-mention-${index}`);
        }

        if (/^`[^`]+`$/.test(token)) {
          return (
            <Box
              key={`${keyPrefix}-inline-code-${index}`}
              component="span"
              sx={{
                px: 0.7,
                py: 0.15,
                mx: 0.2,
                borderRadius: 0.8,
                bgcolor: "#eef2f7",
                border: "1px solid #e2e8f0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 12,
              }}
            >
              {token.slice(1, -1)}
            </Box>
          );
        }

        if (/^\*\*[^*]+\*\*$/.test(token)) {
          return (
            <Box key={`${keyPrefix}-bold-${index}`} component="span" sx={{ fontWeight: 800 }}>
              {token.slice(2, -2)}
            </Box>
          );
        }

        if (/^\*[^*]+\*$/.test(token)) {
          return (
            <Box key={`${keyPrefix}-italic-${index}`} component="span" sx={{ fontStyle: "italic" }}>
              {token.slice(1, -1)}
            </Box>
          );
        }

        if (/^~~[^~]+~~$/.test(token)) {
          return (
            <Box key={`${keyPrefix}-strike-${index}`} component="span" sx={{ textDecoration: "line-through" }}>
              {token.slice(2, -2)}
            </Box>
          );
        }

        if (/^==[^=]+==$/.test(token)) {
          return (
            <Box key={`${keyPrefix}-highlight-${index}`} component="span" sx={{ px: 0.45, borderRadius: 0.7, bgcolor: "#fef08a" }}>
              {token.slice(2, -2)}
            </Box>
          );
        }

        const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
        if (linkMatch) {
          return (
            <Box key={`${keyPrefix}-link-${index}`} component="span" sx={{ color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}>
              {linkMatch[1]}
            </Box>
          );
        }

        return <Fragment key={`${keyPrefix}-text-${index}`}>{token}</Fragment>;
      });
    }

    let content = message.content;
    const priorityMatch = content.match(/^\[(IMPORTANT|URGENT)\]\s*/i);
    const priority = priorityMatch ? priorityMatch[1].toUpperCase() : null;
    if (priorityMatch) {
      content = content.slice(priorityMatch[0].length);
    }

    const trimmedContent = content.trim();
    if (!priority && singleEmojiPattern.test(trimmedContent)) {
      return (
        <Typography
          component="div"
          sx={{
            fontSize: 42,
            lineHeight: 1.1,
            letterSpacing: 0,
          }}
        >
          {trimmedContent}
        </Typography>
      );
    }

    const blocks = content.split(/```([\s\S]*?)```/g);

    return (
      <Stack spacing={0.75}>
        {priority ? (
          <Box
            sx={{
              width: "fit-content",
              px: 0.8,
              py: 0.25,
              borderRadius: 1,
              fontSize: 10,
              fontWeight: 800,
              bgcolor: priority === "IMPORTANT" ? "#fef3c7" : "#fee2e2",
              color: priority === "IMPORTANT" ? "#b45309" : "#b91c1c",
            }}
          >
            {priority}
          </Box>
        ) : null}

        {blocks.map((block, blockIndex) => {
          if (blockIndex % 2 === 1) {
            return (
              <Box
                key={`${message.id}-code-${blockIndex}`}
                component="pre"
                sx={{
                  m: 0,
                  p: 1.2,
                  borderRadius: 1.3,
                  bgcolor: "#0f172a",
                  color: "#e2e8f0",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 12,
                  overflowX: "auto",
                }}
              >
                {block.trim()}
              </Box>
            );
          }

          const lines = block.split("\n");
          return (
            <Stack key={`${message.id}-block-${blockIndex}`} spacing={0.35}>
              {lines.map((line, lineIndex) => {
                const lineKey = `${message.id}-line-${blockIndex}-${lineIndex}`;

                if (!line.trim()) {
                  return <Box key={lineKey} sx={{ height: 6 }} />;
                }

                if (/^\s*>\s?/.test(line)) {
                  return (
                    <Box key={lineKey} sx={{ pl: 1, borderLeft: "3px solid #cbd5e1", color: "#475569", fontStyle: "italic" }}>
                      {renderInlineMarkdown(line.replace(/^\s*>\s?/, ""), `${lineKey}-quote`)}
                    </Box>
                  );
                }

                if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
                  return (
                    <Typography key={lineKey} component="div" sx={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
                      {renderInlineMarkdown(line, `${lineKey}-list`)}
                    </Typography>
                  );
                }

                return (
                  <Typography key={lineKey} component="div" sx={{ fontSize: 14, lineHeight: 1.65, color: "#374151" }}>
                    {renderInlineMarkdown(line, `${lineKey}-plain`)}
                  </Typography>
                );
              })}
            </Stack>
          );
        })}
      </Stack>
    );
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
    <Box className="bg-[#f9fafb] text-gray-900 h-full flex flex-col overflow-hidden">
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ConnectSidebarNavigation
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
          quickViewsOpen={quickViewsOpen}
          favouritesOpen={favouritesOpen}
          chatsOpen={chatsOpen}
          teamsOpen={teamsOpen}
          onToggleQuickViews={() => setQuickViewsOpen((prev) => !prev)}
          onToggleFavourites={() => setFavouritesOpen((prev) => !prev)}
          onToggleChats={() => setChatsOpen((prev) => !prev)}
          onToggleTeams={() => setTeamsOpen((prev) => !prev)}
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
            renderMessageContent={(message) => renderMessageContent(message as ConnectMessage)}
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
                  onChange={setMentionComposerMessage}
                  onSend={(payload) => {
                    handleSendMessageToConversation(selectedMention.conversationId, payload);
                    setMentionComposerMessage("");
                    setQuotedMessage(null);
                  }}
                  onClearQuotedMessage={() => setQuotedMessage(null)}
                  onAttachFiles={(files) => handleAttachFilesToConversation(selectedMention.conversationId, files)}
                />
              ) : null
            }
          />
        ) : (
        <ConnectConversationWindow
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
          messages={selectedMessages as ConnectConversationWindowMessage[]}
          activeMessageMenuId={activeMessageId}
          activeMessageEmojiId={activeMessageForEmoji}
          getQuotedMessageById={(id) => (messagesByConversation[selectedConversation.id] ?? []).find((message) => message.id === id) as ConnectConversationWindowMessage | undefined}
          renderMessageContent={(message) => renderMessageContent(message as ConnectMessage)}
          onOpenDetails={() => setShowDetails(true)}
          onOpenParticipantsMenu={(event) => setParticipantsAnchor(event.currentTarget)}
          onAddReaction={(messageId, emoji) => addReactionToMessage(selectedConversation.id, messageId, emoji)}
          onOpenMessageEmoji={openMessageEmojiMenu}
          onOpenMessageMenu={openMessageMenu}
          onQuoteMessage={(message) => setQuotedMessage(message as ConnectMessage)}
          onOpenReactionHover={openReactionHover}
          onCloseReactionHover={scheduleReactionHoverClose}
          onOpenUserHover={openMentionHover}
          onCloseUserHover={scheduleMentionHoverClose}
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
            onChange={setComposerMessage}
            onSend={handleSendMessage}
            onClearQuotedMessage={() => setQuotedMessage(null)}
            onAttachFiles={handleAttachFiles}
          />
        </ConnectConversationWindow>
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
        items={messageMenuItems.map((item) => ({ ...item, onClick: () => {
        if (item.id === "copy-link" && activeMessageId) {
          const link = `${window.location.origin}${window.location.pathname}?message=${activeMessageId}`;
          void navigator.clipboard.writeText(link);
        }
      } }))} />

      <Popover open={Boolean(messageEmojiAnchor) && Boolean(activeMessageForEmoji)} anchorEl={messageEmojiAnchor} onClose={() => { setMessageEmojiAnchor(null); setActiveMessageForEmoji(null); }} disableScrollLock anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
        <EmojiPicker
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

      <Popover open={Boolean(participantsAnchor)} anchorEl={participantsAnchor} onClose={() => { setParticipantsAnchor(null); setParticipantSearch(""); }} disableScrollLock anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }}>
        <Box sx={{ width: 340, p: 1.5 }}>
          <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>Participants</Typography>
          <TextField fullWidth size="small" placeholder="Search user to add" value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} />

          <Typography sx={{ mt: 1.25, mb: 0.6, fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>In this conversation</Typography>
          <Stack spacing={0.4} sx={{ maxHeight: 160, overflowY: "auto" }}>
            {participants.map((user) => (
              <Stack key={user.id} direction="row" spacing={1} sx={{ px: 0.5, py: 0.6, alignItems: "center", justifyContent: "space-between" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Avatar src={user.avatar} sx={{ width: 24, height: 24 }} />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user.displayName}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{user.jobTitle}</Typography>
                  </Box>
                </Stack>
                {user.id !== currentUser.id ? (
                  <IconButton size="small" onClick={() => handleRemoveParticipant(user.id)}><PersonRemoveRounded sx={{ fontSize: 16 }} /></IconButton>
                ) : null}
              </Stack>
            ))}
          </Stack>

          <Typography sx={{ mt: 1.2, mb: 0.6, fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>Add more users</Typography>
          <Stack spacing={0.4} sx={{ maxHeight: 160, overflowY: "auto" }}>
            {addableUsers.map((user) => (
              <Stack key={user.id} direction="row" spacing={1} onClick={() => handleAddParticipant(user.id)} sx={{ px: 0.5, py: 0.6, alignItems: "center", justifyContent: "space-between", cursor: "pointer", '&:hover': { bgcolor: "#f9fafb" } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Avatar src={user.avatar} sx={{ width: 24, height: 24 }} />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user.displayName}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{user.jobTitle}</Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={() => handleAddParticipant(user.id)}><Add sx={{ fontSize: 16 }} /></IconButton>
              </Stack>
            ))}
          </Stack>
        </Box>
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

      <Dialog open={createSectionOpen} onClose={() => setCreateSectionOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create a new section</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Emoji" placeholder="✨" value={sectionEmoji} onChange={(event) => setSectionEmoji(event.target.value)} />
            <TextField label="Section name" placeholder="Type a section name" value={sectionName} onChange={(event) => setSectionName(event.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSectionOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              pushSystemMessage(`Created section ${sectionEmoji ? `${sectionEmoji} ` : ""}${sectionName || "Untitled"}.`);
              setCreateSectionOpen(false);
              setSectionEmoji("");
              setSectionName("");
              closeSidebarMenus();
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createChannelOpen} onClose={() => setCreateChannelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Channel</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Channel name" value={channelName} onChange={(event) => setChannelName(event.target.value)} required />
            <TextField label="Description" value={channelDescription} onChange={(event) => setChannelDescription(event.target.value)} multiline minRows={3} />
            <Box>
              <InputLabel id="connect-channel-type-label" sx={{ mb: 0.75, position: "static", transform: "none", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                Choose a channel type
              </InputLabel>
              <Select labelId="connect-channel-type-label" fullWidth value={channelType} onChange={(event) => setChannelType(event.target.value)}>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="announcement">Announcement</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>Layouts</Typography>
              <RadioGroup row value={channelLayout} onChange={(event) => setChannelLayout(event.target.value)}>
                <FormControlLabel value="threads" control={<Radio />} label="Threads" />
                <FormControlLabel value="posts" control={<Radio />} label="Posts" />
              </RadioGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateChannelOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!channelName.trim()}
            onClick={() => {
              pushSystemMessage(`Created channel ${channelName.trim()} with ${channelLayout} layout.`);
              setCreateChannelOpen(false);
              setChannelName("");
              setChannelDescription("");
              setChannelType("standard");
              setChannelLayout("threads");
              closeSidebarMenus();
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createTeamOpen} onClose={() => setCreateTeamOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Team</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Team name" value={teamName} onChange={(event) => setTeamName(event.target.value)} required />
            <TextField label="Description" value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} multiline minRows={3} />
            <Box>
              <InputLabel id="connect-team-type-label" sx={{ mb: 0.75, position: "static", transform: "none", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                Team type
              </InputLabel>
              <Select labelId="connect-team-type-label" fullWidth value={teamVisibility} onChange={(event) => setTeamVisibility(event.target.value)}>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </Box>
            <TextField label="First Channel name" value={teamFirstChannelName} onChange={(event) => setTeamFirstChannelName(event.target.value)} required />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTeamOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!teamName.trim() || !teamFirstChannelName.trim()}
            onClick={() => {
              pushSystemMessage(`Created ${teamVisibility} team ${teamName.trim()} with first channel ${teamFirstChannelName.trim()}.`);
              setCreateTeamOpen(false);
              setTeamName("");
              setTeamDescription("");
              setTeamVisibility("public");
              setTeamFirstChannelName("");
              closeSidebarMenus();
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
