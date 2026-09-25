import React from "react";
import { Stack, Typography } from "@dhriti/ui";

interface SystemMessageProps {
  message: {
    id: string;
    content: string;
  };
}

export const SystemMessage = ({ message }: SystemMessageProps) => (
  <Stack key={message.id} sx={{ alignItems: "center", py: 0.5 }}>
    <Typography
      variant="caption"
      sx={{
        color: "text.secondary",
        bgcolor: "surfaces.surfaceHover",
        px: 1.5,
        py: 0.6,
        borderRadius: (theme) => theme.tokens.radius.pill,
      }}
    >
      {message.content}
    </Typography>
  </Stack>
);
