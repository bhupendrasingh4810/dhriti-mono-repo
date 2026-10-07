"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import type { ConnectMentionUser, ConnectPendingAttachment } from "@/types/connect.types";

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

type IconName =
  | "add"
  | "bell"
  | "bold"
  | "check"
  | "code"
  | "close"
  | "document"
  | "edit"
  | "highlight"
  | "italic"
  | "link"
  | "list"
  | "mail"
  | "more"
  | "numbered-list"
  | "open"
  | "priority"
  | "quote"
  | "send"
  | "smile"
  | "table"
  | "text-size"
  | "underline"
  | "video";

function parseMentionQuery(text: string) {
  return text.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/)?.[1].toLowerCase() ?? null;
}

function parseSlashQuery(text: string) {
  return text.match(/(?:^|\n)\/([a-zA-Z-]*)$/)?.[1].toLowerCase() ?? null;
}

function insertAtCursor(value: string, start: number, end: number, text: string) {
  const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
  const cursor = start + text.length;
  return { value: nextValue, selectionStart: cursor, selectionEnd: cursor };
}

function wrapWithMarkdown(value: string, start: number, end: number, prefix: string, suffix = prefix) {
  const selected = value.slice(start, end);
  return {
    value: `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`,
    selectionStart: start + prefix.length,
    selectionEnd: end + prefix.length,
  };
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
  const lastSyncedValueRef = useRef(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = mode === "edit";

  useEffect(() => {
    if (value !== lastSyncedValueRef.current) setDraftValue(value);
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
      { id: "assign", label: "/assign", description: "Assign and notify a teammate", insertText: "@[] please review this\n" },
      { id: "urgent", label: "/urgent", description: "Mark message as urgent", insertText: "[URGENT] " },
      { id: "important", label: "/important", description: "Mark message as important", insertText: "[IMPORTANT] " },
      { id: "schedule", label: "/schedule", description: "Schedule for later", insertText: "[SCHEDULE: tomorrow 09:00] " },
      { id: "gif", label: "/gif", description: "Insert a GIF placeholder", insertText: "[GIF: search-term] " },
      { id: "table", label: "/table", description: "Insert markdown table", insertText: "| Column A | Column B |\n| --- | --- |\n| Value 1 | Value 2 |\n" },
      { id: "bot", label: "/bot", description: "Message extension or bot command", insertText: "@bot " },
    ],
    [],
  );
  const slashSuggestions = useMemo(
    () => (slashQuery === null ? [] : slashCommands.filter((command) => command.label.includes(`/${slashQuery}`)).slice(0, 6)),
    [slashCommands, slashQuery],
  );
  const draftLinks = useMemo(() => extractDraftLinks(draftValue), [draftValue]);

  const priorityItems = useMemo<ConnectCascadingMenuItem[]>(
    () => [
      { id: "normal", label: "Standard", description: "Message will be sent as usual", icon: <ComposerIcon name="mail" />, selected: priorityFlag === "normal", onClick: () => setPriorityFlag("normal") },
      { id: "important", label: "Important", description: "Message will be marked as important", icon: <ComposerIcon name="priority" className="text-amber-600" />, selected: priorityFlag === "important", onClick: () => setPriorityFlag("important") },
      { id: "urgent", label: "Urgent", description: "Recipient notified every 2 min for 20 min", icon: <ComposerIcon name="bell" className="text-red-600" />, selected: priorityFlag === "urgent", onClick: () => setPriorityFlag("urgent") },
    ],
    [priorityFlag],
  );

  const composerAttachItems = useMemo<ConnectCascadingMenuItem[]>(
    () => [
      { id: "attach-file", label: "Attach File", icon: <ComposerIcon name="document" />, onClick: () => fileInputRef.current?.click() },
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
    const result = wrapWithMarkdown(draftValue, input.selectionStart ?? 0, input.selectionEnd ?? input.selectionStart ?? 0, prefix, suffix);
    updateValueAndSelection(result.value, result.selectionStart, result.selectionEnd);
  }

  function insertSnippet(snippet: string) {
    const input = composerInputRef.current;
    if (!input) return;
    const result = insertAtCursor(draftValue, input.selectionStart ?? 0, input.selectionEnd ?? input.selectionStart ?? 0, snippet);
    updateValueAndSelection(result.value, result.selectionStart, result.selectionEnd);
  }

  function handleSend() {
    const content = draftValue.trim();
    if (!content && pendingAttachments.length === 0) return;
    const mentionedNames = [...content.matchAll(/@\[([^\]]+)\]/g)].map((match) => match[1].trim().toLowerCase());
    const mentionUserIds = users.filter((user) => mentionedNames.includes(user.displayName.toLowerCase())).map((user) => user.id);
    const priorityPrefix = isEditing || priorityFlag === "normal" ? "" : priorityFlag === "important" ? "[IMPORTANT] " : "[URGENT] ";
    onSend({ content: `${priorityPrefix}${content}`, mentionUserIds });
    lastSyncedValueRef.current = "";
    setDraftValue("");
    setPriorityFlag("normal");
    onChange("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
      event.preventDefault();
      applyMarkdown("**");
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
  }

  return (
    <div className="relative shrink-0 px-6 pb-6 pt-0">
      {(slashSuggestions.length > 0 || mentionSuggestions.length > 0) && (
        <div className="absolute bottom-[138px] left-6 right-6 z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{slashSuggestions.length > 0 ? "Slash Commands" : "Mention People"}</p>
          <div className="pb-1">
            {slashSuggestions.map((command) => (
              <button key={command.id} type="button" onClick={() => setDraftValue(draftValue.replace(/(?:^|\n)\/[a-zA-Z-]*$/, (match) => `${match.startsWith("\n") ? "\n" : ""}${command.insertText}`))} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-50">
                <span className="text-sm font-bold text-slate-800">{command.label}</span><span className="text-xs text-slate-500">{command.description}</span>
              </button>
            ))}
            {mentionSuggestions.map((user) => (
              <button key={user.id} type="button" onClick={() => setDraftValue(draftValue.replace(/(?:^|\s)@[a-zA-Z0-9._-]*$/, (match) => `${match.startsWith(" ") ? " " : ""}@[${user.displayName}] `))} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50">
                <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" /><span><span className="block text-sm font-semibold text-slate-800">{user.displayName}</span><span className="block text-xs text-slate-500">{user.subtitle}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {quotedMessage && <div className="mx-1 mt-1 flex items-center justify-between rounded border-l-[3px] border-emerald-600 px-3 py-2.5"><div className="min-w-0"><p className="text-xs font-bold text-emerald-700">Replying to {quotedMessage.senderName}</p><p className="truncate text-xs text-slate-500">{quotedMessage.content}</p></div><IconButton label="Clear reply" onClick={onClearQuotedMessage}><ComposerIcon name="close" size={16} /></IconButton></div>}

        {!isEditing && pendingAttachments.length > 0 && <div className="flex flex-wrap gap-2 px-2 pt-2">{pendingAttachments.map((attachment) => <div key={attachment.id} className="relative h-24 w-24 overflow-hidden rounded border border-slate-200 bg-slate-50">{attachment.type.startsWith("image/") ? <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" /> : attachment.type.startsWith("video/") ? <video src={attachment.url} muted className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center p-1 text-center text-sky-600"><ComposerIcon name="document" /><span className="mt-1 w-full truncate text-xs text-slate-500">{attachment.name}</span></div>}<button type="button" onClick={() => onRemovePendingAttachment?.(attachment.id)} aria-label={`Remove ${attachment.name}`} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-slate-900/80 text-white hover:bg-slate-900"><ComposerIcon name="close" size={12} /></button></div>)}</div>}

        {!isEditing && draftLinks.length > 0 && <div className="flex flex-wrap gap-2 px-2 pt-2">{draftLinks.map((link) => <div key={link.url} className="flex w-[220px] items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2"><img src={link.thumbnail} alt="" className="h-8 w-8 rounded border border-slate-200 bg-white" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{link.domain}</p><p className="truncate text-xs text-slate-500">{link.url}</p></div><a href={link.url} target="_blank" rel="noreferrer" aria-label={`Open ${link.domain}`} className="rounded p-1 text-slate-500 hover:bg-slate-200"><ComposerIcon name="open" size={16} /></a></div>)}</div>}

        <textarea ref={composerInputRef} rows={2} placeholder={isEditing ? "Edit message" : `Message ${conversationLabel}`} value={draftValue} onChange={(event) => setDraftValue(normalizePastedLinks(event.target.value))} onKeyDown={handleKeyDown} className="block max-h-40 min-h-20 w-full resize-none bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400" />

        {!isEditing && formattingOpen && <div className="flex flex-wrap gap-1 border-y border-slate-200 px-2 py-1.5">{[
          ["bold", () => applyMarkdown("**"), "Bold"], ["italic", () => applyMarkdown("*"), "Italic"], ["underline", () => applyMarkdown("<u>", "</u>"), "Underline"], ["more", () => applyMarkdown("~~"), "Strikethrough"], ["highlight", () => applyMarkdown("=="), "Highlight"], ["code", () => applyMarkdown("`"), "Inline code"], ["more", () => applyMarkdown("```\n", "\n```"), "Code block"], ["list", () => insertSnippet("- "), "Bulleted list"], ["numbered-list", () => insertSnippet("1. "), "Numbered list"], ["quote", () => insertSnippet("> "), "Quote"], ["link", () => applyMarkdown("[", "](https://)"), "Link"], ["table", () => insertSnippet("| Column A | Column B |\n| --- | --- |\n| Value 1 | Value 2 |\n"), "Table"], ["text-size", () => applyMarkdown('<span style="font-size:14px">', "</span>"), "Text size"],
        ].map(([icon, action, label]) => <IconButton key={label as string} label={label as string} onClick={action as () => void}><ComposerIcon name={icon as IconName} /></IconButton>)}</div>}

        <div className="flex items-center justify-between border-t border-slate-200 px-2 py-1.5">
          <div className="flex items-center gap-1">{!isEditing && <><IconButton label="Formatting" onClick={() => setFormattingOpen((open) => !open)}><ComposerIcon name="edit" /></IconButton><IconButton label="Emoji" onClick={() => setEmojiOpen((open) => !open)}><ComposerIcon name="smile" /></IconButton><IconButton label="Add attachment" onClick={(event) => setComposerAttachAnchor(event.currentTarget)}><ComposerIcon name="add" /></IconButton><IconButton label="Set priority" onClick={(event) => setPriorityAnchor(event.currentTarget)}><ComposerIcon name={priorityFlag === "urgent" ? "bell" : "priority"} className={priorityFlag === "urgent" ? "text-red-600" : priorityFlag === "important" ? "text-amber-600" : ""} /></IconButton></>}</div>
          <div className="flex items-center gap-2">{!isEditing && priorityFlag !== "normal" && <span className={`text-xs font-bold ${priorityFlag === "urgent" ? "text-red-600" : "text-amber-600"}`}>{priorityFlag === "urgent" ? "Urgent" : "Important"}</span>}{isEditing ? <><IconButton label="Cancel edit" onClick={onCancelEdit}><ComposerIcon name="close" size={18} /></IconButton><IconButton label="Save edit" onClick={handleSend}><ComposerIcon name="check" size={18} /></IconButton></> : <button type="button" onClick={handleSend} className="inline-flex items-center gap-1 rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"><ComposerIcon name="send" size={14} />Send</button>}</div>
        </div>
      </div>

      {emojiOpen && <div className="absolute bottom-20 left-6 z-40 rounded-lg border border-slate-200 bg-white shadow-lg"><EmojiPicker width={320} height={380} onEmojiClick={(emojiData: EmojiClickData) => { setDraftValue(`${draftValue}${emojiData.emoji}`); setEmojiOpen(false); }} /></div>}
      <ConnectCascadingMenu anchorEl={composerAttachAnchor} open={Boolean(composerAttachAnchor)} onClose={() => setComposerAttachAnchor(null)} items={composerAttachItems} />
      <ConnectCascadingMenu anchorEl={priorityAnchor} open={Boolean(priorityAnchor)} onClose={() => setPriorityAnchor(null)} items={priorityItems} />
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { onAttachFiles(event.target.files); event.currentTarget.value = ""; }} />
    </div>
  );
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-100">{children}</button>;
}

function ComposerIcon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    add: <><path d="M12 5v14M5 12h14" /></>, check: <path d="m5 12 4 4L19 6" />, close: <><path d="m18 6-12 12M6 6l12 12" /></>, bold: <><path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" /></>, italic: <><path d="M19 4h-8M13 20H5M14 4 8 20" /></>, underline: <><path d="M6 4v7a6 6 0 0 0 12 0V4M4 21h16" /></>, code: <><path d="m8 6-6 6 6 6M16 6l6 6-6 6" /></>, document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>, edit: <><path d="M12 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" /><path d="m14.5 5.5 4 4L12 16l-4 1 1-4z" /></>, highlight: <><path d="m14 4 6 6-8 8-6-6zM4 20h16" /></>, link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></>, list: <><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01" /></>, mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>, more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>, "numbered-list": <><path d="M10 6h11M10 12h11M10 18h11M4 5h1v3M4 8h2M4 13c2-2 3 0 0 3h2M4 19h2M5 18v4" /></>, open: <><path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" /></>, priority: <path d="m12 3 3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7L2 10.5 9 10z" />, quote: <><path d="M7 8H3v5h4v3H3a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h4zM21 8h-4v5h4v3h-4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h4z" /></>, send: <><path d="m22 2-7 20-4-9-9-4zM22 2 11 13" /></>, smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>, table: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>, "text-size": <><path d="M4 5h16M8 5v14M16 5v14M5 19h6M13 19h6" /></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4" /></>, video: <><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3z" /></>,
  };
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
