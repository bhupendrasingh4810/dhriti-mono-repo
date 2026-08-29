"use client";

import { Box, Stack, Typography } from "@mui/material";

export type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title = "No data", description, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        border: "1px dashed rgba(15,23,42,0.12)",
        borderRadius: 3,
        p: 4,
        textAlign: "center",
        background: "rgba(253,216,53,0.03)",
      }}
    >
      <Stack
        spacing={1}
        sx={{
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        ) : null}
        {action}
      </Stack>
    </Box>
  );
}
