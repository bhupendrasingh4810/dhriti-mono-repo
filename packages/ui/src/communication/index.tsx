"use client";

import * as React from "react";
import { Avatar, Badge, Box, Chip, Paper, Stack, TextField, Typography } from "@mui/material";

export type ChannelHeaderProps = {
  title: string;
  topic?: string;
};

export function ChannelHeader({ title, topic }: ChannelHeaderProps) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {topic ? <Typography variant="body2" color="text.secondary">{topic}</Typography> : null}
      </Box>
      <Chip label="Channel" size="small" />
    </Stack>
  );
}

export type ChannelListItem = {
  id: string;
  name: string;
  unread?: number;
};

export type ChannelListProps = {
  channels: ChannelListItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
};

export function ChannelList({ channels, activeId, onSelect }: ChannelListProps) {
  return (
    <Stack spacing={0.5}>
      {channels.map((channel) => (
        <Paper
          key={channel.id}
          onClick={() => onSelect?.(channel.id)}
          sx={{
            p: 1,
            cursor: "pointer",
            backgroundColor: channel.id === activeId ? "action.selected" : undefined,
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2">{channel.name}</Typography>
            {channel.unread ? <Badge badgeContent={channel.unread} color="primary" /> : null}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

export type MessageBubbleProps = {
  message: string;
  author: string;
  mine?: boolean;
  timestamp?: string;
};

export function MessageBubble({ message, author, mine, timestamp }: MessageBubbleProps) {
  return (
    <Stack spacing={0.5} sx={{ alignItems: mine ? "flex-end" : "flex-start" }}>
      <Typography variant="caption" color="text.secondary">{author}</Typography>
      <Paper sx={{ p: 1.25, maxWidth: 540, backgroundColor: mine ? "action.selected" : "background.paper" }}>
        <Typography variant="body2">{message}</Typography>
      </Paper>
      {timestamp ? <Typography variant="caption" color="text.secondary">{timestamp}</Typography> : null}
    </Stack>
  );
}

export type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
};

export function MessageComposer({ value, onChange, onSubmit }: MessageComposerProps) {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit?.();
        }
      }}
      placeholder="Type a message"
      multiline
      minRows={2}
      maxRows={6}
    />
  );
}

export type ThreadPanelProps = {
  title: string;
  children?: React.ReactNode;
};

export function ThreadPanel({ title, children }: ThreadPanelProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography>
      <Stack spacing={1.5}>{children}</Stack>
    </Paper>
  );
}

export type Reaction = {
  emoji: string;
  count: number;
};

export type ReactionListProps = {
  reactions: Reaction[];
};

export function ReactionList({ reactions }: ReactionListProps) {
  return (
    <Stack direction="row" spacing={0.75}>
      {reactions.map((reaction) => (
        <Chip key={reaction.emoji} size="small" label={`${reaction.emoji} ${reaction.count}`} />
      ))}
    </Stack>
  );
}

export type PresenceState = "online" | "away" | "busy" | "offline";

export type PresenceIndicatorProps = {
  state: PresenceState;
};

const presenceColor: Record<PresenceState, string> = {
  online: "success.main",
  away: "warning.main",
  busy: "error.main",
  offline: "text.disabled",
};

export function PresenceIndicator({ state }: PresenceIndicatorProps) {
  return (
    <Box
      aria-label={`Presence: ${state}`}
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: presenceColor[state],
      }}
    />
  );
}

export type UserMentionProps = {
  label: string;
  avatarText?: string;
};

export function UserMention({ label, avatarText }: UserMentionProps) {
  return (
    <Chip
      size="small"
      avatar={<Avatar sx={{ width: 18, height: 18 }}>{avatarText ?? label[0]}</Avatar>}
      label={`@${label}`}
    />
  );
}
