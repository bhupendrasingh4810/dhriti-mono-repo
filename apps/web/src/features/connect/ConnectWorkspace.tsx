"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ConnectConversation,
  ConnectMessage,
  ConnectFile,
  ConnectMeeting,
  ConnectMentionFeedItem,
} from "@/mocks/connect/types";
import { useConnect } from "@/hooks/use-connect";
import { useMessageDeletion } from "@/features/connect/hooks/use-message-deletion";
import { connectService } from "@/services/connect.service";
import {
  Archive,
  AtSign,
  Eye,
  Flag,
  Forward,
  Languages,
  Link,
  List,
  Mail,
  Palette,
  Phone,
  Pin,
  Trash2,
  Video,
} from "lucide-react";
import ConnectSidebar from "@/features/connect/components/ConnectSidebar";
import { getMenuItems, type SectionViewModeState } from "@/utils/connect-menu-item.util";
import { CreateChannelDialog } from "@/components/dialogs/create-channel.dialog";
import { CreateTeamDialog } from "@/components/dialogs/create-team.dialog";
import { AddTeamMembersDialog, ManageTeamDialog } from "@/components/dialogs/manage-team.dialog";
import { CreateSectionDialog } from "@/components/dialogs/create-section.dialog";
import { ConnectConversations } from "@/features/connect/components/ConnectConversations";
import { ConnectPostsView } from "@/features/connect/components/ConnectPostsView";
import { ConversationHeader } from "@/features/connect/components/ConversationHeader";
import { ConnectCascadingMenuItem } from "@/types/menu.types";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { Dialog } from "@dhriti/ui/dialog";
import {
  ConnectConversationMessage,
  ConnectPendingAttachment,
  ConnectSidebarConversation,
  ConnectSidebarMenuContext,
  ConnectSidebarTeamGroup,
} from "@/types/connect.types";
import ConnectMessageInput from "@/features/connect/components/ConnectMessageInput";
import { ConnectMentionsView } from "@/features/connect/components/ConnectMentionsView";
import { ConnectChannelDetailsPanel } from "@/features/connect/components/ConnectChannelDetailsPanel";
import { DeletedMessageToast, MessageOverlays } from "@/features/connect/components/MessageOverlays";
import { ConnectUserDetailDialog } from "@/features/connect/components/ConnectUserDetailDialog";
import { getUserInitials } from "@/features/connect/utils/user-initials";
import type { ConnectMentionsFilter, MentionHoverState, ReactionHoverState } from "@/types/connect.types";
import { useWorkspaceCall } from "@/features/connect/components/WorkspaceCallProvider";
import {
  useAppSettingsState,
  useConnectUserSettingsState,
  useSettingsAccess,
} from "@/features/settings/use-app-settings";
import { canDeleteOwnMessage, canEditOwnMessage } from "@/features/connect/utils/message-policy";
import { useConnectSearch, type ConnectSearchUser } from "@/contexts/connect-search-context";

const quickViewsConfig = [
  { icon: AtSign, label: "Mentions" },
  { icon: List, label: "Threads" },
  { icon: Mail, label: "Drafts" },
];

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

function ConnectSkeletonBlock({
  className,
  tone = "light",
}: {
  className: string;
  tone?: "brand" | "light";
}) {
  const background =
    tone === "brand"
      ? "linear-gradient(90deg, var(--app-color-on-brand-hover) 0%, var(--app-color-on-brand-border) 50%, var(--app-color-on-brand-hover) 100%)"
      : "linear-gradient(90deg, var(--app-color-surface-raised) 0%, var(--app-color-border) 50%, var(--app-color-surface-raised) 100%)";

  return (
    <span
      aria-hidden="true"
      className={`${className} shrink-0`}
      style={{ background, backgroundSize: "200% 100%", animation: "shimmer 1.6s infinite" }}
    />
  );
}

