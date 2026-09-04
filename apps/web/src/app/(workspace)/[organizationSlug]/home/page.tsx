"use client";

import Link from "next/link";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from "@dhriti/ui";
import { alpha } from "@mui/material/styles";

const apps = [
  {
    name: "Connect",
    description: "Communicate and collaborate in real time.",
    image: "/connect.png",
  },
  {
    name: "Flow",
    description: "Plan, track, and deliver work efficiently.",
    image: "/flow.png",
  },
  {
    name: "Atlas",
    description: "Document, organize, and share knowledge effortlessly.",
    image: "/atlas.jpg",
  },
  {
    name: "Pulse",
    description: "Run better meetings and drive team alignment.",
    image: "/pulse.png",
  },
  {
    name: "Nexus",
    description: "AI-powered insights across your work graph.",
    image: "/nexus.png",
  }
];

const workItems = [
  { code: "PAY-101", title: "Fix duplicate payment transactions", priority: "High", app: "Flow", due: "20 May" },
  { code: "AUTH-82", title: "Review OAuth implementation", priority: "Medium", app: "Flow", due: "22 May" },
  { code: "UI-203", title: "Review payment dashboard", priority: "Low", app: "Flow", due: "24 May" },
  { code: "API-145", title: "Add rate limiting to API gateway", priority: "Medium", app: "Flow", due: "26 May" },
];

const mentions = [
  {
    channel: "#payments",
    by: "Amit",
    ago: "5m ago",
    text: "@Rahul please review the latest payment integration changes.",
    tone: "info",
  },
  {
    channel: "#engineering",
    by: "Priya",
    ago: "1h ago",
    text: "@Rahul can you update the deployment checklist?",
    tone: "secondary",
  },
  {
    channel: "Direct Message",
    by: "Sneha",
    ago: "2h ago",
    text: "@Rahul can we sync up on the API changes?",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
  },
];

const meetings = [
  { title: "Engineering Standup", subtitle: "Daily Standup", time: "10:00 AM - 10:30 AM" },
  { title: "Architecture Review", subtitle: "Project: Payment Gateway", time: "2:00 PM - 3:00 PM" },
  { title: "Sprint Review", subtitle: "Sprint 24", time: "4:00 PM - 5:00 PM" },
  { title: "Product Sync", subtitle: "Product Team", time: "5:30 PM - 6:00 PM" },
];

const knowledge = [
  { title: "Payment Architecture", updated: "Updated 20 minutes ago" },
  { title: "Authentication Guidelines", updated: "Updated yesterday" },
  { title: "Engineering Handbook", updated: "Updated 2 days ago" },
  { title: "API Integration Guide", updated: "Updated 3 days ago" },
];

const activities = [
  { title: "Rahul created PAY-101", app: "Flow", time: "10 minutes ago", color: "warning" },
  { title: "Amit mentioned you in #payments", app: "Connect", time: "20 minutes ago", color: "info" },
  { title: "Payment Architecture updated", app: "Atlas", time: "35 minutes ago", color: "secondary" },
  { title: "Sprint Review scheduled", app: "Pulse", time: "1 hour ago", color: "success" },
];

function priorityColors(priority: string) {
  if (priority === "High") {
    return { bg: "error.main", fg: "error.contrastText" };
  }

  if (priority === "Medium") {
    return { bg: "warning.main", fg: "warning.contrastText" };
  }

  return { bg: "surfaces.surfaceHover", fg: "text.secondary" };
}

function mutedStatusBackground(color: "success" | "warning" | "error" | "info" | "secondary") {
  return (theme: any) => alpha(theme.palette[color].main, 0.1);
}

