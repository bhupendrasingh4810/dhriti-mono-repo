import { Fragment, useState } from "react";
import type { MouseEvent } from "react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";

// ==========================================
// 📋 STRICT ENTIRE APPLICATION DATA INTERFACES
// ==========================================
export interface ConnectMessage {
  id: string;
  content: string;
}

export interface ConnectUser {
  id: string;
  displayName: string;
}

interface RenderMessageContentProps {
  message: ConnectMessage;
  connectUsers: ConnectUser[];
  openMentionHover: (event: MouseEvent<HTMLElement>, userId: string) => void;
}

// ==========================================
// 🛡️ IMMUTABLE REGEX COMPILED TOKENS SYSTEM
// ==========================================
const SINGLE_EMOJI_PATTERN =
  /^(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*|[\u{1F1E6}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3)$/u;
const PRIORITY_PATTERN = /^\[(IMPORTANT|URGENT)\]\s*/i;

export function isSingleEmojiMessage(content: string) {
  return SINGLE_EMOJI_PATTERN.test(content.trim());
}

/**
 * Extracts the priority tag (if any) from a message's raw content, for rendering outside the message bubble.
 */
export function getMessagePriority(content: string): "IMPORTANT" | "URGENT" | null {
  const match = content.match(PRIORITY_PATTERN);
  return match ? (match[1].toUpperCase() as "IMPORTANT" | "URGENT") : null;
}
const MARKDOWN_TOKEN_SPLITTER =
  /(@\[[^\]]+\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+==|\[[^\]]+\]\([^\)]+\))/g;
const LINK_PATTERN = /^\[([^\]]+)\]\(([^\)]+)\)$/;
const URL_PATTERN = /https?:\/\/[^\s<>)]+/gi;

// ==========================================
// 🧩 ISOLATED UI SUB-COMPONENTS (MEMOIZED READY)
// ==========================================

/**
 * 🏷️ Component for managing hover states on dynamic @mentions
 */
interface MentionTokenProps {
  token: string;
  connectUsers: ConnectUser[];
  openMentionHover: (event: MouseEvent<HTMLElement>, userId: string) => void;
}

const MentionToken = ({ token, connectUsers, openMentionHover }: MentionTokenProps) => {
  const displayName = (token.startsWith("@[") ? token.slice(2, -1) : token.slice(1)).trim();
  const matchedUser = connectUsers.find((user) => user.displayName.trim().toLowerCase() === displayName.toLowerCase());

  return (
    <span
      onMouseEnter={(e: MouseEvent<HTMLElement>) => {
        if (matchedUser) openMentionHover(e, matchedUser.id);
      }}
      className={`font-bold text-brand ${matchedUser ? "cursor-pointer" : "cursor-default"}`}
    >
      @{displayName}
    </span>
  );
};

/**
 * 🎨 Parses and returns styled text fragments based on regex token tags
 */
interface InlineMarkdownProps {
  text: string;
  keyPrefix: string;
  connectUsers: ConnectUser[];
  openMentionHover: (event: MouseEvent<HTMLElement>, userId: string) => void;
}