function ConnectWorkspaceLoadingShell() {
  return (
    <div aria-busy="true" aria-label="Loading Connect" className="flex h-full flex-col overflow-hidden bg-slate-50 p-4 text-slate-900">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="mr-2 hidden w-[312px] shrink-0 flex-col rounded-[20px] bg-brand p-4 lg:flex">
          <div className="flex items-center justify-between">
            <ConnectSkeletonBlock className="h-4 w-18 rounded-md" tone="brand" />
            <ConnectSkeletonBlock className="size-5 rounded-full" tone="brand" />
          </div>
          <ConnectSidebarSkeletonSection headingWidth="w-22" rowWidths={["w-28", "w-24", "w-20"]} />
          <ConnectSidebarSkeletonSection headingWidth="w-18" rowWidths={["w-32", "w-26"]} />
          <ConnectSidebarSkeletonSection headingWidth="w-16" rowWidths={["w-36", "w-28", "w-32", "w-24"]} />
          <ConnectSidebarSkeletonSection headingWidth="w-28" rowWidths={["w-30", "w-20"]} />
        </aside>
        <section className="ml-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm shadow-brand/15">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
            <div className="flex items-center gap-3">
              <ConnectSkeletonBlock className="size-8 rounded-full" />
              <ConnectSkeletonBlock className="h-4 w-28 rounded-md" />
            </div>
            <div className="flex gap-3">
              <ConnectSkeletonBlock className="size-5 rounded-full" />
              <ConnectSkeletonBlock className="size-5 rounded-full" />
              <ConnectSkeletonBlock className="size-5 rounded-full" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-5 overflow-hidden p-6">
            {[["w-34", "w-48"], ["w-42", "w-24"], ["w-28", "w-36"], ["w-38", "w-20"], ["w-30", "w-44"]].map(
              ([nameWidth, messageWidth], index) => (
                <div key={index} className="flex items-start gap-3">
                  <ConnectSkeletonBlock className="size-9 rounded-full" />
                  <div className="space-y-2">
                    <ConnectSkeletonBlock className={`h-3 ${nameWidth} rounded`} />
                    <ConnectSkeletonBlock className={`h-10 ${messageWidth} rounded-lg`} />
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="border-t border-border p-4">
            <ConnectSkeletonBlock className="h-24 w-full rounded-xl" />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-3">
                <ConnectSkeletonBlock className="size-5 rounded-full" />
                <ConnectSkeletonBlock className="size-5 rounded-full" />
                <ConnectSkeletonBlock className="size-5 rounded-full" />
              </div>
              <ConnectSkeletonBlock className="h-8 w-16 rounded-md" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ConnectSidebarSkeletonSection({
  headingWidth,
  rowWidths,
}: {
  headingWidth: string;
  rowWidths: string[];
}) {
  return (
    <section className="mt-7">
      <ConnectSkeletonBlock className={`h-3 ${headingWidth} rounded`} tone="brand" />
      <div className="mt-3 space-y-2">
        {rowWidths.map((width, index) => (
          <div key={`${width}-${index}`} className="flex items-center gap-3">
            <ConnectSkeletonBlock className="size-7 rounded-full" tone="brand" />
            <ConnectSkeletonBlock className={`h-3 ${width} rounded`} tone="brand" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ConnectWorkspace() {
  const { startCall } = useWorkspaceCall();
  const { registerUserSelection } = useConnectSearch();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get("conversation");
  const [selectedConversationId, setSelectedConversationId] = useState(() => conversationIdFromUrl ?? "");
  const [hiddenTransientConversationIds, setHiddenTransientConversationIds] = useState<Set<string>>(() => new Set());
  const [transientConversationIds, setTransientConversationIds] = useState<Set<string>>(() => new Set());
  const [searchSelectedConversationIds, setSearchSelectedConversationIds] = useState<string[]>([]);
  const live = useConnect(selectedConversationId);
  const [previousConversations, setPreviousConversations] = useState(live.conversations);
  if (live.conversations !== previousConversations) {
    setPreviousConversations(live.conversations);
    if (!conversationIdFromUrl && (!selectedConversationId || !live.conversations[selectedConversationId])) {
      setSelectedConversationId(Object.keys(live.conversations)[0] ?? "");
    }
  }
  const connectUsersById = live.users;
  const connectUsers = Object.values(live.users);
  const connectTeams = live.teams;
  const connectTeamsById = Object.fromEntries(connectTeams.map((team) => [team.id, team]));
  const conversationsById = live.conversations;
  const connectConversations = Object.values(conversationsById);
  const messagesByConversation = live.messages;
  const connectSidebarState = {
    ...live.sidebar,
    currentUser: live.user?.id ?? "",
    unread: live.unread,
    mentions: {} as Record<string, number>,
  };
  const connectChannels = connectConversations
    .filter((conversation) => conversation.type === "channel")
    .map((conversation) => ({
      ...conversation,
      slug: conversation.name,
      isArchived: conversation.archived,
      visibility: "team",
    }));
  const connectFiles: ConnectFile[] = [];
  const connectMeetings: ConnectMeeting[] = [];
  const connectReportsToByUserId: Record<string, string> = {};
  const connectMentionFeed: ConnectMentionFeedItem[] = [];
  const [showDetails, setShowDetails] = useState(false);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [composerMessage, setComposerMessage] = useState("");
  const [mentionComposerMessage, setMentionComposerMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ConnectPendingAttachment[]>([]);
  const [mentionPendingAttachments, setMentionPendingAttachments] = useState<ConnectPendingAttachment[]>([]);

  const [activeQuickViewId, setActiveQuickViewId] = useState<string | null>(null);
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({ team_001: true });
  const persistedSectionViewMode: SectionViewModeState = {
    favorites: live.sidebar.settings.favoritesFilter ?? "all",
    chats: live.sidebar.settings.chatsFilter ?? "all",
    mentions: live.sidebar.settings.mentions ?? "always",
    threads: live.sidebar.settings.threads ?? "always",
    drafts: live.sidebar.settings.drafts ?? "visible",
  };
  const [sectionViewModeOverride, setSectionViewModeOverride] = useState<SectionViewModeState | null>(null);
  const sectionViewMode = sectionViewModeOverride ?? persistedSectionViewMode;
  const setSectionViewMode: React.Dispatch<React.SetStateAction<SectionViewModeState>> = (update) => {
    setSectionViewModeOverride((previous) => {
      const current = previous ?? persistedSectionViewMode;
      return typeof update === "function" ? update(current) : update;
    });
  };
  const [quotedMessage, setQuotedMessage] = useState<ConnectMessage | null>(null);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [createChannelTeamId, setCreateChannelTeamId] = useState<string | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [addTeamMembersTeamId, setAddTeamMembersTeamId] = useState<string | null>(null);
  const [manageTeamId, setManageTeamId] = useState<string | null>(null);
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [exitGroupId, setExitGroupId] = useState<string | null>(null);
  const [newGroupAdminId, setNewGroupAdminId] = useState("");
  const [mentionsFilter, setMentionsFilter] = useState<ConnectMentionsFilter>("unread");
  const [selectedMentionId, setSelectedMentionId] = useState<string | null>(null);
  const [mentionHover, setMentionHover] = useState<MentionHoverState | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
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
  const connectSettingsState = useAppSettingsState("connect");
  const connectUserSettingsState = useConnectUserSettingsState();
  const connectPolicy = connectSettingsState.data;
  const settingsAccess = useSettingsAccess();
  const selectedConversation = conversationsById[selectedConversationId] ?? connectConversations[0];
  const canPinInConversation =
    selectedConversation?.type !== "channel" ||
    connectPolicy?.pinPolicy === "EVERYONE" ||
    Boolean(currentUser && selectedConversation.adminUserIds?.includes(currentUser.id)) ||
    settingsAccess.canManage === true;
  const selectedTeam = selectedConversation?.teamId ? connectTeamsById[selectedConversation.teamId] : null;
  useEffect(() => {
    if (
      !conversationIdFromUrl ||
      live.loading ||
      Object.keys(conversationsById).length === 0 ||
      conversationsById[conversationIdFromUrl]
    ) return;
    setSelectedConversationId("");
    router.replace(pathname, { scroll: false });
  }, [conversationIdFromUrl, conversationsById, live.loading, pathname, router]);
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

  const selectedMessages = (() => {
    const current = messagesByConversation[selectedConversation?.id] ?? [];
    const recipientId =
      selectedConversation?.type === "direct"
        ? selectedConversation.participants.find((userId) => userId !== live.user?.id)
        : undefined;
    const readAt = recipientId ? live.readReceipts[selectedConversation.id]?.[recipientId] : null;
    return current
      .map((message): ConnectMessage => ({
        ...message,
        status:
          message.senderId === live.user?.id && readAt && Date.parse(readAt) >= Date.parse(message.createdAt)
            ? "read"
            : message.status,
      }))
      .sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));
  })();

  const conversationFiles = useMemo(
    () => connectFiles.filter((file) => file.conversationId === selectedConversation?.id),
    [selectedConversation],
  );

  const pinnedCount = useMemo(
    () => live.historyState[selectedConversation?.id ?? ""]?.pinnedCount ?? selectedMessages.filter((message) => message.isPinned).length,
    [live.historyState, selectedConversation, selectedMessages],
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
        icon: team.name === "Design" ? Palette : Archive,
        isExpanded: expandedTeamIds[team.id] ?? false,
        channels: connectChannels
          .filter((channel) => channel.teamId === team.id && !channel.isArchived)
          .map((channel) => ({
            id: channel.id,
            name: channel.name,
            slug: channel.slug,
            avatar: channel.avatar,
            isPrivate: channel.visibility === "private",
          })),
      })),
    [expandedTeamIds, live.teams, live.conversations],
  );

  const sidebarQuickViews = useMemo(
    () =>
      quickViewsConfig
        .map((item) => ({
          id: item.label.toLowerCase() as "mentions" | "threads" | "drafts",
          icon: item.icon,
          label: item.label,
          value: item.label === "Mentions" ? mentionTotal : item.label === "Threads" ? threadCount : draftCount,
        }))
        .filter((item) => {
          if (item.id === "drafts") return sectionViewMode.drafts === "visible";
          return sectionViewMode[item.id] === "always" || item.value > 0;
        }),
    [draftCount, mentionTotal, sectionViewMode.drafts, sectionViewMode.mentions, sectionViewMode.threads, threadCount],
  );

  const visibleChatConversations = useMemo(() => {
    const favoriteChatIds = new Set(connectSidebarState.favorites.chats);
    const merged = recentConversations
      .concat(chatConversations)
      .filter((conversation) => conversation.type === "direct" || conversation.type === "group")
      .filter((conversation) => !favoriteChatIds.has(conversation.id))
      .filter((conversation) => !hiddenTransientConversationIds.has(conversation.id))
      .filter((conversation, index, all) => all.findIndex((item) => item.id === conversation.id) === index);

    const ordered = [...merged].sort((first, second) => {
      const firstIndex = searchSelectedConversationIds.indexOf(first.id);
      const secondIndex = searchSelectedConversationIds.indexOf(second.id);
      return (firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex) - (secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex);
    });
    return sectionViewMode.chats === "unread"
      ? ordered.filter((conversation) => (connectSidebarState.unread[conversation.id] ?? conversation.unreadCount) > 0)
      : ordered;
  }, [chatConversations, hiddenTransientConversationIds, recentConversations, searchSelectedConversationIds, sectionViewMode.chats, live.unread]);

  const sidebarChatRows: ConnectSidebarConversation[] = visibleChatConversations.map((conversation) => ({
    id: conversation.id,
    name: conversation.name,
    type: conversation.type,
    avatar: conversation.avatar,
    userId:
      conversation.type === "direct"
        ? conversation.participants.find((participantId) => participantId !== currentUser.id)
        : undefined,
    presence:
      conversation.type === "direct"
        ? connectUsersById[conversation.participants.find((participantId) => participantId !== currentUser.id) ?? ""]?.presence
        : undefined,
    unreadCount: live.unread[conversation.id] ?? conversation.unreadCount,
  }));

  useEffect(() => {
    return registerUserSelection((user: ConnectSearchUser) => {
      const previousConversationId = selectedConversationId;
      const previousMessages = messagesByConversation[previousConversationId] ?? [];
      const shouldHidePrevious =
        transientConversationIds.has(previousConversationId) &&
        previousMessages.length === 0 &&
        !composerMessage.trim();

      if (shouldHidePrevious) {
        setHiddenTransientConversationIds((previous) => new Set(previous).add(previousConversationId));
        setSearchSelectedConversationIds((previous) => previous.filter((id) => id !== previousConversationId));
        void live
          .updateSidebarSettings({
            hiddenConversationIds: [...(live.sidebar.settings.hiddenConversationIds ?? []), previousConversationId],
          })
          .catch(live.reportError);
      }

      const existingConversation = Object.values(conversationsById).find(
        (conversation) => conversation.type === "direct" && conversation.participants.includes(user.id),
      );

      void live
        .startDirect(user.id)
        .then((conversationId) => {
          if (!conversationId) return;
          if (!existingConversation) {
            setTransientConversationIds((previous) => new Set(previous).add(conversationId));
          }
          setHiddenTransientConversationIds((previous) => {
            const next = new Set(previous);
            next.delete(conversationId);
            return next;
          });
          setSearchSelectedConversationIds((previous) => [conversationId, ...previous.filter((id) => id !== conversationId)]);
          handleSelectConversation(conversationId);
        })
        .catch(live.reportError);
    });
  }, [
    composerMessage,
    conversationsById,
    live.reportError,
    live.startDirect,
    messagesByConversation,
    registerUserSelection,
    selectedConversationId,
    transientConversationIds,
  ]);

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
      { id: "unfollow-thread", label: "Unfollow thread", icon: <Eye /> },
      { id: "mark-unread", label: "Mark as unread", icon: <Mail /> },
      { id: "copy-link", label: "Copy link", icon: <Link /> },
    ];
  }, [activeMentionMenuId, selectedMention]);

  const mentionCallMenuItems: ConnectCascadingMenuItem[] = [
    { id: "video-call", label: "Video Call", icon: <Video /> },
    { id: "audio-call", label: "Audio Call", icon: <Phone /> },
  ];

  const sidebarMenuItems: ConnectCascadingMenuItem[] = getMenuItems(
    sidebarMenuContext,
    sectionViewMode,
    setSectionViewMode,
    setCreateSectionOpen,
    setCreateTeamOpen,
    openCreateChannel,
    pushSystemMessage,
    (settings) => {
      void live
        .updateSidebarSettings(settings)
        .then(() => setSectionViewModeOverride(null))
        .catch((reason) => {
          setSectionViewModeOverride(null);
          live.reportError(reason);
        });
    },
    sidebarMenuContext?.kind === "team" && sidebarMenuContext.id
      ? {
          canLeave: Boolean(connectTeamsById[sidebarMenuContext.id]?.users.includes(live.user?.id ?? "")),
          onAddMember: () => setAddTeamMembersTeamId(sidebarMenuContext.id),
          onManageTeam: () => setManageTeamId(sidebarMenuContext.id),
          onLeaveTeam: () => {
            void connectService
              .leaveTeam(live.organizationId, sidebarMenuContext.id)
              .then(() => live.refresh())
              .catch(live.reportError);
          },
        }
      : undefined,
    sidebarMenuContext?.kind === "channel" && sidebarMenuContext.id
      ? {
          canDelete: Boolean(conversationsById[sidebarMenuContext.id]?.adminUserIds?.includes(live.user?.id ?? "")),
          onDelete: () => {
            setDeleteChannelId(sidebarMenuContext.id);
            closeSidebarMenus();
          },
        }
      : undefined,
  );
  if (sidebarMenuContext?.kind === "user" && conversationsById[sidebarMenuContext.id]?.type === "group") {
    const removeHistoryIndex = sidebarMenuItems.findIndex((item) => item.id === "remove-history");
    if (removeHistoryIndex !== -1) sidebarMenuItems.splice(removeHistoryIndex, 1);
  }
  if (sidebarMenuContext?.id && ["user", "channel"].includes(sidebarMenuContext.kind)) {
    const itemId = sidebarMenuContext.id;
    const itemType = sidebarMenuContext.kind === "channel" ? "channel" : "chat";
    const ids = itemType === "channel" ? live.sidebar.favorites.channels : live.sidebar.favorites.chats;
    const isFavorite = ids.includes(itemId);
    sidebarMenuItems.unshift({
      id: "toggle-favorite",
      label: isFavorite ? "Remove from favorites" : "Add to favorites",
      icon: <Pin />,
      onClick: () => {
        void live.favorite(itemType, itemId, !isFavorite).catch(live.reportError);
        closeSidebarMenus();
      },
    });
  }
  if (
    sidebarMenuContext?.kind === "user" &&
    sidebarMenuContext.id &&
    conversationsById[sidebarMenuContext.id]?.type === "group" &&
    conversationsById[sidebarMenuContext.id]?.createdBy === currentUser?.id
  ) {
    sidebarMenuItems.push({
      id: "delete-group",
      label: "Delete group",
      icon: <Trash2 />,
      danger: true,
      dividerAbove: true,
      onClick: () => {
        setDeleteChannelId(sidebarMenuContext.id);
        closeSidebarMenus();
      },
    });
  }
  if (sidebarMenuContext?.kind === "user" && sidebarMenuContext.id) {
    const conversationId = sidebarMenuContext.id;
    const latestMessage = (messagesByConversation[conversationId] ?? []).reduce<ConnectMessage | undefined>(
      (latest, message) => (!latest || Date.parse(message.createdAt) > Date.parse(latest.createdAt) ? message : latest),
      undefined,
    );
    const userMenuActions: Record<string, () => void> = {
      "mark-read": () => {
        void connectService
          .markMessagesRead(live.organizationId, conversationId, latestMessage?.id)
          .then(() => live.refresh())
          .catch(live.reportError);
        closeSidebarMenus();
      },
      mute: () => {
        void connectService
          .updateConversationNotifications(live.organizationId, conversationId, { muted: true })
          .catch(live.reportError);
        closeSidebarMenus();
      },
      notify: () => {
        void connectService
          .updateConversationNotifications(live.organizationId, conversationId, { notifyWhenAvailable: true })
          .catch(live.reportError);
        closeSidebarMenus();
      },
      "remove-history": () => {
        void connectService
          .removeConversationHistory(live.organizationId, conversationId)
          .then(() => {
            if (selectedConversationId === conversationId) {
              const nextConversationId = Object.keys(conversationsById).find((id) => id !== conversationId);
              if (nextConversationId) handleSelectConversation(nextConversationId);
              else {
                setSelectedConversationId("");
                const nextSearchParams = new URLSearchParams(searchParams.toString());
                nextSearchParams.delete("conversation");
                router.replace(nextSearchParams.size ? `${pathname}?${nextSearchParams.toString()}` : pathname, {
                  scroll: false,
                });
              }
            }
            return live.refresh();
          })
          .catch(live.reportError);
        closeSidebarMenus();
      },
    };
    for (const item of sidebarMenuItems) {
      const action = userMenuActions[item.id];
      if (action) item.onClick = action;
    }
  }

  const activeMenuMessage = activeMessageId
    ? selectedMessages.find((message) => message.id === activeMessageId)
    : undefined;
  const isOwnActiveMessage = Boolean(activeMenuMessage && activeMenuMessage.senderId === currentUser?.id);
  const canEditActiveMessage =
    isOwnActiveMessage && canEditOwnMessage(connectPolicy, activeMenuMessage?.createdAt ?? "");
  const canDeleteActiveMessage =
    isOwnActiveMessage && canDeleteOwnMessage(connectPolicy, activeMenuMessage?.createdAt ?? "");

  const messageMenuItems: ConnectCascadingMenuItem[] = [
    ...(canEditActiveMessage ? [{ id: "edit", label: "Edit Message", icon: <Link /> }] : []),
    { id: "forward", label: "Forward", icon: <Forward /> },
    { id: "copy-link", label: "Copy Link", icon: <Link /> },
    ...(canPinInConversation
      ? [{ id: "pin", label: activeMenuMessage?.isPinned ? "Unpin message" : "Pin message", icon: <Pin /> }]
      : []),
    { id: "save", label: "Save this Message", icon: <Archive /> },
    { id: "mark-unread", label: "Mark as unread", icon: <Mail /> },
    { id: "translate", label: "Translations", icon: <Languages /> },
    ...(canDeleteActiveMessage ? [{ id: "delete", label: "Delete Message", icon: <Trash2 />, danger: true }] : []),
    { id: "report", label: "Report this Message", icon: <Flag />, danger: true },
    { id: "more", label: "More actions", icon: <List /> },
  ];

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set("conversation", conversationId);
    router.replace(`${pathname}?${nextSearchParams.toString()}`, { scroll: false });
    setActiveQuickViewId(null);
    setShowDetails(false);
  }

  async function createGroupConversation(userIds: string[]) {
    try {
      const conversation = await connectService.createGroupConversation(live.organizationId, { userIds });
      await live.refresh();
      handleSelectConversation(conversation.id);
      return true;
    } catch (reason) {
      live.reportError(reason);
      return false;
    }
  }

  async function addGroupMember(userId: string) {
    if (!selectedConversation) return false;
    try {
      await connectService.addMember(live.organizationId, selectedConversation.id, userId);
      await Promise.all([live.refresh(), live.loadMessages(selectedConversation.id, true)]);
      return true;
    } catch (reason) {
      live.reportError(reason);
      return false;
    }
  }

  async function removeGroupMember(userId: string) {
    if (!selectedConversation) return false;
    try {
      await connectService.removeMember(live.organizationId, selectedConversation.id, userId);
      await Promise.all([live.refresh(), live.loadMessages(selectedConversation.id, true)]);
      return true;
    } catch (reason) {
      live.reportError(reason);
      return false;
    }
  }

  async function leaveGroup(newAdminUserId?: string) {
    if (!selectedConversation) return false;
    try {
      await connectService.leaveGroupConversation(live.organizationId, selectedConversation.id, newAdminUserId);
      await live.refresh();
      return true;
    } catch (reason) {
      live.reportError(reason);
      return false;
    }
  }

  function requestLeaveGroup() {
    if (selectedConversation?.type === "group") {
      setNewGroupAdminId("");
      setExitGroupId(selectedConversation.id);
    }
    return Promise.resolve(false);
  }

  async function openDirectConversation(userId: string) {
    const conversationId = await live.startDirect(userId);
    if (!conversationId) return "";
    handleSelectConversation(conversationId);
    return conversationId;
  }

  function handleMessageUser(userId: string) {
    setMentionHover(null);
    void openDirectConversation(userId).catch(live.reportError);
  }

  function handleStartUserCall(userId: string, type: "audio" | "video") {
    const user = connectUsersById[userId];
    if (!currentUser || !user) return;
    setMentionHover(null);
    void openDirectConversation(userId)
      .then((conversationId) => {
        if (!conversationId) return;
        startCall({
          conversationId,
          conversationName: user.displayName,
          participantIds: [currentUser.id, userId],
          callerName: currentUser.displayName,
          type,
          scope: "one-to-one",
        });
      })
      .catch(live.reportError);
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
    }, 1000);
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
    const existing = messagesByConversation[conversationId]
      ?.find((message) => message.id === messageId)
      ?.reactions?.find((reaction) => reaction.emoji === emoji);
    const action = existing?.userIds.includes(currentUser.id)
      ? connectService.removeReaction
      : connectService.addReaction;
    void action(live.organizationId, messageId, emoji)
      .then(() => live.loadMessages(conversationId))
      .catch(live.reportError);
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
    } catch (reason) {
      live.reportError(reason);
    }
  }

  async function handleSendGreeting() {
    if (!selectedConversation) return;
    try {
      await live.send(selectedConversation.id, {
        content: "Hi",
        mentionUserIds: [],
        clientMessageId: crypto.randomUUID(),
      });
    } catch (reason) {
      live.reportError(reason);
    }
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

  function openCreateChannel(teamId: string) {
    setCreateChannelTeamId(teamId);
    setCreateChannelOpen(true);
  }

  function closeCreateChannelDialog() {
    setCreateChannelOpen(false);
    setCreateChannelTeamId(null);
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
    } catch (reason) {
      live.reportError(reason);
    }
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

  if (live.loading || !live.user)
    return <ConnectWorkspaceLoadingShell />;

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
  const isPostsLayout = selectedConversation?.layout === "POSTS";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50 p-4 text-slate-900">
      {live.error ? (
        <div role="alert" className="mb-2 flex items-center justify-between bg-error/10 p-2 text-sm text-error">
          <span>{live.error}</span>
          <button type="button" onClick={() => live.setError("")}>
            Dismiss
          </button>
        </div>
      ) : null}
      {connectSettingsState.error || connectUserSettingsState.error ? (
        <div role="alert" className="mb-2 flex items-center justify-between rounded-md border border-error/20 bg-surface p-2 text-sm text-error">
          <span>
            Connect settings could not be loaded: {connectSettingsState.error ?? connectUserSettingsState.error}
          </span>
          <button
            type="button"
            className="shrink-0 underline"
            onClick={() => {
              connectSettingsState.retry();
              connectUserSettingsState.retry();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}
      {/* <div role="status" className="mb-2 text-xs text-text-secondary">{live.connected ? "Connected" : "Reconnecting"}{(live.typingUsers[selectedConversationId] ?? []).length ? ` · ${(live.typingUsers[selectedConversationId] ?? []).map((id) => connectUsersById[id]?.displayName ?? "Member").join(", ")} typing` : ""}</div> */}
      {/* <div className="mb-2 flex items-center gap-2">
        <button type="button" className="grid h-9 w-9 place-items-center rounded border border-border bg-surface" aria-label="New conversation" title="New conversation" onClick={() => setContactPickerOpen((open) => !open)}><UserPlus size={16} /></button>
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
            favoriteConversations={favoriteConversations.map((conversation) => {
              const hasNoOtherParticipants = conversation.participants.every(
                (participantId) => participantId === currentUser.id,
              );
              const isSelfSpace =
                conversation.id.startsWith("personal_") ||
                (conversation.type === "channel" &&
                  conversation.createdBy === currentUser.id &&
                  !conversation.teamId &&
                  hasNoOtherParticipants);

              return {
                id: conversation.id,
                name: isSelfSpace ? `${currentUser.displayName} (You)` : conversation.name,
                type: conversation.type,
                avatar: isSelfSpace ? currentUser.avatar : conversation.avatar,
                unreadCount: live.unread[conversation.id] ?? 0,
                isSelfSpace,
              };
            })}
            chatConversations={sidebarChatRows}
            teams={sidebarTeams}
            selectedConversationId={selectedConversationId}
            activeQuickViewId={activeQuickViewId}
            onToggleTeam={handleToggleTeam}
            onSelectConversation={handleSelectConversation}
            onSelectUser={(userId) => {
              void live
                .startDirect(userId)
                .then((conversationId) => {
                  if (conversationId) handleSelectConversation(conversationId);
                })
                .catch(live.reportError);
            }}
            onOpenUserHover={openMentionHover}
            onCloseUserHover={scheduleMentionHoverClose}
            onSelectQuickView={handleSelectQuickView}
            onOpenSidebarMenu={openSidebarMenu}
          />
        </div>

        <div className="ml-2 flex min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface shadow-sm shadow-brand/15">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {!selectedConversation || !currentUser ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-text-primary">
                <h2 className="text-base font-semibold">
                  {live.error ? "Unable to load all Connect data" : "No conversations yet"}
                </h2>
                {live.error ? (
                  <button
                    type="button"
                    onClick={() => {
                      void live.refresh()?.catch(live.reportError);
                    }}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
                  >
                    Retry
                  </button>
                ) : null}
                {!live.error && connectUsers.filter((person) => person.id !== live.user?.id).length === 0 ? (
                  <p className="text-sm text-text-secondary">No other active members in this organization.</p>
                ) : null}
                <div className="flex flex-wrap justify-center gap-2">
                  {connectUsers
                    .filter((person) => person.id !== live.user?.id)
                    .map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
                        onClick={() => {
                          void live.startDirect(person.id).then(handleSelectConversation).catch(live.reportError);
                        }}
                      >
                        {person.displayName}
                      </button>
                    ))}
                </div>
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
                  handleSelectConversation(conversationId);
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
            ) : isPostsLayout ? (
              <ConnectPostsView
                organizationId={live.organizationId}
                channelId={selectedConversation.id}
                channelName={selectedConversation.name}
                currentUserId={currentUser.id}
                usersById={connectUsersById}
                renderHeader={(onCreatePost) => (
                  <ConversationHeader
                    conversation={{
                      id: selectedConversation.id,
                      name: selectedConversation.name,
                      type: selectedConversation.type,
                      avatar: selectedConversation.avatar,
                      isFavorite: selectedConversation.isFavorite,
                      participants: selectedConversation.participants,
                    }}
                    currentUserId={currentUser.id}
                    usersById={connectUsersById}
                    onOpenDetails={() => setShowDetails(true)}
                    isChannelAdmin={selectedConversation.adminUserIds?.includes(currentUser.id)}
                    isMuted={selectedConversation.muted}
                    onToggleMute={() => {
                      void connectService
                        .updateConversationNotifications(live.organizationId, selectedConversation.id, {
                          muted: !selectedConversation.muted,
                        })
                        .then(() => live.refresh())
                        .catch(live.reportError);
                    }}
                    onDeleteChannel={() => setDeleteChannelId(selectedConversation.id)}
                    onOpenInNewTab={() => {
                      window.open(
                        `${window.location.origin}${window.location.pathname}?conversation=${selectedConversation.id}`,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    onOpenUserHover={openMentionHover}
                    onCloseUserHover={scheduleMentionHoverClose}
                    onCreateGroup={createGroupConversation}
                    isGroupAdmin={selectedConversation.type === "group" && selectedConversation.createdBy === currentUser.id}
                    onAddGroupMember={addGroupMember}
                    onRemoveGroupMember={removeGroupMember}
                    onLeaveGroup={requestLeaveGroup}
                    onStartCall={(type) =>
                      startCall({
                        conversationId: selectedConversation.id,
                        conversationName: selectedConversation.name,
                        participantIds: selectedConversation.participants,
                        callerName: currentUser.displayName,
                        type,
                        scope: selectedConversation.type === "direct" ? "one-to-one" : selectedConversation.type,
                      })
                    }
                    actions={
                      <button
                        type="button"
                        onClick={onCreatePost}
                        className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                      >
                        Create post
                      </button>
                    }
                  />
                )}
              />
            ) : (
              <ConnectConversations
                key={`${live.organizationId}-${selectedConversation.id}`}
                conversation={{
                  id: selectedConversation.id,
                  name: selectedConversation.name,
                  type: selectedConversation.type,
                  avatar: selectedConversation.avatar,
                  isFavorite: selectedConversation.isFavorite,
                  participants: selectedConversation.participants,
                }}
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
                onLoadMoreMessages={(direction) => {
                  void live.loadMoreMessages(selectedConversation.id, direction);
                }}
                onReadMessage={(messageId) => {
                  void live.markVisibleMessageRead(selectedConversation.id, messageId);
                }}
                onRetryMessages={() => {
                  void live.loadMessages(selectedConversation.id, true).catch(live.reportError);
                }}
                activeMessageMenuId={activeMessageId}
                activeMessageEmojiId={activeMessageForEmoji}
                getQuotedMessageById={(id) =>
                  (messagesByConversation[selectedConversation.id] ?? []).find((message) => message.id === id) as
                    ConnectConversationMessage | undefined
                }
                onOpenDetails={() => setShowDetails(true)}
                canPinMessages={canPinInConversation}
                isChannelAdmin={selectedConversation.adminUserIds?.includes(currentUser.id)}
                isMuted={selectedConversation.muted}
                onToggleMute={() => {
                  void connectService
                    .updateConversationNotifications(live.organizationId, selectedConversation.id, {
                      muted: !selectedConversation.muted,
                    })
                    .then(() => live.refresh())
                    .catch(live.reportError);
                }}
                onDeleteChannel={() => setDeleteChannelId(selectedConversation.id)}
                onOpenInNewTab={() => {
                  window.open(
                    `${window.location.origin}${window.location.pathname}?conversation=${selectedConversation.id}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                onClearPinnedMessages={() => {
                  const pinnedMessageIds = selectedMessages.filter((message) => message.isPinned).map((message) => message.id);
                  void Promise.all(
                    pinnedMessageIds.map((messageId) => live.toggleMessagePin(selectedConversation.id, messageId)),
                  )
                    .catch(live.reportError);
                }}
                onCreateGroup={createGroupConversation}
                isGroupAdmin={selectedConversation.type === "group" && selectedConversation.createdBy === currentUser.id}
                onAddGroupMember={addGroupMember}
                onRemoveGroupMember={removeGroupMember}
                onLeaveGroup={requestLeaveGroup}
                onStartCall={(type) =>
                  startCall({
                    conversationId: selectedConversation.id,
                    conversationName: selectedConversation.name,
                    participantIds: selectedConversation.participants,
                    callerName: currentUser.displayName,
                    type,
                    scope: selectedConversation.type === "direct" ? "one-to-one" : selectedConversation.type,
                  })
                }
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
                onSendGreeting={handleSendGreeting}
                disableHoverActions={Boolean(mentionHover)}
                isReadOnly={selectedConversation.isReadOnly}
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
                  onChange={(value) => {
                    setComposerMessage(value);
                    live.typing(Boolean(value.trim()));
                  }}
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
              teamLabel={selectedTeam?.name ?? getConversationTypeLabel(selectedConversation)}
              description={selectedConversation.description ?? ""}
              imageUrl={selectedConversation.avatar}
              memberCount={selectedConversation.participants.length}
              pinnedCount={pinnedCount}
              linkCount={
                (messagesByConversation[selectedConversation.id] ?? []).filter((message) =>
                  message.content.includes("http"),
                ).length
              }
              files={conversationFiles.map((file) => ({
                id: file.id,
                originalName: file.originalName,
                size: file.size,
              }))}
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

            if (item.id === "pin" && activeMessageId) {
              void live.toggleMessagePin(selectedConversation.id, activeMessageId).catch(live.reportError);
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
      <ConfirmationDialog
        open={Boolean(deleteChannelId)}
        title={conversationsById[deleteChannelId ?? ""]?.type === "group" ? "Delete group" : "Delete channel"}
        description={`This removes the ${conversationsById[deleteChannelId ?? ""]?.type === "group" ? "group" : "channel"} and its content for all members. This action cannot be undone.`}
        cancelLabel="Cancel"
        confirmLabel={conversationsById[deleteChannelId ?? ""]?.type === "group" ? "Delete group" : "Delete channel"}
        confirmColor="error"
        requireDeleteConfirmation
        onCancel={() => setDeleteChannelId(null)}
        onConfirm={() => {
          if (!deleteChannelId) return;
          void connectService
            .deleteChannel(live.organizationId, deleteChannelId)
            .then(() => {
              if (selectedConversationId === deleteChannelId) {
                setSelectedConversationId("");
                router.replace(pathname, { scroll: false });
              }
              return live.refresh();
            })
            .catch(live.reportError)
            .finally(() => setDeleteChannelId(null));
        }}
      />
      <ConfirmationDialog
        open={Boolean(exitGroupId) && conversationsById[exitGroupId ?? ""]?.createdBy !== currentUser?.id}
        title="Exit group"
        description="You will no longer receive new group messages, but can still view the history from before you exited."
        cancelLabel="Cancel"
        confirmLabel="Exit group"
        confirmColor="error"
        requireDeleteConfirmation
        confirmationText="Exit"
        onCancel={() => setExitGroupId(null)}
        onConfirm={() => {
          void leaveGroup().finally(() => setExitGroupId(null));
        }}
      />
      <Dialog
        open={Boolean(exitGroupId) && conversationsById[exitGroupId ?? ""]?.createdBy === currentUser?.id}
        onClose={() => setExitGroupId(null)}
        title="Assign an admin before exiting"
        secondaryActionLabel="Cancel"
        primaryActionLabel="Assign and Exit"
        primaryButtonColor="error"
        primaryActionDisabled={!newGroupAdminId}
        onPrimaryAction={() => {
          void leaveGroup(newGroupAdminId).finally(() => setExitGroupId(null));
        }}
        maxWidth="sm"
      >
        <p className="text-text-secondary">Choose a participant to manage this group after you exit.</p>
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {(conversationsById[exitGroupId ?? ""]?.participants ?? [])
            .filter((userId) => userId !== currentUser?.id)
            .map((userId) => {
              const participant = connectUsersById[userId];
              const selected = newGroupAdminId === userId;
              return (
                <button
                  key={userId}
                  type="button"
                  onClick={() => setNewGroupAdminId(userId)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selected ? "border-brand bg-brand/5" : "border-border bg-surface hover:bg-surface-raised"}`}
                >
                  {participant?.avatar ? (
                    <img src={participant.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-raised text-sm font-bold text-brand">
                      {getUserInitials(participant?.displayName ?? "Unknown user")}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text-primary">{participant?.displayName ?? "Unknown user"}</span>
                    <span className="block truncate text-xs text-text-secondary">{participant?.jobTitle ?? "Group participant"}</span>
                  </span>
                  <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${selected ? "border-brand bg-brand" : "border-border"}`} aria-hidden="true" />
                </button>
              );
            })}
        </div>
      </Dialog>

      <DeletedMessageToast visible={Boolean(deletedMessage)} restoring={undoInProgress} onUndo={undoDeleteMessage} />
      <MessageOverlays
        emojiAnchor={messageEmojiAnchor}
        emojiMessageId={activeMessageForEmoji}
        onCloseEmoji={() => {
          setMessageEmojiAnchor(null);
          setActiveMessageForEmoji(null);
        }}
        onReaction={(messageId, emoji) => addReactionToMessage(selectedConversation.id, messageId, emoji)}
        reactionHover={reactionHover}
        onCloseReaction={scheduleReactionHoverClose}
        onKeepReactionOpen={cancelReactionHoverClose}
        mentionHover={mentionHover}
        onCloseMention={() => setMentionHover(null)}
        usersById={connectUsersById}
        reportsToByUserId={connectReportsToByUserId}
        viewerTimezone={currentUser?.timezone}
        onMessageUser={handleMessageUser}
        onStartUserCall={handleStartUserCall}
        onOpenUserDetails={(userId) => {
          setMentionHover(null);
          setDetailUserId(userId);
        }}
      />

      <ConnectUserDetailDialog
        user={detailUserId ? connectUsersById[detailUserId] ?? null : null}
        usersById={connectUsersById}
        reportsToByUserId={connectReportsToByUserId}
        viewerTimezone={currentUser?.timezone}
        onClose={() => setDetailUserId(null)}
        onMessage={handleMessageUser}
        onStartCall={handleStartUserCall}
        onSelectUser={setDetailUserId}
      />

      <CreateSectionDialog
        createSectionOpen={createSectionOpen}
        setCreateSectionOpen={setCreateSectionOpen}
        pushSystemMessage={pushSystemMessage}
        closeSidebarMenus={closeSidebarMenus}
      />

      <CreateChannelDialog
        open={createChannelOpen}
        onClose={closeCreateChannelDialog}
        pushSystemMessage={pushSystemMessage}
        closeSidebarMenus={closeSidebarMenus}
        organizationId={live.organizationId}
        teamId={createChannelTeamId ?? ""}
        onCreated={() => live.refresh()}
      />

      <CreateTeamDialog
        createTeamOpen={createTeamOpen}
        setCreateTeamOpen={setCreateTeamOpen}
        pushSystemMessage={pushSystemMessage}
        closeSidebarMenus={closeSidebarMenus}
        organizationId={live.organizationId}
        onCreated={() => live.refresh()}
      />

      <AddTeamMembersDialog
        key={addTeamMembersTeamId ?? "add-team-members"}
        open={Boolean(addTeamMembersTeamId)}
        teamId={addTeamMembersTeamId}
        organizationId={live.organizationId}
        onClose={() => setAddTeamMembersTeamId(null)}
        onUpdated={() => live.refresh()}
        onError={live.reportError}
      />

      <ManageTeamDialog
        key={manageTeamId ?? "manage-team"}
        open={Boolean(manageTeamId)}
        teamId={manageTeamId}
        organizationId={live.organizationId}
        onClose={() => setManageTeamId(null)}
        onUpdated={() => live.refresh()}
        onError={live.reportError}
      />
    </div>
  );
}