export default function WorkspaceHomePage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4 }}>
        <Stack spacing={3.5}>
          <Card sx={{ background: (theme) => `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.14)}, ${theme.palette.background.paper})` }}>
            <CardContent sx={{ p: 4.5 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Good morning, Rahul!</Typography>
                  <Typography color="text.secondary">Tuesday, 20 May 2025</Typography>
                  <Typography color="text.secondary" sx={{ mt: 2.5 }}>Here&apos;s what&apos;s happening across your workspace.</Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>Acme Technologies</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>12 Active members</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>5 Applications</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 3 }}>
            <Card sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "borders.borderSubtle" }}>
                  <Typography sx={{ fontWeight: 700 }}>My Work</Typography>
                  <Link href="/flowrise/flow"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ px: 3, py: 2, overflowX: "auto" }}>
                  <Button size="small" variant="contained" sx={{ borderRadius: (theme) => theme.tokens.radius.pill, whiteSpace: "nowrap" }}>All (12)</Button>
                  <Button size="small" variant="outlined" sx={{ borderRadius: (theme) => theme.tokens.radius.pill, whiteSpace: "nowrap" }}>Assigned to me (5)</Button>
                  <Button size="small" variant="outlined" sx={{ borderRadius: (theme) => theme.tokens.radius.pill, whiteSpace: "nowrap" }}>Due soon (4)</Button>
                  <Button size="small" variant="outlined" sx={{ borderRadius: (theme) => theme.tokens.radius.pill, whiteSpace: "nowrap" }}>Overdue (3)</Button>
                </Stack>
                <List sx={{ p: 0 }}>
                  {workItems.map((task) => (
                    <ListItem key={task.code} divider sx={{ borderColor: "borders.borderSubtle", alignItems: "flex-start", gap: 1.5, py: 2.5, px: 3 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: 2, borderColor: "borders.border", mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="overline" color="text.disabled">{task.code}</Typography>
                          <Chip size="small" label={task.priority} sx={{ bgcolor: priorityColors(task.priority).bg, color: priorityColors(task.priority).fg }} />
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{task.title}</Typography>
                        <Stack direction="row" spacing={1.25}>
                          <Typography variant="caption" color="text.disabled">{task.app}</Typography>
                          <Typography variant="caption" color="text.disabled">{task.due}</Typography>
                        </Stack>
                      </Box>
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ p: 3, pt: 1.5 }}>
                  <Button fullWidth variant="outlined" sx={{ borderStyle: "dashed", py: 1.25 }}>+ Add task</Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "borders.borderSubtle" }}>
                  <Typography sx={{ fontWeight: 700 }}>Mentions in Connect</Typography>
                  <Link href="/flowrise/connect"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <List sx={{ p: 0 }}>
                  {mentions.map((mention) => (
                    <ListItem key={`${mention.channel}-${mention.ago}`} divider sx={{ borderColor: "borders.borderSubtle", px: 3, py: 2.5, alignItems: "flex-start" }}>
                      <Stack spacing={1.5} sx={{ width: "100%" }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                          <Stack direction="row" spacing={1.25}>
                            {mention.avatar ? (
                              <Avatar src={mention.avatar} sx={{ width: 40, height: 40, borderRadius: (theme) => theme.tokens.radius.md }} />
                            ) : (
                              <Box sx={{ width: 40, height: 40, borderRadius: (theme) => theme.tokens.radius.md, bgcolor: mutedStatusBackground(mention.tone as "info" | "secondary"), color: `${mention.tone}.main`, display: "grid", placeItems: "center", fontWeight: 700 }}>#</Box>
                            )}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{mention.channel}</Typography>
                              <Typography variant="caption" color="text.secondary">{mention.by} mentioned you</Typography>
                            </Box>
                          </Stack>
                          <Typography variant="overline" color="text.disabled">{mention.ago}</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: "text.secondary", pl: 1.5, borderLeft: 2, borderColor: "primary.main", fontStyle: "italic" }}>
                          &quot;{mention.text}&quot;
                        </Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "borders.borderSubtle" }}>
                  <Typography sx={{ fontWeight: 700 }}>Pulse - Upcoming Meetings</Typography>
                  <Link href="/flowrise/pulse"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <List sx={{ p: 0 }}>
                  {meetings.map((meeting) => (
                    <ListItem key={meeting.title} divider sx={{ borderColor: "borders.borderSubtle", px: 3, py: 2.5, alignItems: "flex-start", gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: (theme) => theme.tokens.radius.md, bgcolor: "surfaces.surfaceHover", color: "text.secondary", display: "grid", placeItems: "center" }}><Typography variant="caption">Cal</Typography></Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{meeting.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>{meeting.subtitle}</Typography>
                        <Typography variant="overline" color="text.disabled">{meeting.time}</Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" }, gap: 3 }}>
            <Card sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "borders.borderSubtle" }}>
                  <Typography sx={{ fontWeight: 700 }}>Recent Knowledge (Watchlist)</Typography>
                  <Link href="/flowrise/atlas"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <List sx={{ p: 0 }}>
                  {knowledge.map((item) => (
                    <ListItem key={item.title} divider sx={{ borderColor: "borders.borderSubtle", px: 2, py: 1.8, gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: (theme) => theme.tokens.radius.md, bgcolor: "surfaces.surfaceHover", color: "text.secondary", display: "grid", placeItems: "center" }}><Typography variant="caption">Doc</Typography></Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                        <Typography variant="caption" color="text.disabled">{item.updated}</Typography>
                      </Box>
                      <Chip size="small" label="Atlas" color="primary" />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "borders.borderSubtle" }}>
                  <Typography sx={{ fontWeight: 700 }}>Recent Activity</Typography>
                  <Link href="/flowrise/recent-activity"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <Box sx={{ p: 3, position: "relative" }}>
                  <Stack spacing={2.5}>
                    {activities.map((activity) => (
                      <Stack key={activity.title} direction="row" spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: (theme) => theme.tokens.radius.md, bgcolor: mutedStatusBackground(activity.color as "success" | "warning" | "info" | "secondary"), color: `${activity.color}.main`, display: "grid", placeItems: "center" }}>•</Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{activity.title}</Typography>
                          <Typography variant="overline" color="text.disabled">{activity.app} • {activity.time}</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "borders.borderSubtle" }}>
                  <Typography sx={{ fontWeight: 700 }}>AI / Intelligence (Nexus)</Typography>
                </Stack>
                <Box sx={{ p: 3, bgcolor: "surfaces.surfaceHover" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Ask anything about your workspace</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Get AI-powered insights across your work graph.</Typography>
                  <Stack spacing={1.25} sx={{ mb: 3.5 }}>
                    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "borders.borderSubtle", borderRadius: (theme) => theme.tokens.radius.lg, px: 2, py: 1.75 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>What are the biggest risks in our current sprint?</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "borders.borderSubtle", borderRadius: (theme) => theme.tokens.radius.lg, px: 2, py: 1.75 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Show me documents related to payment integration</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "borders.borderSubtle", borderRadius: (theme) => theme.tokens.radius.lg, px: 2, py: 1.75 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>What changed in the payment project this week?</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" fullWidth placeholder="Ask a question..." />
                    <Button variant="contained" sx={{ minWidth: 44, px: 1.5 }}>→</Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Divider />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
            <Typography variant="caption" color="text.secondary">© 2025 Flowrise. All rights reserved.</Typography>
            <Stack direction="row" spacing={2}>
              <Link href="#"><Typography variant="caption" color="text.secondary">Privacy Policy</Typography></Link>
              <Link href="#"><Typography variant="caption" color="text.secondary">Terms of Service</Typography></Link>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
