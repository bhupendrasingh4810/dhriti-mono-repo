"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { useAppSettings, useConnectUserSettings } from "@/features/settings/use-app-settings";
import {
  Bell,
  Bold,
  Check,
  Code2,
  ExternalLink,
  FileText,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Mail,
  MoreHorizontal,
  PencilLine,
  Plus,
  Quote,
  Send,
  Smile,
  Star,
  Strikethrough,
  Table2,
  Type,
  Underline,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import type { ConnectMentionUser, ConnectPendingAttachment, IconName } from "@/types/connect.types";

type ConnectMessageInputProps = {
  conversationLabel: string;
  value: string;
  users: ConnectMentionUser[];
  currentUserId: string;
  quotedMessage?: { senderName: string; content: string } | null;
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
  return text.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/)?.[1].toLowerCase() ?? null;
}

function parseSlashQuery(text: string) {
  return text.match(/(?:^|\n)\/([a-zA-Z-]*)$/)?.[1].toLowerCase() ?? null;
}

function markdownToEditorHtml(markdown: string) {
  const escaped = markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(/```(?:[^\n]*)\n?([\s\S]*?)```/g, "<pre>$1</pre>")
    .replace(
      /`([^`\n]+)`/g,
      '<code data-connect-inline-code="true" contenteditable="false" class="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs">$1</code>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>")
    .replace(/==([^=]+)==/g, "<mark>$1</mark>")
    .replace(/&lt;u&gt;(.+?)&lt;\/u&gt;/g, "<u>$1</u>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2">$1</a>')
    .replace(
      /@\[([^\]]+)\]/g,
      '<span data-connect-mention="true" contenteditable="false" class="font-bold text-brand">$1</span>',
    )
    .replace(/\n/g, "<br>");
}

function editorHtmlToMarkdown(element: HTMLElement) {
  function serialize(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof HTMLElement)) return "";
    const content = Array.from(node.childNodes).map(serialize).join("");
    switch (node.tagName) {
      case "BR":
        return "\n";
      case "STRONG":
      case "B":
        return `**${content}**`;
      case "EM":
      case "I":
        return `*${content}*`;
      case "U":
        return `<u>${content}</u>`;
      case "S":
      case "STRIKE":
        return `~~${content}~~`;
      case "MARK":
        return `==${content}==`;
      case "CODE":
        return `\`${content}\``;
      case "PRE":
        return `\`\`\`\n${content}\n\`\`\``;
      case "A": {
        if (!(node instanceof HTMLAnchorElement)) return content;
        return node.href.startsWith("http") ? `[${content}](${node.href})` : content;
      }
      case "SPAN":
        return node.dataset.connectMention === "true" ? `@[${content}]` : content;
      case "UL":
        return `${Array.from(node.children)
          .map((child) => `- ${serialize(child).trimEnd()}`)
          .join("\n")}\n`;
      case "OL":
        return `${Array.from(node.children)
          .map((child, index) => `${index + 1}. ${serialize(child).trimEnd()}`)
          .join("\n")}\n`;
      case "LI":
        return content;
      case "DIV":
      case "P":
        return `${content}\n`;
      default:
        return content;
    }
  }

  return Array.from(element.childNodes)
    .map(serialize)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

const RAW_URL_PATTERN = /(^|\s)(https?:\/\/[^\s<>\)]+)(?=$|\s)/g;
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

