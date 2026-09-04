"use client";

import { Avatar, Box, Container, Stack, Typography } from "@dhriti/ui";
import HelpIcon from "@mui/icons-material/Help";
import NotificationNone from "@mui/icons-material/NotificationsNone";

type WorkspaceAppsHeaderProps = {
  appName?: string;
};

export function WorkspaceAppsHeader({ appName = "Home" }: WorkspaceAppsHeaderProps) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "borders.borderSubtle", bgcolor: "background.paper", position: "sticky", top: 0, zIndex: "appBar" }}>
      <Container maxWidth={false} sx={{ height: 68 }}>
        <Stack direction="row" sx={{ height: "100%", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={6} sx={{ alignItems: "center" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 36, height: 36, borderRadius: (theme) => theme.tokens.radius.md, bgcolor: "primary.main", color: "primary.contrastText", fontWeight: "fontWeightBold", display: "grid", placeItems: "center" }}>F</Box>
              <Typography variant="h6" sx={{ fontWeight: "fontWeightBold" }}>Flowrise</Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <NotificationNone sx={{ color: "text.secondary" }} />
            <HelpIcon sx={{ color: "text.secondary" }} />
            <Avatar src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" sx={{ width: 34, height: 34 }} />
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
