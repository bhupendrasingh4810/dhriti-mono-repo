"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";
import {
  connectService,
  type ConnectApiMessage,
  type ConnectSidebarSettings,
  type ConnectSidebarState,
  type CreateMessageInput,
  type MessagePage,
} from "@/services/connect.service";
import { tenantRequest } from "@/services/request.service";
import type { ConnectConversation, ConnectMessage, ConnectUser } from "@/mocks/connect/types";

const emptySidebar: ConnectSidebarState = {
  favorites: { chats: [], teams: [], channels: [] },
  recentChats: [],
  settings: {},
};
type Team = { id: string; name: string; users: string[] };
type Ack = { ok: boolean; error?: { message: string } };
type HistoryState = {
  loading: boolean;
  paging: boolean;
  firstUnreadId: string | null;
  olderCursor: string | null;
  newerCursor: string | null;
  error: string;
};

export function adaptConnectMessage(message: ConnectApiMessage): ConnectMessage {
  const isCallActivity = message.content.startsWith("[CALL] ");
  const grouped = new Map<string, Set<string>>();
  for (const reaction of message.reactions ?? []) {
    const users = grouped.get(reaction.emoji) ?? new Set<string>();
    users.add(reaction.userId);
    grouped.set(reaction.emoji, users);
  }
  return {
    id: message.id,
    conversationId: message.channelId,
    conversationType: "channel",
    senderId: message.authorId,
    content: isCallActivity ? message.content.slice(7) : message.content,
    contentType: isCallActivity ? "system" : "text",
    createdAt: message.createdAt,
    editedAt: message.editedAt,
    status: "sent",
    deletedAt: message.deletedAt,
    isDeleted: message.isDeleted,
    replyCount: message._count?.replies ?? 0,
    mentions: (message.mentions ?? []).map((mention) => mention.userId),
    quotedMessageId: message.parentId ?? undefined,
    reactions: [...grouped].map(([emoji, users]) => ({ emoji, count: users.size, userIds: [...users] })),
  };
}

