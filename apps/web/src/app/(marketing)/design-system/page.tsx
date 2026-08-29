import { Box, Stack, Typography } from "@mui/material";
import {
  AIResponse,
  AppSidebar,
  AppShell,
  ChannelHeader,
  PageHeader,
  TaskCard,
  TopBar,
  UIButton,
  UIEmptyState,
  UITextField,
} from "@dhriti/ui";

const sidebarItems = [
  { id: "home", label: "Home", active: true },
  { id: "connect", label: "Connect" },
  { id: "flow", label: "Flow" },
  { id: "atlas", label: "Atlas" },
  { id: "pulse", label: "Pulse" },
  { id: "nexus", label: "Nexus" },
  { id: "control", label: "Control" },
];

export default function DesignSystemPage() {
  return (
    <AppShell
      sidebar={<AppSidebar title="Dhriti" items={sidebarItems} />}
      topbar={<TopBar title="Design System Preview" actions={<UIButton size="small">New</UIButton>} />}
    >
      <Stack spacing={3}>
        <PageHeader
          title="Dhriti Enterprise UI"
          subtitle="Shared foundation across Home, Connect, Flow, Atlas, Pulse, Nexus, and Control"
          actions={<UIButton variant="outlined">Action</UIButton>}
        />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <TaskCard title="Finalize workspace roles" status="inProgress" priority="high" assignee="Priya" />
          <AIResponse text="Dhriti AI summary: Sprint health is at 82% with 3 blocked tasks requiring review." />
        </Box>

        <ChannelHeader title="Engineering" topic="Release planning" />
        <UITextField fullWidth label="Meeting note" placeholder="Capture decision or action item" />

        <UIEmptyState
          title="No unresolved blockers"
          description="Your teams are clear to continue."
          action={<UIButton size="small">Create Risk Note</UIButton>}
        />

        <Typography variant="caption" color="text.secondary">
          Preview route for Dhriti design system foundations.
        </Typography>
      </Stack>
    </AppShell>
  );
}
