"use client";

import { Box, Typography } from "@mui/material";

export function WorkspaceSwitcher() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        Workspace Switcher
      </Typography>
    </Box>
  );
}