export default function ConnectMessageInput({
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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [composerAttachAnchor, setComposerAttachAnchor] = useState<HTMLElement | null>(null);
  const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(null);
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [priorityFlag, setPriorityFlag] = useState<"normal" | "important" | "urgent">("normal");
  const [activeFormats, setActiveFormats] = useState<Partial<Record<IconName, boolean>>>({});
  const lastSyncedValueRef = useRef(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLDivElement>(null);
  const isEditing = mode === "edit";
  const connectPolicy = useAppSettings("connect");
  const sendShortcut = useConnectUserSettings()?.sendShortcut ?? "ENTER";
  const maxMessageLength = connectPolicy?.maxMessageLength ?? null;
  const messageLength = draftValue.trim().length;
  const overLimit = maxMessageLength !== null && messageLength > maxMessageLength;

  useEffect(() => {
    if (value !== lastSyncedValueRef.current) {
      setDraftValue(value);
      if (composerInputRef.current) composerInputRef.current.innerHTML = markdownToEditorHtml(value);
    }
  }, [value]);

  useEffect(() => {
    if (draftValue === value) return;
    const timer = window.setTimeout(() => {
      lastSyncedValueRef.current = draftValue;
      onChange(draftValue);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [draftValue, onChange, value]);

  const mentionQuery = parseMentionQuery(draftValue);
  const slashQuery = parseSlashQuery(draftValue);
  const mentionSuggestions = useMemo(
    () =>
      mentionQuery === null
        ? []
        : users
            .filter((user) => user.id !== currentUserId && user.displayName.toLowerCase().includes(mentionQuery))
            .slice(0, 6),
    [currentUserId, mentionQuery, users],
  );

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
  const slashSuggestions = useMemo(
    () =>
      slashQuery === null
        ? []
        : slashCommands.filter((command) => command.label.includes(`/${slashQuery}`)).slice(0, 6),
    [slashCommands, slashQuery],
  );
  const draftLinks = useMemo(() => extractDraftLinks(draftValue), [draftValue]);
  const codeBlockLineCount = useMemo(() => {
    const codeBlock = draftValue.match(/```(?:[^\n]*)\n?([\s\S]*?)```/);
    return codeBlock ? Math.max(1, codeBlock[1].replace(/\n$/, "").split("\n").length) : 0;
  }, [draftValue]);

  const priorityItems = useMemo<ConnectCascadingMenuItem[]>(
    () => [
      {
        id: "normal",
        label: "Standard",
        description: "Message will be sent as usual",
        descriptionLayout: "stacked",
        icon: <ComposerIcon name="mail" />,
        selected: priorityFlag === "normal",
        onClick: () => setPriorityFlag("normal"),
      },
      {
        id: "important",
        label: "Important",
        description: "Message will be marked as important",
        descriptionLayout: "stacked",
        icon: <ComposerIcon name="priority" className="text-amber-600" />,
        selected: priorityFlag === "important",
        onClick: () => setPriorityFlag("important"),
      },
      {
        id: "urgent",
        label: "Urgent",
        description: "Recipient notified every 2 min for 20 min",
        descriptionLayout: "stacked",
        icon: <ComposerIcon name="bell" className="text-red-600" />,
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
        icon: <ComposerIcon name="document" />,
        onClick: () => fileInputRef.current?.click(),
      },
      { id: "attach-link", label: "Attach cloud link", icon: <ComposerIcon name="link" /> },
      { id: "gif", label: "Insert GIF", icon: <ComposerIcon name="smile" /> },
      { id: "sticker", label: "Insert sticker", icon: <ComposerIcon name="smile" /> },
      { id: "schedule", label: "Schedule message", icon: <ComposerIcon name="bell" /> },
      { id: "delivery", label: "Message delivery", icon: <ComposerIcon name="mail" />, children: priorityItems },
      { id: "video", label: "Record a video clip", icon: <ComposerIcon name="video" /> },
      { id: "voice", label: "Record a voice clip", icon: <ComposerIcon name="video" /> },
      { id: "loop", label: "Insert loop component", icon: <ComposerIcon name="table" /> },
    ],
    [priorityItems],
  );

  function updateDraftValue(nextValue: string) {
    setDraftValue(nextValue);
    if (composerInputRef.current) composerInputRef.current.innerHTML = markdownToEditorHtml(nextValue);
  }

  function moveCaretToEnd(element: HTMLElement) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function insertSnippet(snippet: string) {
    composerInputRef.current?.focus();
    document.execCommand("insertText", false, snippet);
    syncEditor();
  }

  function syncEditor() {
    if (!composerInputRef.current) return;
    setDraftValue(normalizePastedLinks(editorHtmlToMarkdown(composerInputRef.current)));
  }

  function syncActiveFormats() {
    const blockFormat = String(document.queryCommandValue("formatBlock")).toLowerCase();
    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikeThrough"),
      highlight: Boolean(document.queryCommandValue("hiliteColor")),
      code: blockFormat.includes("pre"),
      list: document.queryCommandState("insertUnorderedList"),
      "numbered-list": document.queryCommandState("insertOrderedList"),
      quote: blockFormat.includes("blockquote"),
      link: document.queryCommandState("createLink"),
      "text-size": Boolean(document.queryCommandValue("fontSize")),
    });
  }

  function applyListFormat(ordered: boolean) {
    const input = composerInputRef.current;
    if (!input) return;

    input.focus();
    if (!input.textContent?.trim()) {
      const list = document.createElement(ordered ? "ol" : "ul");
      const item = document.createElement("li");
      item.appendChild(document.createElement("br"));
      list.appendChild(item);
      input.replaceChildren(list);

      const range = document.createRange();
      range.selectNodeContents(item);
      range.collapse(true);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    } else {
      document.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList");
    }

    syncEditor();
    window.requestAnimationFrame(syncActiveFormats);
  }

  function applyFormat(
    format:
      | "bold"
      | "italic"
      | "underline"
      | "strikethrough"
      | "highlight"
      | "code"
      | "link"
      | "text-size"
      | "list"
      | "numbered-list"
      | "quote",
  ) {
    if (format === "list" || format === "numbered-list") {
      applyListFormat(format === "numbered-list");
      return;
    }

    composerInputRef.current?.focus();
    const command =
      format === "quote"
        ? "formatBlock"
        : format === "strikethrough"
          ? "strikeThrough"
          : format === "highlight"
            ? "hiliteColor"
            : format === "code"
              ? "formatBlock"
              : format === "link"
                ? "createLink"
                : format === "text-size"
                  ? "fontSize"
                  : format;
    const value =
      format === "quote"
        ? "blockquote"
        : format === "highlight"
          ? "#fef3c7"
          : format === "code"
            ? "pre"
            : format === "link"
              ? "https://"
              : format === "text-size"
                ? "3"
                : undefined;
    document.execCommand(command, false, value);
    syncEditor();
    window.requestAnimationFrame(syncActiveFormats);
  }

  function insertBacktickOrCodeBlock() {
    const input = composerInputRef.current;
    if (!input) return;

    document.execCommand("insertText", false, "`");
    const content = editorHtmlToMarkdown(input);
    if (content.endsWith("```")) {
      document.execCommand("delete", false);
      document.execCommand("delete", false);
      document.execCommand("delete", false);
      applyFormat("code");
      return;
    }

    if (/`[^`\n]+`$/.test(content)) {
      updateDraftValue(normalizePastedLinks(content));
      input.focus();
      moveCaretToEnd(input);
      return;
    }

    syncEditor();
  }

  function moveCaretAfterCodeBlock() {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range?.collapsed) return false;

    const anchor =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement;
    const codeBlock = anchor?.closest("pre");
    if (!codeBlock || !composerInputRef.current?.contains(codeBlock)) return false;

    const contentBeforeCaret = document.createRange();
    contentBeforeCaret.selectNodeContents(codeBlock);
    contentBeforeCaret.setEnd(range.startContainer, range.startOffset);
    const caretLine = contentBeforeCaret.toString().split("\n").length;
    const lineCount = (codeBlock.textContent ?? "").split("\n").length;
    if (caretLine < lineCount) return false;

    const paragraph = document.createElement("div");
    paragraph.appendChild(document.createElement("br"));
    codeBlock.after(paragraph);

    const nextRange = document.createRange();
    nextRange.selectNodeContents(paragraph);
    nextRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
    syncEditor();
    return true;
  }

  function handleSend() {
    const content = draftValue.trim();
    if (!content && pendingAttachments.length === 0) return;
    if (overLimit) return;
    const mentionedNames = [...content.matchAll(/@\[([^\]]+)\]/g)].map((match) => match[1].trim().toLowerCase());
    const mentionUserIds = users
      .filter((user) => mentionedNames.includes(user.displayName.toLowerCase()))
      .map((user) => user.id);
    const priorityPrefix =
      isEditing || priorityFlag === "normal" ? "" : priorityFlag === "important" ? "[IMPORTANT] " : "[URGENT] ";
    onSend({ content: `${priorityPrefix}${content}`, mentionUserIds });
    lastSyncedValueRef.current = "";
    setDraftValue("");
    if (composerInputRef.current) composerInputRef.current.innerHTML = "";
    setPriorityFlag("normal");
    onChange("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "ArrowDown" && moveCaretAfterCodeBlock()) {
      event.preventDefault();
      return;
    }
    if (event.ctrlKey && event.altKey && event.shiftKey && event.code === "KeyB") {
      event.preventDefault();
      applyFormat("code");
      return;
    }
    if (event.key === "`") {
      event.preventDefault();
      insertBacktickOrCodeBlock();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      applyFormat("bold");
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
      event.preventDefault();
      applyFormat("italic");
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u") {
      event.preventDefault();
      applyFormat("underline");
      return;
    }
    const modifierHeld = event.ctrlKey || event.metaKey;
    if (event.key === "Enter" && !event.shiftKey && (sendShortcut === "MOD_ENTER") === modifierHeld) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="relative shrink-0 px-6 pb-6 pt-0">
      {(slashSuggestions.length > 0 || mentionSuggestions.length > 0) && (
        <div className="absolute bottom-[138px] left-6 right-6 z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {slashSuggestions.length > 0 ? "Slash Commands" : "Mention People"}
          </p>
          <div className="pb-1">
            {slashSuggestions.map((command) => (
              <button
                key={command.id}
                type="button"
                onClick={() =>
                  updateDraftValue(
                    draftValue.replace(
                      /(?:^|\n)\/[a-zA-Z-]*$/,
                      (match) => `${match.startsWith("\n") ? "\n" : ""}${command.insertText}`,
                    ),
                  )
                }
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="text-sm font-bold text-slate-800">{command.label}</span>
                <span className="text-xs text-slate-500">{command.description}</span>
              </button>
            ))}
            {mentionSuggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  updateDraftValue(
                    draftValue.replace(
                      /(?:^|\s)@[a-zA-Z0-9._-]*$/,
                      (match) => `${match.startsWith(" ") ? " " : ""}@[${user.displayName}] `,
                    ),
                  )
                }
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
              >
                <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{user.displayName}</span>
                  <span className="block text-xs text-slate-500">{user.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {quotedMessage && (
          <div className="mx-1 mt-1 flex items-center justify-between rounded border-l-[3px] border-emerald-600 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700">Replying to {quotedMessage.senderName}</p>
              <p className="truncate text-xs text-slate-500">{quotedMessage.content}</p>
            </div>
            <IconButton label="Clear reply" onClick={onClearQuotedMessage}>
              <ComposerIcon name="close" size={16} />
            </IconButton>
          </div>
        )}

        {!isEditing && pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pt-2">
            {pendingAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="relative h-24 w-24 overflow-hidden rounded border border-slate-200 bg-slate-50"
              >
                {attachment.type.startsWith("image/") ? (
                  <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
                ) : attachment.type.startsWith("video/") ? (
                  <video src={attachment.url} muted className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-1 text-center text-sky-600">
                    <ComposerIcon name="document" />
                    <span className="mt-1 w-full truncate text-xs text-slate-500">{attachment.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePendingAttachment?.(attachment.id)}
                  aria-label={`Remove ${attachment.name}`}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
                >
                  <ComposerIcon name="close" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {!isEditing && draftLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pt-2">
            {draftLinks.map((link) => (
              <div
                key={link.url}
                className="flex w-[220px] items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2"
              >
                <img src={link.thumbnail} alt="" className="h-8 w-8 rounded border border-slate-200 bg-white" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800">{link.domain}</p>
                  <p className="truncate text-xs text-slate-500">{link.url}</p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${link.domain}`}
                  className="rounded p-1 text-slate-500 hover:bg-slate-200"
                >
                  <ComposerIcon name="open" size={16} />
                </a>
              </div>
            ))}
          </div>
        )}

        <div className={`relative ${codeBlockLineCount > 0 ? "overflow-hidden rounded border border-slate-300" : ""}`}>
          {codeBlockLineCount > 0 ? (
            <div className="flex h-8 items-center border-b border-slate-200 px-3 text-xs font-medium text-slate-500">
              Plain Text
            </div>
          ) : null}
          {codeBlockLineCount > 0 ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-8 z-10 flex w-9 flex-col border-r border-slate-100 py-2 text-right font-mono text-xs leading-5 text-slate-400"
            >
              {Array.from({ length: codeBlockLineCount }, (_, index) => (
                <span key={index} className="pr-2">
                  {index + 1}
                </span>
              ))}
            </div>
          ) : null}
          {codeBlockLineCount === 0 && draftValue.trim().length === 0 ? (
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-2 text-sm text-slate-400">
              {isEditing ? "Edit message" : `Message ${conversationLabel}`}
            </span>
          ) : null}
          <div
            ref={composerInputRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label={isEditing ? "Edit message" : `Message ${conversationLabel}`}
            aria-multiline="true"
            onInput={() => syncEditor()}
            onPaste={(event) => {
              event.preventDefault();
              document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
              syncEditor();
            }}
            onKeyDown={handleKeyDown as unknown as (event: KeyboardEvent<HTMLDivElement>) => void}
            onKeyUp={syncActiveFormats}
            onMouseUp={syncActiveFormats}
            onFocus={syncActiveFormats}
            className={`block w-full bg-transparent px-3 py-2 text-sm text-slate-800 outline-none ${codeBlockLineCount > 0 ? "max-h-[13rem] min-h-20 overflow-auto leading-5 whitespace-pre-wrap [&_pre]:m-0 [&_pre]:min-h-16 [&_pre]:pl-7 [&_pre]:font-mono [&_pre]:whitespace-pre" : "max-h-40 min-h-20 overflow-y-auto whitespace-pre-wrap"}`}
          />
        </div>

        {!isEditing && formattingOpen && (
          <div className="flex flex-wrap gap-1 border-y border-slate-200 px-2 py-1.5">
            {[
              ["bold", () => applyFormat("bold"), "Bold"],
              ["italic", () => applyFormat("italic"), "Italic"],
              ["underline", () => applyFormat("underline"), "Underline"],
              ["strikethrough", () => applyFormat("strikethrough"), "Strikethrough"],
              ["highlight", () => applyFormat("highlight"), "Highlight"],
              ["code", () => applyFormat("code"), "Code block"],
              ["list", () => applyFormat("list"), "Bulleted list"],
              ["numbered-list", () => applyFormat("numbered-list"), "Numbered list"],
              ["quote", () => applyFormat("quote"), "Quote"],
              ["link", () => applyFormat("link"), "Link"],
              [
                "table",
                () => insertSnippet("| Column A | Column B |\n| --- | --- |\n| Value 1 | Value 2 |\n"),
                "Table",
              ],
              ["text-size", () => applyFormat("text-size"), "Text size"],
            ].map(([icon, action, label]) => (
              <IconButton
                key={label as string}
                label={label as string}
                active={Boolean(activeFormats[icon as IconName])}
                onClick={action as () => void}
              >
                <ComposerIcon name={icon as IconName} />
              </IconButton>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-2 py-1.5">
          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                <IconButton label="Formatting" onClick={() => setFormattingOpen((open) => !open)}>
                  <ComposerIcon name="edit" />
                </IconButton>
                <IconButton label="Emoji" onClick={() => setEmojiOpen((open) => !open)}>
                  <ComposerIcon name="smile" />
                </IconButton>
                {/* TODO: Re-enable the attachment menu after its actions are implemented. */}
                <IconButton label="Set priority" onClick={(event) => setPriorityAnchor(event.currentTarget)}>
                  <ComposerIcon
                    name={priorityFlag === "urgent" ? "bell" : "priority"}
                    className={
                      priorityFlag === "urgent" ? "text-red-600" : priorityFlag === "important" ? "text-amber-600" : ""
                    }
                  />
                </IconButton>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && priorityFlag !== "normal" && (
              <span className={`text-xs font-bold ${priorityFlag === "urgent" ? "text-red-600" : "text-amber-600"}`}>
                {priorityFlag === "urgent" ? "Urgent" : "Important"}
              </span>
            )}
            {maxMessageLength !== null && messageLength > maxMessageLength * 0.9 ? (
              <span
                aria-live="polite"
                className={`text-xs tabular-nums ${overLimit ? "text-error" : "text-text-secondary"}`}
              >
                {messageLength}/{maxMessageLength}
              </span>
            ) : null}
            {isEditing ? (
              <>
                <IconButton label="Cancel edit" onClick={onCancelEdit}>
                  <ComposerIcon name="close" size={18} />
                </IconButton>
                <IconButton label="Save edit" onClick={handleSend}>
                  <ComposerIcon name="check" size={18} />
                </IconButton>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={overLimit}
                title={sendShortcut === "MOD_ENTER" ? "Send (Ctrl/⌘ + Enter)" : "Send (Enter)"}
                className="inline-flex items-center gap-1 rounded bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
              >
                <ComposerIcon name="send" size={14} />
                Send
              </button>
            )}
          </div>
        </div>
      </div>

      {emojiOpen && (
        <div className="absolute bottom-20 left-6 z-40 rounded-lg border border-slate-200 bg-white shadow-lg">
          <EmojiPicker
            width={320}
            height={380}
            onEmojiClick={(emojiData: EmojiClickData) => {
              setDraftValue(`${draftValue}${emojiData.emoji}`);
              setEmojiOpen(false);
            }}
          />
        </div>
      )}
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
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onAttachFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}

function IconButton({
  children,
  label,
  active = false,
  onClick,
}: {
  children: ReactNode;
  label: string;
  active?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded ${active ? "bg-brand-muted text-brand" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {children}
    </button>
  );
}

function ComposerIcon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  const icons: Record<IconName, LucideIcon> = {
    add: Plus,
    bell: Bell,
    bold: Bold,
    check: Check,
    code: Code2,
    close: X,
    document: FileText,
    edit: PencilLine,
    highlight: Highlighter,
    italic: Italic,
    link: Link,
    list: List,
    mail: Mail,
    more: MoreHorizontal,
    "numbered-list": ListOrdered,
    open: ExternalLink,
    priority: Star,
    quote: Quote,
    send: Send,
    smile: Smile,
    strikethrough: Strikethrough,
    table: Table2,
    "text-size": Type,
    underline: Underline,
    video: Video,
  };
  const Icon = icons[name];
  return <Icon aria-hidden="true" className={className} size={size} />;
}
