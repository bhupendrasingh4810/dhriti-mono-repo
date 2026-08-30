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
        <Typography sx={{ fontSize: 12, color: "#6b7280", bgcolor: "#f8fafc", px: 1.5, py: 0.6, borderRadius: 99 }}>
            {message.content}
        </Typography>
    </Stack>
);