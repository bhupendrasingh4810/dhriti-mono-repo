import React, { Fragment, MouseEvent, useState } from "react";
import { DownloadRounded, MoreVertRounded, OpenInNewRounded } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Typography } from "@dhriti/ui";
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
const SINGLE_EMOJI_PATTERN = /^(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*|[\u{1F1E6}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3)$/u;
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
const MARKDOWN_TOKEN_SPLITTER = /(@\[[^\]]+\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+==|\[[^\]]+\]\([^\)]+\))/g;
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
    const displayName = token.slice(2, -1);
    const matchedUser = connectUsers.find(
        (u) => u.displayName.toLowerCase() === displayName.toLowerCase()
    );

    return (
        <Box
            component="span"
            onMouseEnter={(e: MouseEvent<HTMLElement>) => {
                if (matchedUser) openMentionHover(e, matchedUser.id);
            }}
            sx={{
                color: "primary.main",
                fontWeight: 700,
                cursor: matchedUser ? "pointer" : "default",
            }}
        >
            @{displayName}
        </Box>
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
                        <Box
                            key={`${currentKey}-code`}
                            component="span"
                            sx={{
                                px: 0.7,
                                py: 0.15,
                                mx: 0.2,
                                borderRadius: (theme) => theme.tokens.radius.sm,
                                bgcolor: "surfaces.surfaceHover",
                                border: 1,
                                borderColor: "borders.borderSubtle",
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
                        <Box key={`${currentKey}-bold`} component="span" sx={{ fontWeight: 800 }}>
                            {token.slice(2, -2)}
                        </Box>
                    );
                }

                if (/^\*[^*]+\*$/.test(token)) {
                    return (
                        <Box key={`${currentKey}-italic`} component="span" sx={{ fontStyle: "italic" }}>
                            {token.slice(1, -1)}
                        </Box>
                    );
                }

                if (/^~~[^~]+~~$/.test(token)) {
                    return (
                        <Box key={`${currentKey}-strike`} component="span" sx={{ textDecoration: "line-through" }}>
                            {token.slice(2, -2)}
                        </Box>
                    );
                }

                if (/^==[^=]+==$/.test(token)) {
                    return (
                        <Box key={`${currentKey}-highlight`} component="span" sx={{ px: 0.45, borderRadius: (theme) => theme.tokens.radius.sm, bgcolor: "warning.light" }}>
                            {token.slice(2, -2)}
                        </Box>
                    );
                }

                const linkMatch = token.match(LINK_PATTERN);
                if (linkMatch) {
                    return (
                        <Box key={`${currentKey}-link`} component="a" href={linkMatch[2]} target="_blank" rel="noreferrer" sx={{ color: "interactive.interactive", textDecoration: "underline", cursor: "pointer" }}>
                            {linkMatch[1]}
                        </Box>
                    );
                }

                return <Fragment key={`${currentKey}-txt`}>{token}</Fragment>;
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
        <Stack direction="row" spacing={1.25} sx={{ mt: 0.75, p: 1, borderRadius: (theme) => theme.tokens.radius.sm, bgcolor: "background.paper", border: 1, borderColor: "borders.border", alignItems: "center", maxWidth: 360 }}>
            <Box component="img" src={meta.thumbnail} alt="" sx={{ width: 36, height: 36, borderRadius: (theme) => theme.tokens.radius.sm, bgcolor: "surfaces.surfaceHover", border: 1, borderColor: "borders.borderSubtle" }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>{label}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{meta.domain}</Typography>
            </Box>
            <IconButton size="small" component="a" href={meta.href} target="_blank" rel="noreferrer">
                <OpenInNewRounded sx={{ fontSize: 17 }} />
            </IconButton>
        </Stack>
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
        { id: "download-code", label: "Download", icon: <DownloadRounded sx={{ fontSize: 18 }} />, onClick: downloadCode },
    ];

    return (
        <Box key={blockKey} sx={{ borderRadius: (theme) => theme.tokens.radius.sm, overflow: "hidden", bgcolor: "grey.900", border: 1, borderColor: "grey.800" }}>
            <Stack direction="row" sx={{ px: 1, py: 0.6, alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "grey.800" }}>
                <Typography variant="overline" sx={{ color: "grey.400" }}>Code</Typography>
                <IconButton size="small" onClick={(event) => setMenuAnchor(event.currentTarget)} sx={{ color: "grey.300" }}>
                    <MoreVertRounded sx={{ fontSize: 18 }} />
                </IconButton>
            </Stack>
            <Box
                component="pre"
                sx={{
                    m: 0,
                    maxHeight: expanded ? "none" : 250,
                    p: 1.2,
                    color: "grey.200",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    overflow: expanded ? "auto" : "hidden",
                    whiteSpace: "pre-wrap",
                }}
            >
                {code}
            </Box>
            {!expanded ? (
                <Button size="small" onClick={() => setExpanded(true)} sx={{ m: 0, borderRadius: 0, bgcolor: "grey.800", color: "info.light", fontWeight: 800, width: "100%" }}>
                    Show more
                </Button>
            ) : null}
            <ConnectCascadingMenu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} items={menuItems} minWidth={210} />
        </Box>
    );
}

