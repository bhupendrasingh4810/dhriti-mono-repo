import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, Popover } from "@mui/material";
import EmojiPicker from "emoji-picker-react";
import {
  ConnectCascadingMenu,
  ConnectChannelDetailsPanel,
  ConnectConversationWindow,
  ConnectMessageInput,
  ConnectMentionsView,
  ConnectReactionUsersList,
  type ConnectConversationWindowMessage,
  type ConnectCascadingMenuItem,
  type ConnectMentionsFilter,
} from "@dhriti/ui";

const meta: Meta = {
  title: "Components/Connect Sections",
};

export default meta;
type Story = StoryObj;

const usersById = {
  usr_001: {
    id: "usr_001",
    displayName: "Aarav Sharma",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg",
    jobTitle: "Chief Technology Officer",
    location: "Bengaluru, India",
  },
  usr_002: {
    id: "usr_002",
    displayName: "Priya Verma",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
    jobTitle: "Engineering Manager",
    location: "Pune, India",
  },
  usr_003: {
    id: "usr_003",
    displayName: "Rahul Mehta",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg",
    jobTitle: "Senior Software Engineer",
    location: "Hyderabad, India",
  },
};

const seedMessages: ConnectConversationWindowMessage[] = [
  {
    id: "msg_1",
    senderId: "usr_002",
    content: "Good morning team.",
    contentType: "text",
    createdAt: "2026-08-27T08:00:00Z",
    reactions: [{ emoji: "👍", count: 2, userIds: ["usr_001", "usr_003"] }],
  },
  {
    id: "msg_2",
    senderId: "usr_003",
    content: "I shared @[Aarav Sharma] roadmap notes.",
    contentType: "text",
    createdAt: "2026-08-27T08:02:10Z",
  },
];

const mentionItems = [
  {
    id: "mention_001",
    messageId: "msg_1",
    conversationId: "channel_001",
    sourceType: "channel" as const,
    sourceName: "General",
    senderId: "usr_002",
    senderName: "Priya Verma",
    senderAvatar: usersById.usr_002.avatar,
    excerpt: "@[Aarav Sharma] please review the latest rollout notes.",
    unread: true,
    createdAt: "2026-08-27T08:00:00Z",
  },
  {
    id: "mention_002",
    messageId: "msg_2",
    conversationId: "chat_001",
    sourceType: "person" as const,
    sourceName: "Priya Verma",
    sourceAvatar: usersById.usr_002.avatar,
    senderId: "usr_002",
    senderName: "Priya Verma",
    senderAvatar: usersById.usr_002.avatar,
    excerpt: "@[Aarav Sharma] can we sync after standup?",
    unread: false,
    createdAt: "2026-08-27T08:12:00Z",
  },
];

export const MessageInput: Story = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <Box sx={{ p: 3, maxWidth: 840, bgcolor: "#f8fafc" }}>
        <ConnectMessageInput
          conversationLabel="# general"
          value={value}
          users={Object.values(usersById)}
          currentUserId="usr_001"
          quotedMessage={{ senderName: "Priya Verma", content: "Please review the latest changes." }}
          onChange={setValue}
          onClearQuotedMessage={() => {}}
          onAttachFiles={() => {}}
          onSend={({ content }) => setValue(content ? "" : value)}
        />
      </Box>
    );
  },
};

export const ConversationWindow: Story = {
  render: () => {
    const [messages, setMessages] = useState(seedMessages);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [reactionAnchor, setReactionAnchor] = useState<HTMLElement | null>(null);
    const [reactionUsers, setReactionUsers] = useState<string[]>([]);
    const [reactionEmoji, setReactionEmoji] = useState("👍");

    const menuItems: ConnectCascadingMenuItem[] = [
      { id: "copy", label: "Copy link" },
      { id: "save", label: "Save message" },
    ];

    const currentConversation = {
      id: "channel_001",
      name: "General",
      type: "channel" as const,
      isFavorite: true,
      participants: ["usr_001", "usr_002", "usr_003"],
    };

    return (
      <Box sx={{ height: 640, maxWidth: 980, border: "1px solid #e5e7eb" }}>
        <ConnectConversationWindow
          conversation={currentConversation}
          teamLabel="Engineering"
          currentUserId="usr_001"
          usersById={usersById}
          messages={messages}
          activeMessageMenuId={activeMessageId}
          activeMessageEmojiId={activeMessageId}
          getQuotedMessageById={(id) => messages.find((message) => message.id === id)}
          renderMessageContent={(message) => message.content}
          onOpenDetails={() => {}}
          onOpenParticipantsMenu={() => {}}
          onQuoteMessage={() => {}}
          onOpenMessageMenu={(event, messageId) => {
            setMenuAnchor(event.currentTarget);
            setActiveMessageId(messageId);
          }}
          onOpenMessageEmoji={(event, messageId) => {
            setEmojiAnchor(event.currentTarget);
            setActiveMessageId(messageId);
          }}
          onOpenReactionHover={(event, emoji, userIds) => {
            setReactionAnchor(event.currentTarget);
            setReactionUsers(userIds);
            setReactionEmoji(emoji);
          }}
          onCloseReactionHover={() => setReactionAnchor(null)}
          onAddReaction={(messageId, emoji) => {
            setMessages((previous) =>
              previous.map((message) => {
                if (message.id !== messageId) return message;
                const reactions = message.reactions ? [...message.reactions] : [];
                const existing = reactions.find((reaction) => reaction.emoji === emoji);
                if (existing) {
                  return {
                    ...message,
                    reactions: reactions.map((reaction) =>
                      reaction.emoji === emoji ? { ...reaction, count: reaction.count + 1 } : reaction
                    ),
                  };
                }
                return { ...message, reactions: [...reactions, { emoji, count: 1, userIds: ["usr_001"] }] };
              })
            );
          }}
        />

        <ConnectCascadingMenu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} items={menuItems} maxDepth={4} />

        <Popover
          open={Boolean(emojiAnchor)}
          anchorEl={emojiAnchor}
          onClose={() => setEmojiAnchor(null)}
          disableScrollLock
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <EmojiPicker width={320} height={360} onEmojiClick={() => setEmojiAnchor(null)} />
        </Popover>

        <Popover
          open={Boolean(reactionAnchor)}
          anchorEl={reactionAnchor}
          onClose={() => setReactionAnchor(null)}
          disableScrollLock
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <ConnectReactionUsersList
            emoji={reactionEmoji}
            users={reactionUsers.map((userId) => usersById[userId]).filter(Boolean)}
          />
        </Popover>
      </Box>
    );
  },
};

