"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  AddRounded,
  CheckRounded,
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
  NotificationsActiveRounded,
  NotificationsNoneRounded,
  OpenInNewRounded,
  PriorityHighRounded,
  SendRounded,
  SentimentSatisfiedAltRounded,
  TableRowsRounded,
  VideocamRounded,
} from "@mui/icons-material";
import { Box, Button, Divider, IconButton, Popover, Stack, TextField, Typography } from "@dhriti/ui";
import { ConnectCascadingMenuItem } from "@/types/menu.types";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConnectMentionUser, ConnectPendingAttachment } from "@/types/connect.types";

type ConnectMessageInputProps = {
  conversationLabel: string;
  value: string;
  users: ConnectMentionUser[];
  currentUserId: string;
  quotedMessage?: {
    senderName: string;
    content: string;
  } | null;
  pendingAttachments?: ConnectPendingAttachment[];
  onChange: (value: string) => void;
  onSend: (payload: { content: string; mentionUserIds: string[] }) => void;
  onClearQuotedMessage: () => void;
  onAttachFiles: (files: FileList | null) => void;
  onRemovePendingAttachment?: (attachmentId: string) => void;
  mode?: "compose" | "edit";
  onCancelEdit?: () => void;
};

function parseMentionQuery(text: string) {
  const match = text.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
  return match ? match[1].toLowerCase() : null;
}

function parseSlashQuery(text: string) {
  const match = text.match(/(?:^|\n)\/([a-zA-Z-]*)$/);
  return match ? match[1].toLowerCase() : null;
}

function wrapWithMarkdown(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix = prefix,
) {
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

const RAW_URL_PATTERN = /(^|\s)(https?:\/\/[^\s<>)]+)(?=$|\s)/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;