// ==========================================
// 🚀 MAIN RENDER ENGINE EXPORT COMPONENT
// ==========================================
export function RenderMessageContent({
    message,
    connectUsers,
    openMentionHover,
}: RenderMessageContentProps) {
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
            <Typography component="div" sx={{ fontSize: 52, lineHeight: 1.1, letterSpacing: 0 }}>
                {trimmedContent}
            </Typography>
        );
    }

    // 3️⃣ Break Content Down into Codeblocks and Standard Text Regions
    const blocks = content.split(/```([\s\S]*?)```/g);
    const linkPreviews = extractLinks(content);

    return (
        <Stack spacing={0.75}>
            {blocks.map((block, blockIndex) => {
                const blockKey = `${message.id}-block-${blockIndex}`;

                // 💻 Render Even Indices as Code blocks
                if (blockIndex % 2 === 1) {
                    return <CodeBlock key={blockKey} blockKey={blockKey} code={block.trim()} />;
                }

                // 📝 Render Odd Indices as Standard Lines (Quotes, Lists, Paragraphs)
                const lines = block.split("\n");
                return (
                    <Stack key={blockKey} spacing={0.35}>
                        {lines.map((line, lineIndex) => {
                            const lineKey = `${message.id}-l-${blockIndex}-${lineIndex}`;

                            // Handle Line-breaks Spacing
                            if (!line.trim()) {
                                return <Box key={lineKey} sx={{ height: 6 }} />;
                            }

                            // Handle Blockquote Elements
                            if (/^\s*>\s?/.test(line)) {
                                return (
                                    <Box key={lineKey} sx={{ pl: 1, borderLeft: 3, borderColor: "borders.border", color: "text.secondary", fontStyle: "italic" }}>
                                        <InlineMarkdown
                                            text={line.replace(/^\s*>\s?/, "")}
                                            keyPrefix={`${lineKey}-q`}
                                            connectUsers={connectUsers}
                                            openMentionHover={openMentionHover}
                                        />
                                    </Box>
                                );
                            }

                            // Handle List Elements (Fixed original unfinished cutoff bug layout)
                            if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
                                return (
                                    <Typography key={lineKey} component="div" variant="body2" sx={{ lineHeight: 1.6, color: "text.secondary" }}>
                                        <InlineMarkdown
                                            text={line}
                                            keyPrefix={`${lineKey}-lst`}
                                            connectUsers={connectUsers}
                                            openMentionHover={openMentionHover}
                                        />
                                    </Typography>
                                );
                            }

                            // Standard Paragraph Text Fallback Lines
                            return (
                                <Typography key={lineKey} component="div" variant="body2" sx={{ lineHeight: 1.5 }}>
                                    <InlineMarkdown
                                        text={line}
                                        keyPrefix={`${lineKey}-p`}
                                        connectUsers={connectUsers}
                                        openMentionHover={openMentionHover}
                                    />
                                </Typography>
                            );
                        })}
                    </Stack>
                );
            })}

            {linkPreviews.map((preview) => (
                <LinkPreviewCard key={preview.url} url={preview.url} label={preview.label} />
            ))}
        </Stack>
    );
}
