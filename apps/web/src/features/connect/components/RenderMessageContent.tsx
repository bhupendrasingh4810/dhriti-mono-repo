import React, { Fragment, MouseEvent } from "react";
import { Box, Stack, Typography } from "@mui/material";

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

/**
 * Extracts the priority tag (if any) from a message's raw content, for rendering outside the message bubble.
 */
export function getMessagePriority(content: string): "IMPORTANT" | "URGENT" | null {
    const match = content.match(PRIORITY_PATTERN);
    return match ? (match[1].toUpperCase() as "IMPORTANT" | "URGENT") : null;
}
const MARKDOWN_TOKEN_SPLITTER = /(@\[[^\]]+\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|==[^=]+==|\[[^\]]+\]\([^\)]+\))/g;
const LINK_PATTERN = /^\[([^\]]+)\]\(([^\)]+)\)$/;

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
                color: "#92400e",
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
                                borderRadius: 0.8,
                                bgcolor: "#eef2f7",
                                border: "1px solid #e2e8f0",
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                fontSize: 12,
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
                        <Box key={`${currentKey}-highlight`} component="span" sx={{ px: 0.45, borderRadius: 0.7, bgcolor: "#fef08a" }}>
                            {token.slice(2, -2)}
                        </Box>
                    );
                }

                const linkMatch = token.match(LINK_PATTERN);
                if (linkMatch) {
                    return (
                        <Box key={`${currentKey}-link`} component="span" sx={{ color: "#2563eb", textDecoration: "underline", cursor: "pointer" }}>
                            {linkMatch[1]}
                        </Box>
                    );
                }

                return <Fragment key={`${currentKey}-txt`}>{token}</Fragment>;
            })}
        </>
    );
};

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
    if (!priority && SINGLE_EMOJI_PATTERN.test(trimmedContent)) {
        return (
            <Typography component="div" sx={{ fontSize: 52, lineHeight: 1.1, letterSpacing: 0 }}>
                {trimmedContent}
            </Typography>
        );
    }

    // 3️⃣ Break Content Down into Codeblocks and Standard Text Regions
    const blocks = content.split(/```([\s\S]*?)```/g);

    return (
        <Stack spacing={0.75}>
            {blocks.map((block, blockIndex) => {
                const blockKey = `${message.id}-block-${blockIndex}`;

                // 💻 Render Even Indices as Code blocks
                if (blockIndex % 2 === 1) {
                    return (
                        <Box
                            key={blockKey}
                            component="pre"
                            sx={{
                                m: 0,
                                p: 1.2,
                                borderRadius: 1.3,
                                bgcolor: "#0f172a",
                                color: "#e2e8f0",
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                fontSize: 12,
                                overflowX: "auto",
                            }}
                        >
                            {block.trim()}
                        </Box>
                    );
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
                                    <Box key={lineKey} sx={{ pl: 1, borderLeft: "3px solid #cbd5e1", color: "#475569", fontStyle: "italic" }}>
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
                                    <Typography key={lineKey} component="div" sx={{ fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
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
                                <Typography key={lineKey} component="div" sx={{ fontSize: 14, lineHeight: 1.5, color: "#111827" }}>
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
        </Stack>
    );
}
