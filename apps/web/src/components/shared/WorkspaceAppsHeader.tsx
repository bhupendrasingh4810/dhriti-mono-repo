"use client";

import { Avatar, Box, Container, Stack, Typography } from "@mui/material";
import HelpIcon from "@mui/icons-material/Help";
import NotificationNone from "@mui/icons-material/NotificationsNone";

type WorkspaceAppsHeaderProps = {
  appName?: string;
};

export function WorkspaceAppsHeader({ appName = "Home" }: WorkspaceAppsHeaderProps) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "#f1f5f9", bgcolor: "background.paper", position: "sticky", top: 0, zIndex: 20 }}>
      <Container maxWidth={false} sx={{ height: 68 }}>
        <Stack direction="row" sx={{ height: "100%", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={6} sx={{ alignItems: "center" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#facc15", color: "#111827", fontWeight: 800, display: "grid", placeItems: "center" }}>F</Box>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Flowrise</Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <NotificationNone sx={{ color: "#6b7280" }} />
            <HelpIcon sx={{ color: "#6b7280" }} />
            <Avatar src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" sx={{ width: 34, height: 34 }} />
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