function getUrlMeta(url: string) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    return {
      domain,
      href: parsed.href,
      thumbnail: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`,
    };
  } catch {
    return null;
  }
}

function normalizePastedLinks(text: string) {
  return text.replace(RAW_URL_PATTERN, (match, prefix: string, url: string) => {
    const meta = getUrlMeta(url);
    return meta ? `${prefix}[${meta.domain}](${meta.href})` : match;
  });
}

function extractDraftLinks(text: string) {
  const links: Array<{ url: string; domain: string; thumbnail: string }> = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(MARKDOWN_LINK_PATTERN)) {
    const meta = getUrlMeta(match[2]);
    if (meta && !seen.has(meta.href)) {
      links.push({ url: meta.href, domain: meta.domain, thumbnail: meta.thumbnail });
      seen.add(meta.href);
    }
  }

  for (const match of text.matchAll(RAW_URL_PATTERN)) {
    const meta = getUrlMeta(match[2]);
    if (meta && !seen.has(meta.href)) {
      links.push({ url: meta.href, domain: meta.domain, thumbnail: meta.thumbnail });
      seen.add(meta.href);
    }
  }

  return links;
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
          sx={{
            px: 0.7,
            py: 0.15,
            mx: 0.2,
            borderRadius: (theme) => theme.tokens.radius.sm,
            bgcolor: "surfaces.surfaceHover",
            border: 1,
            borderColor: "borders.border",
            fontFamily: "monospace",
            fontSize: "0.75rem",
          }}
        >
          {token.slice(1, -1)}
        </Box>
      );
    }

    if (/^\*\*[^*]+\*\*$/.test(token)) {
      return (
        <Box key={`${index}-bold`} component="span" sx={{ fontWeight: 800 }}>
          {token.slice(2, -2)}
        </Box>
      );
    }

    if (/^\*[^*]+\*$/.test(token)) {
      return (
        <Box key={`${index}-italic`} component="span" sx={{ fontStyle: "italic" }}>
          {token.slice(1, -1)}
        </Box>
      );
    }

    if (/^~~[^~]+~~$/.test(token)) {
      return (
        <Box key={`${index}-strike`} component="span" sx={{ textDecoration: "line-through" }}>
          {token.slice(2, -2)}
        </Box>
      );
    }

    if (/^==[^=]+==$/.test(token)) {
      return (
        <Box
          key={`${index}-highlight`}
          component="span"
          sx={{ px: 0.45, borderRadius: (theme) => theme.tokens.radius.sm, bgcolor: "warning.light" }}
        >
          {token.slice(2, -2)}
        </Box>
      );
    }

    const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (linkMatch) {
      return (
        <Box
          key={`${index}-link`}
          component="span"
          sx={{ color: "interactive.interactive", textDecoration: "underline" }}
        >
          {linkMatch[1]}
        </Box>
      );
    }

    return <Fragment key={`${index}-text`}>{token}</Fragment>;
  });
}

export function ConnectMessageInput({
  conversationLabel,
  value,
  users,
  currentUserId,
  quotedMessage,
  pendingAttachments = [],
  onChange,
  onSend,
  onClearQuotedMessage,
  onAttachFiles,
  onRemovePendingAttachment,
  mode = "compose",
  onCancelEdit,
}: ConnectMessageInputProps) {
  const [draftValue, setDraftValue] = useState(value);
  const [composerEmojiAnchor, setComposerEmojiAnchor] = useState<HTMLElement | null>(null);
  const [composerAttachAnchor, setComposerAttachAnchor] = useState<HTMLElement | null>(null);
  const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(null);
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [priorityFlag, setPriorityFlag] = useState<"normal" | "important" | "urgent">("normal");
  const isEditing = mode === "edit";
  const lastSyncedValueRef = useRef(value);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (value === lastSyncedValueRef.current) return;

    setDraftValue(value);
  }, [value]);

  useEffect(() => {
    if (draftValue === value) return;

    const syncTimer = window.setTimeout(() => {
      lastSyncedValueRef.current = draftValue;
      onChange(draftValue);
    }, 120);

    return () => window.clearTimeout(syncTimer);
  }, [draftValue, onChange, value]);

  const mentionQuery = parseMentionQuery(draftValue);
  const slashQuery = parseSlashQuery(draftValue);
  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];

    return users
      .filter((user) => user.id !== currentUserId)
      .filter((user) => user.displayName.toLowerCase().includes(mentionQuery))
      .slice(0, 6);
  }, [mentionQuery, users, currentUserId]);

  const slashCommands = useMemo(
    () => [
      {
        id: "assign",
        label: "/assign",
        description: "Assign and notify a teammate",
        insertText: "@[] please review this\n",
      },
      { id: "urgent", label: "/urgent", description: "Mark message as urgent", insertText: "[URGENT] " },
      { id: "important", label: "/important", description: "Mark message as important", insertText: "[IMPORTANT] " },
      {
        id: "schedule",
        label: "/schedule",
        description: "Schedule for later",
        insertText: "[SCHEDULE: tomorrow 09:00] ",
      },
      { id: "gif", label: "/gif", description: "Insert a GIF placeholder", insertText: "[GIF: search-term] " },
      {
        id: "table",
        label: "/table",
        description: "Insert markdown table",
        insertText: "| Column A | Column B |\n| --- | --- |\n| Value 1 | Value 2 |\n",
      },
      { id: "bot", label: "/bot", description: "Message extension or bot command", insertText: "@bot " },
    ],
    [],
  );

  const slashSuggestions = useMemo(() => {
    if (slashQuery === null) return [];
    return slashCommands.filter((command) => command.label.toLowerCase().includes(`/${slashQuery}`)).slice(0, 6);
  }, [slashCommands, slashQuery]);

  const draftLinks = useMemo(() => extractDraftLinks(draftValue), [draftValue]);

  const priorityItems = useMemo<ConnectCascadingMenuItem[]>(
    () => [
      {
        id: "normal",
        label: "Standard",
        description: "Message will be sent as usual",
        icon: <MailOutlineRounded fontSize="small" />,
        selected: priorityFlag === "normal",
        onClick: () => setPriorityFlag("normal"),
      },
      {
        id: "important",
        label: "Important",
        description: "Message will be marked as important",
        icon: <PriorityHighRounded sx={{ color: "warning.dark" }} fontSize="small" />,
        selected: priorityFlag === "important",
        onClick: () => setPriorityFlag("important"),
      },
      {
        id: "urgent",
        label: "Urgent",
        description: "Recipient notified every 2 min for 20 min",
        icon: <NotificationsActiveRounded sx={{ color: "error.main" }} fontSize="small" />,
        selected: priorityFlag === "urgent",
        onClick: () => setPriorityFlag("urgent"),
      },
    ],
    [priorityFlag],
  );

  const composerAttachItems = useMemo<ConnectCascadingMenuItem[]>(
    () => [
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
      {
        id: "delivery",
        label: "Message delivery",
        icon: <MailOutlineRounded fontSize="small" />,
        children: priorityItems,
      },
      { id: "video", label: "Record a video clip", icon: <VideocamRounded fontSize="small" /> },
      { id: "voice", label: "Record a voice clip", icon: <VideocamRounded fontSize="small" /> },
      { id: "loop", label: "Insert loop component", icon: <TableRowsRounded fontSize="small" /> },
    ],
    [priorityItems],
  );

  function handleMentionPick(displayName: string) {
    setDraftValue(
      draftValue.replace(
        /(?:^|\s)@[a-zA-Z0-9._-]*$/,
        (match) => `${match.startsWith(" ") ? " " : ""}@[${displayName}] `,
      ),
    );
  }

  function handleSlashPick(insertText: string) {
    const next = draftValue.replace(
      /(?:^|\n)\/[a-zA-Z-]*$/,
      (match) => `${match.startsWith("\n") ? "\n" : ""}${insertText}`,
    );
    setDraftValue(next);
  }

  function updateValueAndSelection(nextValue: string, selectionStart: number, selectionEnd: number) {
    setDraftValue(nextValue);
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
    const result = wrapWithMarkdown(draftValue, selectionStart, selectionEnd, prefix, suffix);
    updateValueAndSelection(result.value, result.selectionStart, result.selectionEnd);
  }

  function insertSnippet(snippet: string) {
    const input = composerInputRef.current;
    if (!input) return;

    const selectionStart = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const result = insertAtCursor(draftValue, selectionStart, selectionEnd, snippet);
    updateValueAndSelection(result.value, result.selectionStart, result.selectionEnd);
  }

  function handleSend() {
    const nextContent = draftValue.trim();
    if (!nextContent && pendingAttachments.length === 0) {
      return;
    }

    const mentionNameMatches = [...nextContent.matchAll(/@\[([^\]]+)\]/g)].map((match) =>
      match[1].trim().toLowerCase(),
    );
    const mentionUserIds = users
      .filter((user) => mentionNameMatches.includes(user.displayName.toLowerCase()))
      .map((user) => user.id);

    const priorityPrefix =
      isEditing || priorityFlag === "normal" ? "" : priorityFlag === "important" ? "[IMPORTANT] " : "[URGENT] ";

    onSend({ content: `${priorityPrefix}${nextContent}`, mentionUserIds });
    lastSyncedValueRef.current = "";
    setDraftValue("");
    setPriorityFlag("normal");
    onChange("");
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
            bgcolor: "background.paper",
            border: 1,
            borderColor: "borders.borderSubtle",
            borderRadius: (theme) => theme.tokens.radius.md,
            boxShadow: (theme) => theme.tokens.elevation.medium,
            zIndex: "modal",
          }}
        >
          <Typography
            sx={{
              px: 1.5,
              py: 1,
              color: "text.disabled",
            }}
            variant="overline"
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
                sx={{
                  px: 1.5,
                  py: 0.8,
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "surfaces.surfaceHover" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {command.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {command.description}
                </Typography>
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
            bgcolor: "background.paper",
            border: 1,
            borderColor: "borders.borderSubtle",
            borderRadius: (theme) => theme.tokens.radius.md,
            boxShadow: (theme) => theme.tokens.elevation.medium,
            zIndex: "modal",
          }}
        >
          <Typography
            sx={{
              px: 1.5,
              py: 1,
              color: "text.disabled",
            }}
            variant="overline"
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
                sx={{
                  px: 1.5,
                  py: 0.8,
                  alignItems: "center",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "surfaces.surfaceHover" },
                }}
              >
                <Box
                  component="img"
                  src={user.avatar}
                  alt={user.displayName}
                  sx={{ width: 22, height: 22, borderRadius: "999px", objectFit: "cover" }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.subtitle}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Box
        sx={{
          border: 1,
          borderColor: "borders.borderSubtle",
          borderRadius: (theme) => theme.tokens.radius.lg,
          bgcolor: "background.paper",
          p: 0.5,
          boxShadow: (theme) => theme.tokens.elevation.subtle,
          overflow: "hidden",
        }}
      >
        {quotedMessage ? (
          <Stack
            direction="row"
            sx={{
              mb: 1,
              py: 3,
              px: 3,
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "background.paper",
              borderLeft: 3,
              borderColor: "primary.main",
              borderRadius: (theme) => theme.tokens.radius.sm,
              mx: 1,
              mt: 1,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
                Replying to {quotedMessage.senderName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {quotedMessage.content}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClearQuotedMessage}>
              <CloseRounded sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        ) : null}

        {!isEditing && pendingAttachments.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ px: 1.5, pt: 1, flexWrap: "wrap", rowGap: 1 }}>
            {pendingAttachments.map((attachment) => (
              <Box
                key={attachment.id}
                sx={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  borderRadius: (theme) => theme.tokens.radius.sm,
                  overflow: "hidden",
                  border: 1,
                  borderColor: "borders.border",
                  bgcolor: "surfaces.surfaceHover",
                }}
              >
                {attachment.type.startsWith("image/") ? (
                  <Box
                    component="img"
                    src={attachment.url}
                    alt={attachment.name}
                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : attachment.type.startsWith("video/") ? (
                  <Box
                    component="video"
                    src={attachment.url}
                    muted
                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <Stack
                    sx={{
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "info.main",
                      px: 0.5,
                    }}
                  >
                    <DescriptionOutlined sx={{ fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, textAlign: "center" }} noWrap>
                      {attachment.name}
                    </Typography>
                  </Stack>
                )}
                <IconButton
                  size="small"
                  onClick={() => onRemovePendingAttachment?.(attachment.id)}
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    bgcolor: "grey.900",
                    color: "common.white",
                    opacity: 0.78,
                    "&:hover": { bgcolor: "grey.900", opacity: 0.9 },
                  }}
                >
                  <CloseRounded sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
            ))}
          </Stack>
        ) : null}

        {!isEditing && draftLinks.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ px: 1.5, pt: 1, flexWrap: "wrap", rowGap: 1 }}>
            {draftLinks.map((link) => (
              <Stack
                key={link.url}
                direction="row"
                spacing={1}
                sx={{
                  width: 220,
                  p: 1,
                  borderRadius: (theme) => theme.tokens.radius.sm,
                  border: 1,
                  borderColor: "borders.border",
                  bgcolor: "surfaces.surfaceHover",
                  alignItems: "center",
                }}
              >
                <Box
                  component="img"
                  src={link.thumbnail}
                  alt=""
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: (theme) => theme.tokens.radius.sm,
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "borders.borderSubtle",
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800 }} noWrap>
                    {link.domain}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {link.url}
                  </Typography>
                </Box>
                <IconButton size="small" component="a" href={link.url} target="_blank" rel="noreferrer">
                  <OpenInNewRounded sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        ) : null}

        <TextField
          inputRef={composerInputRef}
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          placeholder={isEditing ? "Edit message" : `Message ${conversationLabel}`}
          value={draftValue}
          onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setDraftValue(normalizePastedLinks(event.target.value))
          }
          onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
              event.preventDefault();
              const input = composerInputRef.current;
              if (!input) return;

              const selectionStart = input.selectionStart ?? 0;
              const selectionEnd = input.selectionEnd ?? selectionStart;
              if (selectionStart === selectionEnd) {
                const result = insertAtCursor(draftValue, selectionStart, selectionEnd, "****");
                updateValueAndSelection(result.value, selectionStart + 2, selectionStart + 2);
              } else {
                const selectedText = draftValue.slice(selectionStart, selectionEnd);
                const isAlreadyBold =
                  selectedText.startsWith("**") && selectedText.endsWith("**") && selectedText.length >= 4;
                if (isAlreadyBold) {
                  const unwrapped = `${draftValue.slice(0, selectionStart)}${selectedText.slice(2, -2)}${draftValue.slice(selectionEnd)}`;
                  updateValueAndSelection(unwrapped, selectionStart, selectionEnd - 4);
                } else {
                  const wrapped = wrapWithMarkdown(draftValue, selectionStart, selectionEnd, "**");
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

        {!isEditing && formattingOpen ? (
          <Stack
            direction="row"
            spacing={0.45}
            sx={{
              px: 1.5,
              py: 0.8,
              borderTop: 1,
              borderBottom: 1,
              borderColor: "borders.borderSubtle",
              flexWrap: "wrap",
              rowGap: 0.6,
            }}
          >
            <IconButton size="small" onClick={() => applyMarkdown("**")}>
              <FormatBoldRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("*")}>
              <FormatItalicRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("<u>", "</u>")}>
              <FormatUnderlinedRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("~~")}>
              <FormatStrikethroughRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("==")}>
              <FormatColorFillRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("`", "`")}>
              <CodeRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("```\n", "\n```")}>
              <MoreVertRounded sx={{ fontSize: 20, transform: "rotate(90deg)" }} />
            </IconButton>
            <Divider orientation="vertical" flexItem />
            <IconButton size="small" onClick={() => insertSnippet("- ")}>
              <FormatListBulletedRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => insertSnippet("1. ")}>
              <FormatListNumberedRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => insertSnippet("> ")}>
              <FormatQuoteRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown("[", "](https://)")}>
              <LinkRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => insertSnippet("| Column A | Column B |\n| --- | --- |\n| Value 1 | Value 2 |\n")}
            >
              <TableRowsRounded sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => applyMarkdown('<span style="font-size:14px">', "</span>")}>
              <FormatSizeRounded sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        ) : null}

        <Stack
          direction="row"
          sx={{
            px: 1.5,
            py: 1,
            borderTop: 1,
            borderColor: "borders.borderSubtle",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={0.5}>
            {!isEditing ? (
              <>
                <IconButton size="small" onClick={() => setFormattingOpen((previous) => !previous)}>
                  <EditRounded sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => setComposerEmojiAnchor(event.currentTarget)}
                >
                  <SentimentSatisfiedAltRounded sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => setComposerAttachAnchor(event.currentTarget)}
                >
                  <AddRounded sx={{ fontSize: 20 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => setPriorityAnchor(event.currentTarget)}
                >
                  {priorityFlag === "urgent" ? (
                    <NotificationsActiveRounded sx={{ fontSize: 20, color: "error.main" }} />
                  ) : (
                    <PriorityHighRounded
                      sx={{ fontSize: 20, color: priorityFlag === "normal" ? "text.secondary" : "warning.dark" }}
                    />
                  )}
                </IconButton>
              </>
            ) : null}
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            {!isEditing && priorityFlag !== "normal" ? (
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: priorityFlag === "important" ? "warning.dark" : "error.main",
                  px: 0.8,
                  py: 0.25,
                }}
              >
                {priorityFlag === "urgent" ? (
                  <NotificationsActiveRounded sx={{ fontSize: 14, mr: 0.4, verticalAlign: "middle" }} />
                ) : (
                  <PriorityHighRounded sx={{ fontSize: 14, mr: 0.4, verticalAlign: "middle" }} />
                )}
                {priorityFlag === "important" ? "Important" : "Urgent"}
              </Typography>
            ) : null}
            {isEditing ? (
              <>
                <IconButton size="small" aria-label="Cancel edit" onClick={onCancelEdit}>
                  <CloseRounded sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" aria-label="Save edit" onClick={handleSend}>
                  <CheckRounded sx={{ fontSize: 18 }} />
                </IconButton>
              </>
            ) : (
              <Button
                size="small"
                startIcon={<SendRounded sx={{ fontSize: 12 }} />}
                onClick={handleSend}
                variant="contained"
                sx={{ fontWeight: 700 }}
              >
                Send
              </Button>
            )}
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
            setDraftValue(`${draftValue}${emojiData.emoji}`);
            setComposerEmojiAnchor(null);
          }}
        />
      </Popover>

      <ConnectCascadingMenu
        anchorEl={composerAttachAnchor}
        open={Boolean(composerAttachAnchor)}
        onClose={() => setComposerAttachAnchor(null)}
        items={composerAttachItems}
      />

      <ConnectCascadingMenu
        anchorEl={priorityAnchor}
        open={Boolean(priorityAnchor)}
        onClose={() => setPriorityAnchor(null)}
        items={priorityItems}
      />

      <Box
        component="input"
        ref={fileInputRef}
        type="file"
        multiple
        sx={{ display: "none" }}
        onChange={handleFileChange}
      />
    </Box>
  );
}
