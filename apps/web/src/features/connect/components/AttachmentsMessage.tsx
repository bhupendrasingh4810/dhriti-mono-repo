import React from "react";
import { DescriptionOutlined, MoreVertRounded, PlayArrowRounded } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@dhriti/ui";
import type { ConnectConversationMessage, ConversationAttachment } from "../../../types/connect.types";

interface AttachmentsMessageProps {
    message: ConnectConversationMessage;
    openAttachmentMenu: (event: React.MouseEvent<HTMLElement>, attachment: ConversationAttachment) => void;
}

export function AttachmentsMessage({
    message,
    openAttachmentMenu,
}: AttachmentsMessageProps) {
    function getFileExtension(name: string) {
        const parts = name.split(".");
        return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
    }
    return (
        <Stack spacing={1} sx={{ mt: message.content ? 1.25 : 0 }}>
            {message?.attachments?.map((attachment) => {
                const isImage = attachment.type?.startsWith("image/");
                const isVideo = attachment.type?.startsWith("video/");

                return (
                    <Stack key={attachment.id} direction="row" spacing={1.5} sx={{ maxWidth: 380, p: 1.25, bgcolor: "#fff", border: "1px solid #f3f4f6", borderRadius: 1, alignItems: "center" }}>
                        <Box sx={{ width: 300, height: 200, bgcolor: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 1, position: "relative", display: "grid", placeItems: "center", color: "#3b82f6", overflow: "hidden", flexShrink: 0 }}>
                            {isImage ? (
                                <Box component="img" src={attachment.url} alt={attachment.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : isVideo ? (
                                <>
                                    <Box component="video" src={attachment.url} muted preload="metadata" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <PlayArrowRounded sx={{ position: "absolute", fontSize: 22, color: "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
                                </>
                            ) : (
                                <Stack sx={{ alignItems: "center", justifyContent: "center" }}>
                                    <DescriptionOutlined sx={{ fontSize: 18 }} />
                                    <Typography sx={{ fontSize: 8, fontWeight: 800, color: "#3b82f6", mt: 0.2 }}>{getFileExtension(attachment.name)}</Typography>
                                </Stack>
                            )}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                            {/* <Typography sx={{ fontSize: 12, fontWeight: 700 }} noWrap>{attachment.name}</Typography> */}
                            {/* <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>{(attachment.size / 1024).toFixed(0)} KB</Typography> */}
                        </Box>
                        <IconButton size="small" onClick={(event) => openAttachmentMenu(event, attachment)}>
                            <MoreVertRounded sx={{ fontSize: 22, color: "#d1d5db" }} />
                        </IconButton>
                    </Stack>
                );
            })}
        </Stack>
    );
}