export function useConnect(selectedConversationId: string) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id ?? "";
  const [users, setUsers] = useState<Record<string, ConnectUser>>({});
  const [conversations, setConversations] = useState<Record<string, ConnectConversation>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [sidebar, setSidebar] = useState(emptySidebar);
  const [messages, setMessages] = useState<Record<string, ConnectMessage[]>>({});
  const [historyState, setHistoryState] = useState<Record<string, HistoryState>>({});
  const [readReceipts, setReadReceipts] = useState<Record<string, Record<string, string | null>>>({});
  const historyRef = useRef(historyState);
  const messagesRef = useRef(messages);
  const receiptsRef = useRef(readReceipts);
  const requestedReads = useRef<Record<string, string>>({});
  const historyRequests = useRef<Record<string, number>>({});
  const paginationRequests = useRef(new Set<string>());
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const typingStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outgoingTyping = useRef<{ channelId: string; sentAt: number } | null>(null);
  const activeChannelRef = useRef(selectedConversationId);
  const generation = useRef(0);
  const reloadRef = useRef<(() => Promise<void>) | null>(null);
  activeChannelRef.current = selectedConversationId;
  historyRef.current = historyState;
  messagesRef.current = messages;
  receiptsRef.current = readReceipts;

  function reportError(reason: unknown) {
    setError(reason instanceof Error ? reason.message : "Connect request failed.");
  }

  function applyReceipts(channelId: string, receipts: MessagePage["readReceipts"]) {
    setReadReceipts((previous) => {
      const next = { ...previous[channelId] };
      for (const receipt of receipts) {
        const existing = next[receipt.userId];
        if (!existing || (receipt.lastReadAt && Date.parse(receipt.lastReadAt) > Date.parse(existing))) {
          next[receipt.userId] = receipt.lastReadAt;
        }
      }
      return { ...previous, [channelId]: next };
    });
  }

  async function loadMessages(channelId: string, initial = false) {
    const current = generation.current;
    const requestId = (historyRequests.current[channelId] ?? 0) + 1;
    historyRequests.current[channelId] = requestId;
    if (initial) {
      setHistoryState((previous) => ({
        ...previous,
        [channelId]: {
          loading: true,
          paging: false,
          firstUnreadId: null,
          olderCursor: null,
          newerCursor: null,
          error: "",
        },
      }));
    }
    try {
      const result = await connectService.listMessages(organizationId, channelId, {
        limit: initial ? 50 : 100,
        ...(initial ? { initial: "unread" as const } : {}),
      });
      if (current !== generation.current || requestId !== historyRequests.current[channelId]) return;
      applyReceipts(channelId, result.readReceipts);
      setMessages((previous) => {
        const incoming = result.messages.map(adaptConnectMessage);
        if (initial) return { ...previous, [channelId]: incoming };
        const earliest = Math.min(...incoming.map((message) => Date.parse(message.createdAt)));
        const retained = (previous[channelId] ?? []).filter((message) => Date.parse(message.createdAt) < earliest);
        return { ...previous, [channelId]: [...retained, ...incoming] };
      });
      if (initial)
        setHistoryState((previous) => ({
          ...previous,
          [channelId]: {
            loading: false,
            paging: false,
            firstUnreadId: result.firstUnreadId,
            olderCursor: result.nextCursor ?? null,
            newerCursor: result.newerCursor,
            error: "",
          },
        }));
    } catch (reason) {
      if (current !== generation.current || requestId !== historyRequests.current[channelId]) return;
      if (initial)
        setHistoryState((previous) => ({
          ...previous,
          [channelId]: {
            loading: false,
            paging: false,
            firstUnreadId: null,
            olderCursor: null,
            newerCursor: null,
            error: reason instanceof Error ? reason.message : "Unable to load messages.",
          },
        }));
      throw reason;
    }
  }

  async function loadMoreMessages(channelId: string, direction: "older" | "newer") {
    const state = historyRef.current[channelId];
    const cursor = direction === "older" ? state?.olderCursor : state?.newerCursor;
    if (!cursor || state?.loading || paginationRequests.current.has(channelId)) return;
    const current = generation.current;
    paginationRequests.current.add(channelId);
    setHistoryState((previous) => ({ ...previous, [channelId]: { ...previous[channelId], paging: true } }));
    try {
      const result = await connectService.listMessages(organizationId, channelId, {
        limit: 50,
        ...(direction === "older" ? { cursor } : { after: cursor }),
      });
      if (current !== generation.current) return;
      applyReceipts(channelId, result.readReceipts);
      setMessages((previous) => {
        const merged = new Map((previous[channelId] ?? []).map((message) => [message.id, message]));
        for (const message of result.messages) merged.set(message.id, adaptConnectMessage(message));
        return { ...previous, [channelId]: [...merged.values()] };
      });
      setHistoryState((previous) => ({
        ...previous,
        [channelId]: {
          ...previous[channelId],
          paging: false,
          ...(direction === "older" ? { olderCursor: result.nextCursor ?? null } : { newerCursor: result.newerCursor }),
        },
      }));
    } catch (reason) {
      if (current === generation.current) {
        setHistoryState((previous) => ({ ...previous, [channelId]: { ...previous[channelId], paging: false } }));
        reportError(reason);
      }
    } finally {
      if (current === generation.current) paginationRequests.current.delete(channelId);
    }
  }

  async function markVisibleMessageRead(channelId: string, messageId: string) {
    if (!user || activeChannelRef.current !== channelId || document.visibilityState !== "visible") return;
    const message = messagesRef.current[channelId]?.find((item) => item.id === messageId);
    if (!message || message.senderId === user.id) return;
    const previousRead = requestedReads.current[channelId] ?? receiptsRef.current[channelId]?.[user.id];
    if (previousRead && Date.parse(previousRead) >= Date.parse(message.createdAt)) return;
    requestedReads.current[channelId] = message.createdAt;
    const current = generation.current;
    try {
      const result = await connectService.markMessagesRead(organizationId, channelId, messageId);
      if (current !== generation.current) return;
      applyReceipts(channelId, [{ userId: user.id, lastReadAt: result.lastReadAt }]);
    } catch (reason) {
      if (current !== generation.current) return;
      if (requestedReads.current[channelId] === message.createdAt) delete requestedReads.current[channelId];
      reportError(reason);
    }
  }

  useEffect(() => {
    const current = ++generation.current;
    setUsers({});
    setConversations({});
    setMessages({});
    setTeams([]);
    setSidebar(emptySidebar);
    setHistoryState({});
    setReadReceipts({});
    requestedReads.current = {};
    historyRequests.current = {};
    paginationRequests.current.clear();
    setUnread({});
    setTypingUsers({});
    setLoading(true);
    setConnected(false);
    setError("");
    if (!organizationId || !user) {
      setLoading(false);
      if (user) setError("Select an organization to open Connect.");
      return;
    }
    let cancelled = false;
    let socket: Socket | null = null;
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    async function reload() {
      const [peopleResult, chatsResult, channelsResult, preferencesResult, teamsResult] = await Promise.allSettled([
        connectService.listUsers(organizationId),
        connectService.listConversations(organizationId),
        connectService.listChannels(organizationId),
        connectService.getSidebar(organizationId),
        tenantRequest<Team[]>(organizationId, "/api/organization/connect/teams"),
      ]);
      if (cancelled || generation.current !== current) return;
      const people = peopleResult.status === "fulfilled" ? peopleResult.value : [];
      const chats = chatsResult.status === "fulfilled" ? chatsResult.value : [];
      const channels = channelsResult.status === "fulfilled" ? channelsResult.value : [];
      const preferences = preferencesResult.status === "fulfilled" ? preferencesResult.value : emptySidebar;
      const organizationTeams = teamsResult.status === "fulfilled" ? teamsResult.value : [];
      const failures = [
        ["Members", peopleResult],
        ["Chats", chatsResult],
        ["Channels", channelsResult],
        ["Sidebar", preferencesResult],
        ["Teams", teamsResult],
      ] as const;
      const errors = failures.flatMap(([label, result]) =>
        result.status === "rejected"
          ? [`${label}: ${result.reason instanceof Error ? result.reason.message : "Unable to load"}`]
          : [],
      );
      setError(errors.join("; "));
      const peopleById: Record<string, ConnectUser> = {};
      for (const person of people) {
        peopleById[person.id] = {
          id: person.id,
          organizationId,
          displayName: person.name,
          firstName: person.name.split(" ")[0],
          lastName: person.name.split(" ").slice(1).join(" "),
          email: person.email,
          avatar: person.avatarUrl ?? "",
          jobTitle: "",
          department: "",
          role: "member",
          status: "offline",
          presence: "offline",
          location: "",
          timezone: "",
          lastSeen: null,
          createdAt: "",
        };
      }
      setUsers(peopleById);
      setTeams(organizationTeams);
      setSidebar(preferences);
      const next: Record<string, ConnectConversation> = {};
      for (const channel of [...channels, ...chats]) {
        const participants = (channel.members ?? []).map((member) => member.userId);
        const other = participants.find((id) => id !== user!.id);
        next[channel.id] = {
          id: channel.id,
          organizationId,
          type: channel.type.toLowerCase() as ConnectConversation["type"],
          name: channel.type === "DIRECT" ? (peopleById[other ?? ""]?.displayName ?? channel.name) : channel.name,
          avatar: channel.type === "DIRECT" ? peopleById[other ?? ""]?.avatar : undefined,
          teamId: channel.teamId,
          channelId: channel.id,
          createdBy: channel.createdById ?? "",
          createdAt: channel.createdAt,
          participants,
          lastMessageAt: channel.messages?.[0]?.createdAt ?? channel.createdAt,
          unreadCount: 0,
          isFavorite:
            preferences.favorites.chats.includes(channel.id) || preferences.favorites.channels.includes(channel.id),
          muted: false,
          pinned: false,
          archived: channel.isArchived,
          description: channel.description ?? "",
        };
      }
      setConversations(next);
    }

    async function history(channelId: string) {
      try {
        if (!cancelled && !historyRef.current[channelId]?.loading) await loadMessages(channelId);
      } catch (reason) {
        if (!cancelled) reportError(reason);
      }
    }
    reloadRef.current = reload;

    async function connectSocket() {
      const response = await fetch("/api/connect/socket", { method: "POST", cache: "no-store" });
      if (!response.ok) throw new Error("Unable to authenticate real-time Connect. Refresh your session.");
      const credentials: { token: string; url: string } = await response.json();
      if (cancelled) return;
      socket = io(credentials.url, { auth: { token: credentials.token }, autoConnect: false });
      socketRef.current = socket;
      socket.on("connect", () => {
        setConnected(true);
        void reload().catch(reportError);
        if (activeChannelRef.current) {
          socket?.emit("channel:join", { channelId: activeChannelRef.current });
          void history(activeChannelRef.current);
        }
      });
      socket.on("disconnect", () => {
        setConnected(false);
        setTypingUsers({});
        typingTimers.forEach((timer) => clearTimeout(timer));
        typingTimers.clear();
        outgoingTyping.current = null;
      });
      socket.on("connect_error", () => {
        setConnected(false);
        setError("Real-time connection unavailable. Messages can still be sent using the API.");
      });
      socket.on("connect:error", (payload: { message: string }) => setError(payload.message));
      socket.on("message:created", (payload: { channelId: string; message: ConnectApiMessage }) => {
        const message = adaptConnectMessage(payload.message);
        setMessages((previous) => ({
          ...previous,
          [payload.channelId]: [
            ...(previous[payload.channelId] ?? []).filter((item) => item.id !== message.id),
            message,
          ],
        }));
        if (message.senderId !== user!.id) {
          setUnread((previous) => ({ ...previous, [payload.channelId]: (previous[payload.channelId] ?? 0) + 1 }));
        }
      });
      socket.on("message:updated", (payload: { channelId: string; message: ConnectApiMessage }) => {
        setMessages((previous) => ({
          ...previous,
          [payload.channelId]: [
            ...(previous[payload.channelId] ?? []).filter((message) => message.id !== payload.message.id),
            adaptConnectMessage(payload.message),
          ],
        }));
      });
      socket.on("message:deleted", (payload: { channelId: string; messageId: string }) => {
        setMessages((previous) => ({
          ...previous,
          [payload.channelId]: (previous[payload.channelId] ?? []).filter(
            (message) => message.id !== payload.messageId,
          ),
        }));
      });
      socket.on("message:reaction-changed", (payload: { channelId: string }) => {
        void history(payload.channelId);
      });
      socket.on("sidebar:favorites-changed", (payload: { favorites: ConnectSidebarState["favorites"] }) =>
        setSidebar((previous) => ({ ...previous, favorites: payload.favorites })),
      );
      socket.on("sidebar:settings-changed", (payload: { settings: ConnectSidebarSettings }) =>
        setSidebar((previous) => ({ ...previous, settings: payload.settings })),
      );
      socket.on("sidebar:chat-activity", () => {
        void reload().catch(reportError);
      });
      socket.on("presence:changed", (payload: { userId: string; status: string }) => {
        const status =
          payload.status === "online"
            ? "available"
            : payload.status === "busy"
              ? "busy"
              : payload.status === "away"
                ? "away"
                : "offline";
        setUsers((previous) =>
          previous[payload.userId]
            ? {
                ...previous,
                [payload.userId]: {
                  ...previous[payload.userId],
                  status,
                  presence: status === "available" ? "online" : status,
                },
              }
            : previous,
        );
      });
      socket.on("channel:marked-read", (payload: { channelId: string; userId: string; lastReadAt: string | null }) => {
        applyReceipts(payload.channelId, [{ userId: payload.userId, lastReadAt: payload.lastReadAt }]);
        if (payload.userId === user!.id && payload.lastReadAt) {
          setUnread((previous) => ({
            ...previous,
            [payload.channelId]: (messagesRef.current[payload.channelId] ?? []).filter(
              (message) =>
                message.senderId !== user!.id && Date.parse(message.createdAt) > Date.parse(payload.lastReadAt!),
            ).length,
          }));
        }
      });
      socket.on("typing", (payload: { channelId: string; userId: string; isTyping: boolean }) => {
        if (payload.userId === user!.id) return;
        const key = `${payload.channelId}:${payload.userId}`;
        clearTimeout(typingTimers.get(key));
        typingTimers.delete(key);
        setTypingUsers((previous) => ({
          ...previous,
          [payload.channelId]: payload.isTyping
            ? [...new Set([...(previous[payload.channelId] ?? []), payload.userId])]
            : (previous[payload.channelId] ?? []).filter((id) => id !== payload.userId),
        }));
        if (payload.isTyping)
          typingTimers.set(
            key,
            setTimeout(() => {
              typingTimers.delete(key);
              setTypingUsers((previous) => ({
                ...previous,
                [payload.channelId]: (previous[payload.channelId] ?? []).filter((id) => id !== payload.userId),
              }));
            }, 5000),
          );
      });
      socket.connect();
    }

    void reload()
      .then(connectSocket)
      .catch(reportError)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      generation.current++;
      typingTimers.forEach((timer) => clearTimeout(timer));
      if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
      typingStopTimer.current = null;
      outgoingTyping.current = null;
      socket?.disconnect();
      socketRef.current = null;
      reloadRef.current = null;
    };
  }, [organizationId, user?.id]);

  useEffect(() => {
    if (!organizationId || !selectedConversationId) return;
    void loadMessages(selectedConversationId, true).catch(reportError);
    const socket = socketRef.current;
    socket?.emit("channel:join", { channelId: selectedConversationId }, (ack: Ack) => {
      if (!ack.ok) {
        setError(ack.error?.message ?? "Unable to join channel.");
        return;
      }
    });
    return () => {
      if (outgoingTyping.current?.channelId === selectedConversationId) {
        if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
        typingStopTimer.current = null;
        outgoingTyping.current = null;
      }
      socket?.emit("typing", { channelId: selectedConversationId, isTyping: false });
      socket?.emit("channel:leave", { channelId: selectedConversationId });
    };
  }, [organizationId, selectedConversationId]);

  async function send(channelId: string, input: CreateMessageInput) {
    const current = generation.current;
    const result = adaptConnectMessage(await connectService.createMessage(organizationId, channelId, input));
    if (current === generation.current)
      setMessages((previous) => ({
        ...previous,
        [channelId]: [...(previous[channelId] ?? []).filter((item) => item.id !== result.id), result],
      }));
    return result;
  }

  async function favorite(itemType: "chat" | "team" | "channel", itemId: string, isFavorite: boolean) {
    const current = generation.current;
    const result = await connectService.setSidebarFavorite(organizationId, { itemType, itemId, isFavorite });
    if (current === generation.current) setSidebar(result);
  }

  async function updateSidebarSettings(settings: ConnectSidebarSettings) {
    const current = generation.current;
    const result = await connectService.updateSidebarSettings(organizationId, settings);
    if (current === generation.current) setSidebar(result);
  }

  async function startDirect(userId: string) {
    const current = generation.current;
    const conversation = await connectService.createDirectConversation(organizationId, userId);
    if (current !== generation.current) return "";
    await reloadRef.current?.();
    return conversation.id;
  }

  function typing(isTyping: boolean) {
    if (typingStopTimer.current) clearTimeout(typingStopTimer.current);
    typingStopTimer.current = null;
    const socket = socketRef.current;
    if (!selectedConversationId || !socket?.connected) return;
    if (!isTyping) {
      socket.emit("typing", { channelId: selectedConversationId, isTyping: false });
      outgoingTyping.current = null;
      return;
    }
    const now = Date.now();
    if (outgoingTyping.current?.channelId !== selectedConversationId || now - outgoingTyping.current.sentAt >= 1500) {
      socket.emit("typing", { channelId: selectedConversationId, isTyping: true });
      outgoingTyping.current = { channelId: selectedConversationId, sentAt: now };
    }
    typingStopTimer.current = setTimeout(() => {
      socket.emit("typing", { channelId: selectedConversationId, isTyping: false });
      outgoingTyping.current = null;
      typingStopTimer.current = null;
    }, 2500);
  }

  return {
    user,
    organizationId,
    users,
    conversations,
    teams,
    sidebar,
    messages,
    historyState,
    readReceipts,
    unread,
    typingUsers,
    loading,
    connected,
    error,
    setError,
    socket: socketRef.current,
    send,
    favorite,
    updateSidebarSettings,
    startDirect,
    typing,
    loadMessages,
    loadMoreMessages,
    markVisibleMessageRead,
    reportError,
    refresh: () => reloadRef.current?.(),
  };
}