export const ChannelDetailsPanel: Story = {
  render: () => (
    <Box sx={{ height: 700, position: "relative", bgcolor: "#f8fafc" }}>
      <ConnectChannelDetailsPanel
        open
        title="General"
        type="channel"
        teamLabel="Engineering"
        description="General engineering discussions and platform updates."
        memberCount={24}
        pinnedCount={3}
        linkCount={5}
        files={[
          { id: "f1", originalName: "Engineering Roadmap.pdf", size: 2840000 },
          { id: "f2", originalName: "API Changelog.md", size: 44200 },
        ]}
        meetings={[{ id: "m1", title: "Q3 Planning Sync" }]}
        onClose={() => {}}
      />
    </Box>
  ),
};

export const MentionsView: Story = {
  render: () => {
    const [filter, setFilter] = useState<ConnectMentionsFilter>("unread");
    const [selectedMentionId, setSelectedMentionId] = useState<string | null>("mention_001");
    const [value, setValue] = useState("");
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [callAnchor, setCallAnchor] = useState<HTMLElement | null>(null);

    const filteredItems = mentionItems.filter((item) => {
      if (filter === "unread") return item.unread;
      if (filter === "channels") return item.sourceType === "channel";
      return item.sourceType === "person";
    });

    const selectedMention = filteredItems.find((item) => item.id === selectedMentionId) ?? null;

    return (
      <Box sx={{ height: 720, maxWidth: 1180, border: "1px solid #e5e7eb", bgcolor: "#fff" }}>
        <ConnectMentionsView
          items={filteredItems}
          usersById={usersById}
          selectedMentionId={selectedMentionId}
          filter={filter}
          detail={selectedMention ? {
            mentionId: selectedMention.id,
            conversationId: selectedMention.conversationId,
            highlightedMessageId: selectedMention.messageId,
            sourceType: selectedMention.sourceType,
            title: selectedMention.sourceName,
            avatar: selectedMention.sourceAvatar,
            lastMessage: selectedMention.excerpt,
            messages: seedMessages.map((message) => ({
              id: message.id,
              senderId: message.senderId,
              createdAt: message.createdAt,
              content: message.content,
            })),
          } : null}
          onSelectMention={setSelectedMentionId}
          onFilterChange={setFilter}
          onOpenChannelMenu={(event) => setMenuAnchor(event.currentTarget)}
          onOpenCallOptions={(event) => setCallAnchor(event.currentTarget)}
          onOpenInNewWindow={() => {}}
          onGoToChannel={() => {}}
          renderMessageContent={(message) => message.content}
          composer={
            <ConnectMessageInput
              conversationLabel="# general"
              value={value}
              users={Object.values(usersById)}
              currentUserId="usr_001"
              onChange={setValue}
              onSend={() => setValue("")}
              onClearQuotedMessage={() => {}}
              onAttachFiles={() => {}}
            />
          }
        />

        <NonBlockingMenu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          items={[
            { id: "unfollow", label: "Unfollow thread" },
            { id: "unread", label: "Mark as unread" },
            { id: "copy", label: "Copy link" },
          ]}
        />

        <NonBlockingMenu
          anchorEl={callAnchor}
          open={Boolean(callAnchor)}
          onClose={() => setCallAnchor(null)}
          items={[
            { id: "video", label: "Video Call" },
            { id: "audio", label: "Audio Call" },
          ]}
        />
      </Box>
    );
  },
};
