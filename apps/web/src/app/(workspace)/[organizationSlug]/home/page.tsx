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
} from "@mui/material";

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
    tone: "#dbeafe",
  },
  {
    channel: "#engineering",
    by: "Priya",
    ago: "1h ago",
    text: "@Rahul can you update the deployment checklist?",
    tone: "#e0e7ff",
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
  { title: "Rahul created PAY-101", app: "Flow", time: "10 minutes ago", color: "#fff9e6" },
  { title: "Amit mentioned you in #payments", app: "Connect", time: "20 minutes ago", color: "#eff6ff" },
  { title: "Payment Architecture updated", app: "Atlas", time: "35 minutes ago", color: "#f5f3ff" },
  { title: "Sprint Review scheduled", app: "Pulse", time: "1 hour ago", color: "#fff7ed" },
];

function priorityColors(priority: string) {
  if (priority === "High") {
    return { bg: "#fef2f2", fg: "#dc2626" };
  }

  if (priority === "Medium") {
    return { bg: "#fffbeb", fg: "#ca8a04" };
  }

  return { bg: "#f9fafb", fg: "#9ca3af" };
}

export default function WorkspaceHomePage() {
  return (
    <Box className="bg-[#f8fafc] min-h-screen">
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: 4 }}>
        <Stack spacing={3.5}>
          <Card sx={{ borderRadius: 2, border: "1px solid #f3f4f6", boxShadow: "none", background: "linear-gradient(to right, #FACC15, #FFFFFF)", }}>
            <CardContent sx={{ p: 4.5 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.03em" }}>Good morning, Rahul!</Typography>
                  <Typography color="text.secondary">Tuesday, 20 May 2025</Typography>
                  <Typography color="text.secondary" sx={{ mt: 2.5 }}>Here&apos;s what&apos;s happening across your workspace.</Typography>
                </Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#4b5563" }}>Acme Technologies</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#4b5563" }}>12 Active members</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#4b5563" }}>5 Applications</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Box className="grid lg:grid-cols-3 gap-6">
            <Card sx={{ borderRadius: 2, border: "1px solid #f3f4f6", boxShadow: "none", overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f9fafb" }}>
                  <Typography sx={{ fontWeight: 700 }}>My Work</Typography>
                  <Link href="/flowrise/flow" className="bold"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ px: 3, py: 2, overflowX: "auto" }}>
                  <Button size="small" sx={{ px: 2, borderRadius: 99, bgcolor: "#111827", color: "#ffffff", whiteSpace: "nowrap" }}>All (12)</Button>
                  <Button size="small" sx={{ px: 2, borderRadius: 99, bgcolor: "#f9fafb", color: "#6b7280", whiteSpace: "nowrap" }}>Assigned to me (5)</Button>
                  <Button size="small" sx={{ px: 2, borderRadius: 99, bgcolor: "#f9fafb", color: "#6b7280", whiteSpace: "nowrap" }}>Due soon (4)</Button>
                  <Button size="small" sx={{ px: 2, borderRadius: 99, bgcolor: "#f9fafb", color: "#6b7280", whiteSpace: "nowrap" }}>Overdue (3)</Button>
                </Stack>
                <List sx={{ p: 0 }}>
                  {workItems.map((task) => (
                    <ListItem key={task.code} divider sx={{ borderColor: "#f9fafb", alignItems: "flex-start", gap: 1.5, py: 2.5, px: 3 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: 99, border: "2px solid #e5e7eb", mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em" }}>{task.code}</Typography>
                          <Chip size="small" label={task.priority} sx={{ bgcolor: priorityColors(task.priority).bg, color: priorityColors(task.priority).fg, fontSize: 10, fontWeight: 700 }} />
                        </Stack>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{task.title}</Typography>
                        <Stack direction="row" spacing={1.25}>
                          <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{task.app}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{task.due}</Typography>
                        </Stack>
                      </Box>
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ p: 3, pt: 1.5 }}>
                  <Button fullWidth variant="outlined" sx={{ borderStyle: "dashed", borderColor: "#e5e7eb", color: "#9ca3af", py: 1.25 }}>+ Add task</Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, border: "1px solid #f3f4f6", boxShadow: "none", overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f9fafb" }}>
                  <Typography sx={{ fontWeight: 700 }}>Mentions in Connect</Typography>
                  <Link href="/flowrise/connect" className="bold"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <List sx={{ p: 0 }}>
                  {mentions.map((mention) => (
                    <ListItem key={`${mention.channel}-${mention.ago}`} divider sx={{ borderColor: "#f9fafb", px: 3, py: 2.5, alignItems: "flex-start" }}>
                      <Stack spacing={1.5} sx={{ width: "100%" }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                          <Stack direction="row" spacing={1.25}>
                            {mention.avatar ? (
                              <Avatar src={mention.avatar} sx={{ width: 40, height: 40, borderRadius: 2.5 }} />
                            ) : (
                              <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: mention.tone, color: "#3b82f6", display: "grid", placeItems: "center", fontWeight: 700 }}>#</Box>
                            )}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{mention.channel}</Typography>
                              <Typography sx={{ fontSize: 12, color: "#4b5563" }}>{mention.by} mentioned you</Typography>
                            </Box>
                          </Stack>
                          <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>{mention.ago}</Typography>
                        </Stack>
                        <Typography sx={{ fontSize: 12, color: "#6b7280", pl: 1.5, borderLeft: "2px solid #facc15", fontStyle: "italic" }}>
                          &quot;{mention.text}&quot;
                        </Typography>
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, border: "1px solid #f3f4f6", boxShadow: "none", overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f9fafb" }}>
                  <Typography sx={{ fontWeight: 700 }}>Pulse - Upcoming Meetings</Typography>
                  <Link href="/flowrise/pulse" className="bold"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <List sx={{ p: 0 }}>
                  {meetings.map((meeting) => (
                    <ListItem key={meeting.title} divider sx={{ borderColor: "#f9fafb", px: 3, py: 2.5, alignItems: "flex-start", gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: "#f9fafb", color: "#9ca3af", display: "grid", placeItems: "center", fontSize: 12 }}>Cal</Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{meeting.title}</Typography>
                        <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 0.5 }}>{meeting.subtitle}</Typography>
                        <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>{meeting.time}</Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          <Box className="grid lg:grid-cols-3 gap-6">
            <Card sx={{ borderRadius: 2, border: "1px solid #f3f4f6", boxShadow: "none", overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f9fafb" }}>
                  <Typography sx={{ fontWeight: 700 }}>Recent Knowledge (Watchlist)</Typography>
                  <Link href="/flowrise/atlas" className="bold"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <List sx={{ p: 0 }}>
                  {knowledge.map((item) => (
                    <ListItem key={item.title} divider sx={{ borderColor: "#f9fafb", px: 2, py: 1.8, gap: 1.5 }}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: "#f9fafb", color: "#9ca3af", display: "grid", placeItems: "center", fontSize: 11 }}>Doc</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                        <Typography sx={{ fontSize: 10, color: "#9ca3af" }}>{item.updated}</Typography>
                      </Box>
                      <Chip size="small" label="Atlas" sx={{ bgcolor: "#fffcf0", color: "#a16207", fontSize: 10, fontWeight: 700 }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, border: "1px solid #f3f4f6", boxShadow: "none", overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f9fafb" }}>
                  <Typography sx={{ fontWeight: 700 }}>Recent Activity</Typography>
                  <Link href="/flowrise/recent-activity" className="bold"><Typography variant="body2" sx={{ fontWeight: 700 }}>View all</Typography></Link>
                </Stack>
                <Box sx={{ p: 3, position: "relative" }}>
                  <Stack spacing={2.5}>
                    {activities.map((activity) => (
                      <Stack key={activity.title} direction="row" spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: activity.color, color: "#6b7280", display: "grid", placeItems: "center", fontSize: 11 }}>●</Box>
                        <Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{activity.title}</Typography>
                          <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{activity.app} • {activity.time}</Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, border: "1px solid #f3f4f6", boxShadow: "none", overflow: "hidden" }}>
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ p: 3, justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f9fafb" }}>
                  <Typography sx={{ fontWeight: 700 }}>AI / Intelligence (Nexus)</Typography>
                </Stack>
                <Box sx={{ p: 3, bgcolor: "#fffcf5" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Ask anything about your workspace</Typography>
                  <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 2.5 }}>Get AI-powered insights across your work graph.</Typography>
                  <Stack spacing={1.25} sx={{ mb: 3.5 }}>
                    <Box sx={{ bgcolor: "#fff", border: "1px solid #f3f4f6", borderRadius: 3, px: 2, py: 1.75 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>What are the biggest risks in our current sprint?</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "#fff", border: "1px solid #f3f4f6", borderRadius: 3, px: 2, py: 1.75 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>Show me documents related to payment integration</Typography>
                    </Box>
                    <Box sx={{ bgcolor: "#fff", border: "1px solid #f3f4f6", borderRadius: 3, px: 2, py: 1.75 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>What changed in the payment project this week?</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" fullWidth placeholder="Ask a question..." sx={{ '& .MuiOutlinedInput-root': { bgcolor: "#fff", borderRadius: 3 } }} />
                    <Button variant="contained" sx={{ minWidth: 44, px: 1.5, bgcolor: "#facc15", color: "#111827", '&:hover': { bgcolor: "#facc15" } }}>→</Button>
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
