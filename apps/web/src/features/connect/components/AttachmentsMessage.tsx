import React from "react";
import { DescriptionOutlined, MoreVertRounded, PlayArrowRounded } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@dhriti/ui";
import type { ConnectConversationMessage, ConversationAttachment } from "../../../types/connect.types";

interface AttachmentsMessageProps {
  message: ConnectConversationMessage;
  openAttachmentMenu: (event: React.MouseEvent<HTMLElement>, attachment: ConversationAttachment) => void;
}

export function AttachmentsMessage({ message, openAttachmentMenu }: AttachmentsMessageProps) {
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
          <Stack
            key={attachment.id}
            direction="row"
            spacing={1.5}
            sx={{
              maxWidth: 380,
              p: 1.25,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "borders.borderSubtle",
              borderRadius: (theme) => theme.tokens.radius.sm,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 300,
                height: 200,
                bgcolor: "surfaces.surfaceHover",
                border: 1,
                borderColor: "borders.borderSubtle",
                borderRadius: (theme) => theme.tokens.radius.sm,
                position: "relative",
                display: "grid",
                placeItems: "center",
                color: "info.main",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {isImage ? (
                <Box
                  component="img"
                  src={attachment.url}
                  alt={attachment.name}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : isVideo ? (
                <>
                  <Box
                    component="video"
                    src={attachment.url}
                    muted
                    preload="metadata"
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <PlayArrowRounded sx={{ position: "absolute", fontSize: 22, color: "common.white" }} />
                </>
              ) : (
                <Stack sx={{ alignItems: "center", justifyContent: "center" }}>
                  <DescriptionOutlined sx={{ fontSize: 18 }} />
                  <Typography variant="overline" sx={{ color: "info.main", mt: 0.2 }}>
                    {getFileExtension(attachment.name)}
                  </Typography>
                </Stack>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }} />
            <IconButton size="small" onClick={(event) => openAttachmentMenu(event, attachment)}>
              <MoreVertRounded sx={{ fontSize: 22, color: "text.disabled" }} />
            </IconButton>
          </Stack>
        );
      })}
    </Stack>
  );
}
