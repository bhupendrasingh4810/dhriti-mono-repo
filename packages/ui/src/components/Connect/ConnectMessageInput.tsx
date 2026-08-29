"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  AddRounded,
  CodeRounded,
  CloseRounded,
  DescriptionOutlined,
  EditRounded,
  FormatBoldRounded,
  FormatColorFillRounded,
  FormatItalicRounded,
  FormatListBulletedRounded,
  FormatListNumberedRounded,
  FormatQuoteRounded,
  FormatSizeRounded,
  FormatStrikethroughRounded,
  FormatUnderlinedRounded,
  LinkRounded,
  MailOutlineRounded,
  MoreVertRounded,
  NotificationsNoneRounded,
  PriorityHighRounded,
  SendRounded,
  SentimentSatisfiedAltRounded,
  TableRowsRounded,
  VideocamRounded,
} from "@mui/icons-material";
import { Box, Button, Divider, IconButton, Popover, Stack, TextField, Typography } from "@mui/material";
import { NonBlockingMenu, type NonBlockingMenuItem } from "./NonBlockingMenu";

export type ConnectMentionUser = {
  id: string;
  displayName: string;
  avatar: string;
  subtitle?: string;
};

type ConnectMessageInputProps = {
  conversationLabel: string;
  value: string;
  users: ConnectMentionUser[];
  currentUserId: string;
  quotedMessage?: {
    senderName: string;
    content: string;
  } | null;
  onChange: (value: string) => void;
  onSend: (payload: { content: string; mentionUserIds: string[] }) => void;
  onClearQuotedMessage: () => void;
  onAttachFiles: (files: FileList | null) => void;
};

function parseMentionQuery(text: string) {
  const match = text.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
  return match ? match[1].toLowerCase() : null;
}

function parseSlashQuery(text: string) {
  const match = text.match(/(?:^|\n)\/([a-zA-Z-]*)$/);
  return match ? match[1].toLowerCase() : null;
}

function wrapWithMarkdown(value: string, selectionStart: number, selectionEnd: number, prefix: string, suffix = prefix) {
  const selectedText = value.slice(selectionStart, selectionEnd);
  const nextValue = `${value.slice(0, selectionStart)}${prefix}${selectedText}${suffix}${value.slice(selectionEnd)}`;
  return {
    value: nextValue,
    selectionStart: selectionStart + prefix.length,
    selectionEnd: selectionEnd + prefix.length + selectedText.length,
  };
}

