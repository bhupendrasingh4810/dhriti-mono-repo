"use client";

import { Box, Typography } from "@mui/material";

export function AppSwitcher() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        App Switcher
      </Typography>
    </Box>
  );
}