const InlineMarkdown = ({ text, keyPrefix, connectUsers, openMentionHover }: InlineMarkdownProps) => {
  const tokens = text.split(MARKDOWN_TOKEN_SPLITTER);

  return (
    <>
      {tokens.map((token, index) => {
        if (!token) return null;
        const currentKey = `${keyPrefix}-${index}`;

        if (/^@\[[^\]]+\]$/.test(token)) {
          return (
            <MentionToken
              key={`${currentKey}-mention`}
              token={token}
              connectUsers={connectUsers}
              openMentionHover={openMentionHover}
            />
          );
        }

        if (/^`[^`]+`$/.test(token)) {
          return (
            <code key={`${currentKey}-code`} className="mx-0.5 rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono text-xs">
              {token.slice(1, -1)}
            </code>
          );
        }

        if (/^\*\*[^*]+\*\*$/.test(token)) {
          return (
            <strong key={`${currentKey}-bold`}>
              {token.slice(2, -2)}
            </strong>
          );
        }

        if (/^\*[^*]+\*$/.test(token)) {
          return (
            <em key={`${currentKey}-italic`}>
              {token.slice(1, -1)}
            </em>
          );
        }

        if (/^~~[^~]+~~$/.test(token)) {
          return (
            <s key={`${currentKey}-strike`}>
              {token.slice(2, -2)}
            </s>
          );
        }

        if (/^==[^=]+==$/.test(token)) {
          return (
            <span key={`${currentKey}-highlight`} className="rounded bg-amber-100 px-1">
              {token.slice(2, -2)}
            </span>
          );
        }

        const linkMatch = token.match(LINK_PATTERN);
        if (linkMatch) {
          return (
            <a
              key={`${currentKey}-link`}
              href={linkMatch[2]}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer text-emerald-600 underline"
            >
              {linkMatch[1]}
            </a>
          );
        }

        const names = connectUsers.map((user) => user.displayName.trim())
          .filter(Boolean)
          .sort((first, second) => second.length - first.length)
          .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        if (!names.length) return <Fragment key={`${currentKey}-txt`}>{token}</Fragment>;
        const mentionPattern = new RegExp(`(?<![\\p{L}\\p{N}_@])(@(?:${names.join("|")}))(?![\\p{L}\\p{N}_])`, "giu");
        return <Fragment key={`${currentKey}-txt`}>{token.split(mentionPattern).map((part, partIndex) => (
          partIndex % 2 === 1
            ? <MentionToken key={`${currentKey}-${partIndex}`} token={part} connectUsers={connectUsers} openMentionHover={openMentionHover} />
            : <Fragment key={`${currentKey}-${partIndex}`}>{part}</Fragment>
        ))}</Fragment>;
      })}
    </>
  );
};

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

function extractLinks(text: string) {
  const links: Array<{ url: string; label: string }> = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)) {
    const url = match[2];
    if (!seen.has(url)) {
      links.push({ url, label: match[1] });
      seen.add(url);
    }
  }

  for (const match of text.matchAll(URL_PATTERN)) {
    const url = match[0];
    if (!seen.has(url)) {
      links.push({ url, label: getUrlMeta(url)?.domain ?? url });
      seen.add(url);
    }
  }

  return links;
}

function LinkPreviewCard({ url, label }: { url: string; label: string }) {
  const meta = getUrlMeta(url);
  if (!meta) return null;

  return (
    <div className="mt-3 flex max-w-[360px] items-center gap-3 rounded border border-slate-200 bg-white p-2">
      <img
        src={meta.thumbnail}
        alt=""
        className="h-9 w-9 rounded border border-slate-100 bg-slate-50"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-900">{label}</p>
        <p className="truncate text-xs text-slate-500">{meta.domain}</p>
      </div>
      <a aria-label={`Open ${label}`} href={meta.href} target="_blank" rel="noreferrer" className="rounded p-1 text-slate-500 hover:bg-slate-50">
        <OpenInNewIcon />
      </a>
    </div>
  );
}

function CodeBlock({ code, blockKey }: { code: string; blockKey: string }) {
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  function downloadCode() {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${blockKey}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const menuItems: ConnectCascadingMenuItem[] = [
    { id: "download-code", label: "Download", icon: <DownloadIcon />, onClick: downloadCode },
  ];

  return (
    <div key={blockKey} className="overflow-hidden rounded border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-2 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Code</span>
        <button type="button" aria-label="Code options" onClick={(event) => setMenuAnchor(event.currentTarget)} className="rounded p-1 text-slate-300 hover:bg-slate-800">
          <MoreIcon />
        </button>
      </div>
      <pre className={`m-0 whitespace-pre-wrap p-3 font-mono text-xs text-slate-200 ${expanded ? "overflow-auto" : "max-h-[250px] overflow-hidden"}`}>
        {code}
      </pre>
      {!expanded ? (
        <button type="button" onClick={() => setExpanded(true)} className="w-full bg-slate-800 px-3 py-2 text-xs font-extrabold text-sky-300 hover:bg-slate-700">
          Show more
        </button>
      ) : null}
      <ConnectCascadingMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        items={menuItems}
        minWidth={210}
      />
    </div>
  );
}

// ==========================================
// 🚀 MAIN RENDER ENGINE EXPORT COMPONENT
// ==========================================
export function RenderMessageContent({ message, connectUsers, openMentionHover }: RenderMessageContentProps) {
  let content = message.content;

  // 1️⃣ Extract Priority Alert Prefixes Safely
  const priorityMatch = content.match(PRIORITY_PATTERN);
  const priority = priorityMatch ? priorityMatch[1].toUpperCase() : null;
  if (priorityMatch) {
    content = content.slice(priorityMatch[0].length);
  }

  // 2️⃣ Handle Single Jumbo Emoji Layouts View
  const trimmedContent = content.trim();
  if (!priority && isSingleEmojiMessage(trimmedContent)) {
    return (
      <div className="text-[52px] leading-[1.1] tracking-normal">
        {trimmedContent}
      </div>
    );
  }

  // 3️⃣ Break Content Down into Codeblocks and Standard Text Regions
  const blocks = content.split(/```([\s\S]*?)```/g);
  const linkPreviews = extractLinks(content);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const blockKey = `${message.id}-block-${blockIndex}`;

        // 💻 Render Even Indices as Code blocks
        if (blockIndex % 2 === 1) {
          return <CodeBlock key={blockKey} blockKey={blockKey} code={block.trim()} />;
        }

        // 📝 Render Odd Indices as Standard Lines (Quotes, Lists, Paragraphs)
        const lines = block.split("\n");
        return (
          <div key={blockKey} className="space-y-1.5">
            {lines.map((line, lineIndex) => {
              const lineKey = `${message.id}-l-${blockIndex}-${lineIndex}`;

              // Handle Line-breaks Spacing
              if (!line.trim()) {
                return <div key={lineKey} className="h-1.5" />;
              }

              // Handle Blockquote Elements
              if (/^\s*>\s?/.test(line)) {
                return (
                  <blockquote key={lineKey} className="border-l-[3px] border-slate-200 pl-2 text-sm italic text-slate-500">
                    <InlineMarkdown
                      text={line.replace(/^\s*>\s?/, "")}
                      keyPrefix={`${lineKey}-q`}
                      connectUsers={connectUsers}
                      openMentionHover={openMentionHover}
                    />
                  </blockquote>
                );
              }

              // Handle List Elements (Fixed original unfinished cutoff bug layout)
              if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
                return (
                  <div key={lineKey} className="text-sm leading-6 text-slate-500">
                    <InlineMarkdown
                      text={line}
                      keyPrefix={`${lineKey}-lst`}
                      connectUsers={connectUsers}
                      openMentionHover={openMentionHover}
                    />
                  </div>
                );
              }

              // Standard Paragraph Text Fallback Lines
              return (
                <div key={lineKey} className="text-sm leading-6 text-slate-900">
                  <InlineMarkdown
                    text={line}
                    keyPrefix={`${lineKey}-p`}
                    connectUsers={connectUsers}
                    openMentionHover={openMentionHover}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {linkPreviews.map((preview) => (
        <LinkPreviewCard key={preview.url} url={preview.url} label={preview.label} />
      ))}
    </div>
  );
}

function DownloadIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>;
}

function OpenInNewIcon() {
  return <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3h7v7M10 14 21 3M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" /></svg>;
}

function MoreIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></svg>;
}