function insertAtCursor(value: string, selectionStart: number, selectionEnd: number, text: string) {
  const nextValue = `${value.slice(0, selectionStart)}${text}${value.slice(selectionEnd)}`;
  const cursor = selectionStart + text.length;
  return { value: nextValue, selectionStart: cursor, selectionEnd: cursor };
}

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+==|\[[^\]]+\]\([^\)]+\))/g);

  return tokens.map((token, index) => {
    if (!token) return null;

    if (/^`[^`]+`$/.test(token)) {
      return (
        <Box
          key={`${index}-inline-code`}
          component="span"
          sx={{ px: 0.7, py: 0.15, mx: 0.2, borderRadius: 0.8, bgcolor: "#f3f4f6", border: "1px solid #e5e7eb", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}
        >
          {token.slice(1, -1)}
        </Box>
      );
    }

    if (/^\*\*[^*]+\*\*$/.test(token)) {
      return <Box key={`${index}-bold`} component="span" sx={{ fontWeight: 800 }}>{token.slice(2, -2)}</Box>;
    }

    if (/^\*[^*]+\*$/.test(token)) {
      return <Box key={`${index}-italic`} component="span" sx={{ fontStyle: "italic" }}>{token.slice(1, -1)}</Box>;
    }

    if (/^~~[^~]+~~$/.test(token)) {
      return <Box key={`${index}-strike`} component="span" sx={{ textDecoration: "line-through" }}>{token.slice(2, -2)}</Box>;
    }

    if (/^==[^=]+==$/.test(token)) {
      return <Box key={`${index}-highlight`} component="span" sx={{ px: 0.45, borderRadius: 0.7, bgcolor: "#fef08a" }}>{token.slice(2, -2)}</Box>;
    }

    const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (linkMatch) {
      return (
        <Box key={`${index}-link`} component="span" sx={{ color: "#2563eb", textDecoration: "underline" }}>
          {linkMatch[1]}
        </Box>
      );
    }

    return <Fragment key={`${index}-text`}>{token}</Fragment>;
  });
}

function renderMarkdownPreview(text: string) {
  const blocks = text.split(/```([\s\S]*?)```/g);

  return blocks.map((block, index) => {
    if (index % 2 === 1) {
      return (
        <Box
          key={`${index}-code-block`}
          component="pre"
          sx={{ my: 0.9, p: 1.2, borderRadius: 1.4, bgcolor: "#0f172a", color: "#e2e8f0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, overflowX: "auto" }}
        >
          {block.trim()}
        </Box>
      );
    }

    return block.split("\n").map((line, lineIndex) => {
      if (/^\s*>\s?/.test(line)) {
        return (
          <Box key={`${index}-${lineIndex}-quote`} sx={{ my: 0.35, pl: 1.1, borderLeft: "3px solid #cbd5e1", color: "#475569", fontStyle: "italic" }}>
            {renderInlineMarkdown(line.replace(/^\s*>\s?/, ""))}
          </Box>
        );
      }

      if (/^\s*-\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        return (
          <Typography key={`${index}-${lineIndex}-list`} sx={{ fontSize: 12.5, color: "#374151", lineHeight: 1.65 }}>
            {renderInlineMarkdown(line)}
          </Typography>
        );
      }

      return (
        <Typography key={`${index}-${lineIndex}-plain`} sx={{ fontSize: 12.5, color: "#374151", lineHeight: 1.65 }}>
          {renderInlineMarkdown(line || " ")}
        </Typography>
      );
    });
  });
}

export function ConnectMessageInput({
  conversationLabel,
  value,
  users,
  currentUserId,
  quotedMessage,
  onChange,
  onSend,
  onClearQuotedMessage,
  onAttachFiles,
}: ConnectMessageInputProps) {
  const [composerEmojiAnchor, setComposerEmojiAnchor] = useState<HTMLElement | null>(null);
  const [composerAttachAnchor, setComposerAttachAnchor] = useState<HTMLElement | null>(null);
  const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(null);
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [priorityFlag, setPriorityFlag] = useState<"normal" | "important" | "urgent">("normal");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);

  const mentionQuery = parseMentionQuery(value);
  const slashQuery = parseSlashQuery(value);
  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];

    return users
      .filter((user) => user.id !== currentUserId)
      .filter((user) => user.displayName.toLowerCase().includes(mentionQuery))
      .slice(0, 6);
  }, [mentionQuery, users, currentUserId]);

  const slashCommands = useMemo(
    () => [
      { id: "assign", label: "/assign", description: "Assign and notify a teammate", insertText: "@[] please review this\n" },
      { id: "urgent", label: "/urgent", description: "Mark message as urgent", insertText: "[URGENT] " },
      { id: "important", label: "/important", description: "Mark message as important", insertText: "[IMPORTANT] " },
      { id: "schedule", label: "/schedule", description: "Schedule for later", insertText: "[SCHEDULE: tomorrow 09:00] " },
      { id: "gif", label: "/gif", description: "Insert a GIF placeholder", insertText: "[GIF: search-term] " },
      { id: "table", label: "/table", description: "Insert markdown table", insertText: "| Column A | Column B |\n| --- | --- |\n| Value 1 | Value 2 |\n" },
      { id: "bot", label: "/bot", description: "Message extension or bot command", insertText: "@bot " },
    ],
    []
  );

  const slashSuggestions = useMemo(() => {
    if (slashQuery === null) return [];
    return slashCommands.filter((command) => command.label.toLowerCase().includes(`/${slashQuery}`)).slice(0, 6);
  }, [slashCommands, slashQuery]);

  const composerAttachItems: NonBlockingMenuItem[] = [
    {
      id: "attach-file",
      label: "Attach File",
      icon: <DescriptionOutlined fontSize="small" />,
      onClick: () => fileInputRef.current?.click(),
    },
    { id: "attach-link", label: "Attach cloud link", icon: <LinkRounded fontSize="small" /> },
    { id: "gif", label: "Insert GIF", icon: <SentimentSatisfiedAltRounded fontSize="small" /> },
    { id: "sticker", label: "Insert sticker", icon: <SentimentSatisfiedAltRounded fontSize="small" /> },
    { id: "schedule", label: "Schedule message", icon: <NotificationsNoneRounded fontSize="small" /> },
    { id: "delivery", label: "Set delivery options", icon: <MailOutlineRounded fontSize="small" /> },
    { id: "video", label: "Record a video clip", icon: <VideocamRounded fontSize="small" /> },
    { id: "voice", label: "Record a voice clip", icon: <VideocamRounded fontSize="small" /> },
    { id: "loop", label: "Insert loop component", icon: <TableRowsRounded fontSize="small" /> },
  ];

  const priorityItems: NonBlockingMenuItem[] = [
    {
      id: "normal",
      label: "Normal",
      icon: <PriorityHighRounded fontSize="small" />,
      onClick: () => setPriorityFlag("normal"),
    },
    {
      id: "important",
      label: "Important",
      icon: <PriorityHighRounded fontSize="small" />,
      onClick: () => setPriorityFlag("important"),
    },
    {
      id: "urgent",
      label: "Urgent",
      icon: <PriorityHighRounded fontSize="small" />,
      onClick: () => setPriorityFlag("urgent"),
    },
  ];

  function handleMentionPick(displayName: string) {
    onChange(value.replace(/(?:^|\s)@[a-zA-Z0-9._-]*$/, (match) => `${match.startsWith(" ") ? " " : ""}@[${displayName}] `));
  }

  function handleSlashPick(insertText: string) {
    const next = value.replace(/(?:^|\n)\/[a-zA-Z-]*$/, (match) => `${match.startsWith("\n") ? "\n" : ""}${insertText}`);
    onChange(next);
  }

  function updateValueAndSelection(nextValue: string, selectionStart: number, selectionEnd: number) {
    onChange(nextValue);
    window.requestAnimationFrame(() => {
      composerInputRef.current?.focus();
      composerInputRef.current?.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function applyMarkdown(prefix: string, suffix = prefix) {
    const input = composerInputRef.current;
    if (!input) return;

    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const result = wrapWithMarkdown(value, selectionStart, selectionEnd, prefix, suffix);
    updateValueAndSelection(result.value, result.selectionStart, result.selectionEnd);
  }

  function insertSnippet(snippet: string) {
    const input = composerInputRef.current;
    if (!input) return;

    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const result = insertAtCursor(value, selectionStart, selectionEnd, snippet);
    updateValueAndSelection(result.value, result.selectionStart, result.selectionEnd);
  }

  function handleSend() {
    const nextContent = value.trim();
    if (!nextContent) {
      return;
    }

    const mentionNameMatches = [...nextContent.matchAll(/@\[([^\]]+)\]/g)].map((match) => match[1].trim().toLowerCase());
    const mentionUserIds = users
      .filter((user) => mentionNameMatches.includes(user.displayName.toLowerCase()))
      .map((user) => user.id);

    const priorityPrefix = priorityFlag === "normal" ? "" : priorityFlag === "important" ? "[IMPORTANT] " : "[URGENT] ";

    onSend({ content: `${priorityPrefix}${nextContent}`, mentionUserIds });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onAttachFiles(event.target.files);
    event.currentTarget.value = "";
  }

  return (
    <Box sx={{ p: 3, pt: 0, flexShrink: 0, position: "relative" }}>
      {slashQuery !== null && slashSuggestions.length > 0 ? (
        <Box
          sx={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 138,
            bgcolor: "#fff",
            border: "1px solid #eef2f7",
            borderRadius: 2,
            boxShadow: "0 12px 24px rgba(15,23,42,0.1)",
            zIndex: 31,
          }}
        >
          <Typography
            sx={{
              px: 1.5,
              py: 1,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#9ca3af",
              textTransform: "uppercase",
            }}
          >
            Slash Commands
          </Typography>
          <Stack spacing={0.3} sx={{ pb: 1 }}>
            {slashSuggestions.map((command) => (
              <Stack
                key={command.id}
                direction="row"
                spacing={1}
                onClick={() => handleSlashPick(command.insertText)}
                sx={{ px: 1.5, py: 0.8, alignItems: "center", justifyContent: "space-between", cursor: "pointer", "&:hover": { bgcolor: "#f9fafb" } }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{command.label}</Typography>
                <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{command.description}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      {mentionQuery !== null && mentionSuggestions.length > 0 ? (
        <Box
          sx={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 138,
            bgcolor: "#fff",
            border: "1px solid #eef2f7",
            borderRadius: 2,
            boxShadow: "0 12px 24px rgba(15,23,42,0.1)",
            zIndex: 30,
          }}
        >
          <Typography
            sx={{
              px: 1.5,
              py: 1,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#9ca3af",
              textTransform: "uppercase",
            }}
          >
            Mention People
          </Typography>
          <Stack spacing={0.3} sx={{ pb: 1 }}>
            {mentionSuggestions.map((user) => (
              <Stack
                key={user.id}
                direction="row"
                spacing={1}
                onClick={() => handleMentionPick(user.displayName)}
                sx={{ px: 1.5, py: 0.8, alignItems: "center", cursor: "pointer", "&:hover": { bgcolor: "#f9fafb" } }}
              >
                <Box
                  component="img"
                  src={user.avatar}
                  alt={user.displayName}
                  sx={{ width: 22, height: 22, borderRadius: "999px", objectFit: "cover" }}
                />
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{user.displayName}</Typography>
                  <Typography sx={{ fontSize: 11, color: "#6b7280" }}>{user.subtitle}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box sx={{ border: "2px solid #fccf14", borderRadius: 1, bgcolor: "#fff", p: 0.5, boxShadow: "0 8px 20px rgba(252, 207, 20, 0.08)" }}>
        {quotedMessage ? (
          <Stack
            direction="row"
            sx={{ px: 1.5, py: 0.8, borderBottom: "1px solid #f9fafb", alignItems: "center", justifyContent: "space-between", bgcolor: "#fffbeb", borderRadius: 1.5, mx: 1, mt: 1 }}
          >
            <Box>
              <Typography sx={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>
                Replying to {quotedMessage.senderName}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#78350f" }} noWrap>
                {quotedMessage.content}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClearQuotedMessage}>
              <CloseRounded sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        ) : null}

        <TextField
          inputRef={composerInputRef}
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          placeholder={`Message ${conversationLabel}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
              event.preventDefault();
              const input = composerInputRef.current;
              if (!input) return;

              const selectionStart = input.selectionStart ?? 0;
              const selectionEnd = input.selectionEnd ?? selectionStart;
              if (selectionStart === selectionEnd) {
                const result = insertAtCursor(value, selectionStart, selectionEnd, "****");
                updateValueAndSelection(result.value, selectionStart + 2, selectionStart + 2);
              } else {
                const selectedText = value.slice(selectionStart, selectionEnd);
                const isAlreadyBold = selectedText.startsWith("**") && selectedText.endsWith("**") && selectedText.length >= 4;
                if (isAlreadyBold) {
                  const unwrapped = `${value.slice(0, selectionStart)}${selectedText.slice(2, -2)}${value.slice(selectionEnd)}`;
                  updateValueAndSelection(unwrapped, selectionStart, selectionEnd - 4);
                } else {
                  const wrapped = wrapWithMarkdown(value, selectionStart, selectionEnd, "**");
                  updateValueAndSelection(wrapped.value, wrapped.selectionStart, wrapped.selectionEnd);
                }
              }
              return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
              event.preventDefault();
              applyMarkdown("*");
              return;
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u") {
              event.preventDefault();
              applyMarkdown("<u>", "</u>");
              return;
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          variant="standard"
          slotProps={{ input: { disableUnderline: true } }}
          sx={{ px: 2, py: 1.5 }}
        />

        {formattingOpen ? (
          <Stack direction="row" spacing={0.45} sx={{ px: 1.5, py: 0.8, borderTop: "1px solid #f9fafb", borderBottom: "1px solid #f9fafb", flexWrap: "wrap", rowGap: 0.6 }}>
            <IconButton size="small" onClick={() => applyMarkdown("**")}><FormatBoldRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("*")}><FormatItalicRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("<u>", "</u>")}><FormatUnderlinedRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("~~")}><FormatStrikethroughRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("==")}><FormatColorFillRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("`", "`")}><CodeRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("```\n", "\n```")}><MoreVertRounded sx={{ fontSize: 16, transform: "rotate(90deg)" }} /></IconButton>
            <Divider orientation="vertical" flexItem />
            <IconButton size="small" onClick={() => insertSnippet("- ")}><FormatListBulletedRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => insertSnippet("1. ")}><FormatListNumberedRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => insertSnippet("> ")}><FormatQuoteRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("[", "](https://)")}><LinkRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => insertSnippet("| Column A | Column B |\n| --- | --- |\n| Value 1 | Value 2 |\n")}><TableRowsRounded sx={{ fontSize: 16 }} /></IconButton>
            <IconButton size="small" onClick={() => applyMarkdown('<span style="font-size:14px">', "</span>")}><FormatSizeRounded sx={{ fontSize: 16 }} /></IconButton>
          </Stack>
        ) : null}

        {/* <Box sx={{ mx: 1.5, mt: 1, mb: 0.5, p: 1.1, borderRadius: 1.25, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.4 }}>
            Live Preview
          </Typography>
          <Box sx={{ minHeight: 26 }}>
            {value.trim() ? renderMarkdownPreview(value) : <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>Start typing to preview formatting and code blocks.</Typography>}
          </Box>
        </Box> */}

        {/* <Box sx={{ mx: 1.5, mb: 0.6, p: 1, borderRadius: 1.1, bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
          <Typography sx={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>Shortcuts: Ctrl/Cmd+B bold, Ctrl/Cmd+I italic, Ctrl/Cmd+U underline, Shift+Enter newline.</Typography>
          <Typography sx={{ fontSize: 11, color: "#a16207", mt: 0.3 }}>Use `/` for commands, `@` mentions people/channels/teams, and markdown like `**bold**`, ``inline code``, or ```code blocks```.</Typography>
        </Box> */}

        <Stack direction="row" sx={{ px: 1.5, py: 1, borderTop: "1px solid #f9fafb", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => setFormattingOpen((previous) => !previous)}>
              <EditRounded sx={{ fontSize: 18, color: formattingOpen ? "#2563eb" : undefined }} />
            </IconButton>
            <IconButton size="small" onClick={(event) => setComposerEmojiAnchor(event.currentTarget)}>
              <SentimentSatisfiedAltRounded sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" onClick={(event) => setComposerAttachAnchor(event.currentTarget)}>
              <AddRounded sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" onClick={(event) => setPriorityAnchor(event.currentTarget)}>
              <PriorityHighRounded sx={{ fontSize: 18, color: priorityFlag === "normal" ? "#6b7280" : priorityFlag === "important" ? "#f59e0b" : "#ef4444" }} />
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            {priorityFlag !== "normal" ? (
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: priorityFlag === "important" ? "#b45309" : "#b91c1c", bgcolor: priorityFlag === "important" ? "#fef3c7" : "#fee2e2", px: 0.8, py: 0.25, borderRadius: 1 }}>
                {priorityFlag === "important" ? "Important" : "Urgent"}
              </Typography>
            ) : null}
            <Button
              size="small"
              startIcon={<SendRounded sx={{ fontSize: 12 }} />}
              onClick={handleSend}
              sx={{ bgcolor: "#fccf14", color: "#111827", fontWeight: 700, "&:hover": { bgcolor: "#facc15" } }}
            >
              Send
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Popover
        open={Boolean(composerEmojiAnchor)}
        anchorEl={composerEmojiAnchor}
        onClose={() => setComposerEmojiAnchor(null)}
        disableScrollLock
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <EmojiPicker
          width={320}
          height={380}
          onEmojiClick={(emojiData: EmojiClickData) => {
            onChange(`${value}${emojiData.emoji}`);
            setComposerEmojiAnchor(null);
          }}
        />
      </Popover>

      <NonBlockingMenu
        anchorEl={composerAttachAnchor}
        open={Boolean(composerAttachAnchor)}
        onClose={() => setComposerAttachAnchor(null)}
        items={composerAttachItems}
      />

      <NonBlockingMenu
        anchorEl={priorityAnchor}
        open={Boolean(priorityAnchor)}
        onClose={() => setPriorityAnchor(null)}
        items={priorityItems}
      />

      <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
    </Box>
  );
}
