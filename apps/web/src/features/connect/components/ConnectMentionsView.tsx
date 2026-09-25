"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  AlternateEmailRounded,
  CallRounded,
  ChevronRightRounded,
  KeyboardArrowDownRounded,
  LaunchRounded,
  MoreHorizRounded,
} from "@mui/icons-material";
import { Avatar, Box, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";

export type ConnectMentionsFilter = "unread" | "channels" | "chats";

export type ConnectMentionsViewItem = {
  id: string;
  messageId: string;
  conversationId: string;
  sourceType: "channel" | "person";
  sourceName: string;
  sourceAvatar?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  excerpt: string;
  unread: boolean;
  createdAt: string;
};

export type ConnectMentionsViewMessage = {
  id: string;
  senderId: string;
  createdAt: string;
  content: string;
};

type ConnectMentionsViewProps = {
  items: ConnectMentionsViewItem[];
  usersById: Record<string, { id: string; displayName: string; avatar: string; jobTitle: string }>;
  selectedMentionId: string | null;
  filter: ConnectMentionsFilter;
  detail: {
    mentionId: string;
    conversationId: string;
    highlightedMessageId: string;
    sourceType: "channel" | "person";
    title: string;
    avatar?: string;
    subtitle?: string;
    lastMessage?: string;
    messages: ConnectMentionsViewMessage[];
  } | null;
  onSelectMention: (mentionId: string) => void;
  onFilterChange: (filter: ConnectMentionsFilter) => void;
  onOpenChannelMenu: (event: MouseEvent<HTMLElement>, mentionId: string) => void;
  onOpenCallOptions: (event: MouseEvent<HTMLElement>, mentionId: string) => void;
  onOpenInNewWindow: (mentionId: string) => void;
  onGoToChannel: (conversationId: string) => void;
  // renderMessageContent: (message: ConnectMentionsViewMessage) => ReactNode;
  composer: ReactNode;
};

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConnectMentionsView({
  items,
  usersById,
  selectedMentionId,
  filter,
  detail,
  onSelectMention,
  onFilterChange,
  onOpenChannelMenu,
  onOpenCallOptions,
  onOpenInNewWindow,
  onGoToChannel,
  // renderMessageContent,
  composer,
}: ConnectMentionsViewProps) {
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!detail?.highlightedMessageId) {
      setHighlightedMessageId(null);
      return;
    }

    setHighlightedMessageId(detail.highlightedMessageId);
    const timer = window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === detail.highlightedMessageId ? null : current));
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [detail?.highlightedMessageId]);

  const filterCounts = useMemo(
    () => ({
      unread: items.filter((item) => item.unread).length,
      channels: items.filter((item) => item.sourceType === "channel").length,
      chats: items.filter((item) => item.sourceType === "person").length,
    }),
    [items],
  );

  const filters: Array<{ id: ConnectMentionsFilter; label: string; count: number }> = [
    { id: "unread", label: "Unread", count: filterCounts.unread },
    { id: "channels", label: "Channels", count: filterCounts.channels },
    { id: "chats", label: "Chats", count: filterCounts.chats },
  ];

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: "flex", bgcolor: "#fff", overflow: "hidden" }}>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
        {!detail ? (
          <Stack
            sx={{ flex: 1, alignItems: "center", justifyContent: "center", px: 4, textAlign: "center" }}
            spacing={1.5}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: (theme) => theme.tokens.radius.lg,
                bgcolor: "#f8fafc",
                border: "1px solid #e5e7eb",
                display: "grid",
                placeItems: "center",
                color: "#94a3b8",
              }}
            >
              <AlternateEmailRounded sx={{ fontSize: 30 }} />
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
              When you select a mention, it&apos;ll show up here
            </Typography>
          </Stack>
        ) : (
          <>
            <Stack
              direction="row"
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid #f3f4f6",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
                <Avatar src={detail.avatar} sx={{ width: 40, height: 40 }} />
                {detail.sourceType === "channel" ? "#" : detail.title.charAt(0)}
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ minWidth: 0 }}>{detail.title}</Box>
                  <Typography sx={{ fontSize: 12, color: "#6b7280" }} noWrap>
                    {detail.lastMessage ?? detail.subtitle ?? "Recent mention"}
                  </Typography>
                </Box>
              </Stack>

              {detail.sourceType === "channel" ? (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }}>
                  <Typography
                    sx={{ fontSize: 12, fontWeight: 700, color: "#2563eb", cursor: "pointer" }}
                    onClick={() => onGoToChannel(detail.conversationId)}
                  >
                    Go to channel
                  </Typography>
                  <IconButton size="small" onClick={(event) => onOpenChannelMenu(event, detail.mentionId)}>
                    <MoreHorizRounded sx={{ fontSize: 18, color: "#9ca3af" }} />
                  </IconButton>
                </Stack>
              ) : (
                <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", flexShrink: 0 }}>
                  <IconButton size="small">
                    <CallRounded sx={{ fontSize: 18, color: "#4b5563" }} />
                  </IconButton>
                  <Tooltip title="More call options">
                    <IconButton size="small" onClick={(event) => onOpenCallOptions(event, detail.mentionId)}>
                      <KeyboardArrowDownRounded sx={{ fontSize: 18, color: "#4b5563" }} />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={() => onOpenInNewWindow(detail.mentionId)}>
                    <LaunchRounded sx={{ fontSize: 18, color: "#4b5563" }} />
                  </IconButton>
                </Stack>
              )}
            </Stack>

            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2.5 }}>
              <Stack spacing={2}>
                {detail.messages.map((message) => {
                  const sender = usersById[message.senderId];
                  const isHighlighted = highlightedMessageId === message.id;

                  return (
                    <Stack key={message.id} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                      <Avatar
                        src={sender?.avatar}
                        sx={{ width: 34, height: 34, borderRadius: (theme) => theme.tokens.radius.md, flexShrink: 0 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0, position: "relative", pr: isHighlighted ? 4.5 : 0 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mb: 0.45 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                            {sender?.displayName ?? "Unknown User"}
                          </Typography>
                          <Typography
                            sx={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}
                          >
                            {formatTime(message.createdAt)}
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            p: 1.25,
                            borderRadius: (theme) => theme.tokens.radius.md,
                            bgcolor: "#f8fafc",
                            border: isHighlighted ? "2px solid #ef4444" : "1px solid #e5e7eb",
                            transition: "border-color 160ms ease",
                          }}
                        >
                          {/* {renderMessageContent(message)} */}
                        </Box>
                        {isHighlighted ? (
                          <Box
                            sx={{
                              position: "absolute",
                              right: 4,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 28,
                              height: 28,
                              borderRadius: (theme) => theme.tokens.radius.pill,
                              bgcolor: "#fee2e2",
                              color: "#dc2626",
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <AlternateEmailRounded sx={{ fontSize: 16 }} />
                          </Box>
                        ) : null}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>

            <Divider />
            <Box sx={{ flexShrink: 0 }}>{composer}</Box>
          </>
        )}
      </Box>

      <Box
        sx={{
          width: 340,
          borderLeft: "1px solid #f3f4f6",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ px: 2, py: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Mentions</Typography>
        </Box>
        <Divider />
        <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, flexWrap: "wrap", rowGap: 1 }}>
          {filters.map((entry) => {
            const active = filter === entry.id;
            return (
              <Box
                key={entry.id}
                onClick={() => onFilterChange(entry.id)}
                sx={{
                  px: 1.1,
                  py: 0.55,
                  borderRadius: (theme) => theme.tokens.radius.pill,
                  bgcolor: active ? "#fee2e2" : "#f8fafc",
                  border: active ? "1px solid #fecaca" : "1px solid #e5e7eb",
                  cursor: "pointer",
                }}
              >
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: active ? "#b91c1c" : "#475569" }}>
                  {entry.label} {entry.count}
                </Typography>
              </Box>
            );
          })}
        </Stack>
        <Divider />
        <Box sx={{ flex: 1, overflowY: "auto", px: 1.25, py: 1 }}>
          <Stack spacing={0.4}>
            {items.slice(0, 30).map((item) => {
              const active = selectedMentionId === item.id;
              return (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={1}
                  onClick={() => onSelectMention(item.id)}
                  sx={{
                    px: 0.95,
                    py: 0.9,
                    borderRadius: (theme) => theme.tokens.radius.md,
                    bgcolor: active ? "#fff1f2" : "transparent",
                    border: active ? "1px solid #fecdd3" : "1px solid transparent",
                    cursor: "pointer",
                    "&:hover": { bgcolor: active ? "#fff1f2" : "#f8fafc" },
                  }}
                >
                  <Avatar
                    src={item.sourceType === "person" ? item.sourceAvatar : item.senderAvatar}
                    sx={{ width: 34, height: 34, flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }} noWrap>
                        {item.sourceName}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>
                        {formatTime(item.createdAt)}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }} noWrap>
                      {item.senderName}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#475569", lineHeight: 1.45, mt: 0.25 }} noWrap>
                      {item.excerpt}
                    </Typography>
                  </Box>
                  <Stack sx={{ alignItems: "center", justifyContent: "space-between", flexShrink: 0, minHeight: 36 }}>
                    {item.unread ? (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: (theme) => theme.tokens.radius.pill,
                          bgcolor: "#ef4444",
                          mt: 0.4,
                        }}
                      />
                    ) : (
                      <Box sx={{ width: 8, height: 8 }} />
                    )}
                    <ChevronRightRounded sx={{ fontSize: 15, color: active ? "#ef4444" : "#cbd5e1" }} />
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
