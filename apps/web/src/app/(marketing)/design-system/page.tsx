"use server";

import {
  AIResponse,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  EmptyState,
  Stack,
  TextField,
  Typography,
} from "@dhriti/ui";

const foundations = ["Theme tokens", "Form controls", "Data states", "AI responses"];

const workItems = [
  { title: "Finalize workspace roles", status: "In progress", priority: "High" },
  { title: "Publish meeting notes", status: "Ready", priority: "Medium" },
];

export async function DesignSystemPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" } }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: "fontWeightBold" }}>
                Dhriti Enterprise UI
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Shared foundation across Home, Connect, Flow, Atlas, Pulse, Nexus, and Control.
              </Typography>
            </Box>
            <Button variant="contained">New Component</Button>
          </Stack>

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" } }}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: "fontWeightBold" }}>
                    Work Item Cards
                  </Typography>
                  {workItems.map((item) => (
                    <Box key={item.title} sx={{ p: 2, border: 1, borderColor: "borders.borderSubtle", borderRadius: (theme) => theme.tokens.radius.md, bgcolor: "surfaces.surfaceHover" }}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                        <Chip label={item.priority} size="small" />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{item.status}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: "fontWeightBold" }}>
                    AI Response
                  </Typography>
                  <AIResponse text="Dhriti AI summary: Sprint health is at 82% with 3 blocked tasks requiring review." />
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: "fontWeightBold" }}>
                  Controls
                </Typography>
                <TextField fullWidth label="Meeting note" placeholder="Capture decision or action item" />
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  {foundations.map((label) => (
                    <Chip key={label} label={label} />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <EmptyState
            title="No unresolved blockers"
            description="Your teams are clear to continue."
            action={<Button size="small">Create Risk Note</Button>}
          />

          <Typography variant="caption" color="text.secondary">
            Preview route for Dhriti design system foundations.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
