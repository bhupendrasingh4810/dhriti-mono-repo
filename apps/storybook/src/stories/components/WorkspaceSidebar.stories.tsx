import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  AlternateEmailRounded,
  AutoAwesomeRounded,
  CalendarMonthRounded,
  ChatBubbleRounded,
  DraftsRounded,
  FormatListBulletedRounded,
  HomeRounded,
  Inventory2Rounded,
  MenuBookRounded,
  PaletteRounded,
  SyncRounded,
  TuneRounded,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { AppRail as AppRailComponent, ConnectSidebarNavigation } from "@dhriti/ui";

const meta: Meta = {
  title: "Components/Workspace Sidebars",
};

export default meta;
type Story = StoryObj;

const appRailItems = [
  { label: "Home", icon: HomeRounded, href: "#" },
  { label: "Connect", icon: ChatBubbleRounded, href: "#", active: true },
  { label: "Flow", icon: SyncRounded, href: "#" },
  { label: "Atlas", icon: MenuBookRounded, href: "#" },
  { label: "Pulse", icon: CalendarMonthRounded, href: "#" },
  { label: "Nexus", icon: AutoAwesomeRounded, href: "#", iconColor: "#3b82f6" },
  { label: "Control", icon: TuneRounded, href: "#" },
];

const quickViews = [
  { icon: AlternateEmailRounded, label: "Mentions", value: 7 },
  { icon: FormatListBulletedRounded, label: "Threads", value: 5 },
  { icon: DraftsRounded, label: "Drafts", value: 2 },
];

const favouriteConversations = [
  { id: "personal_usr_001", name: "Aarav Sharma (You)", type: "direct" as const, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg", unreadCount: 0, isSelfSpace: true },
  { id: "channel_eng_general", name: "general", type: "channel" as const, unreadCount: 4 },
  { id: "channel_eng_backend", name: "backend", type: "channel" as const, unreadCount: 1 },
];

const chatConversations = [
  { id: "direct_amit", name: "Amit Singh", type: "direct" as const, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg", unreadCount: 2 },
  { id: "direct_priya", name: "Priya Nair", type: "direct" as const, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg", unreadCount: 0 },
  { id: "group_marketing", name: "Marketing Team", type: "group" as const, unreadCount: 3 },
  { id: "group_release", name: "Release Squad", type: "group" as const, unreadCount: 0 },
];

const teams = [
  {
    id: "team_001",
    label: "Engineering",
    icon: Inventory2Rounded,
    isExpanded: true,
    channels: [
      { id: "channel_eng_general", name: "General", slug: "general" },
      { id: "channel_eng_backend", name: "Backend", slug: "backend" },
      { id: "channel_eng_frontend", name: "Frontend", slug: "frontend" },
      { id: "channel_eng_devops", name: "DevOps", slug: "devops", isPrivate: true },
    ],
  },
  {
    id: "team_002",
    label: "Product",
    icon: Inventory2Rounded,
    isExpanded: false,
    channels: [
      { id: "channel_prod_roadmap", name: "Roadmap", slug: "roadmap" },
      { id: "channel_prod_launch", name: "Launch", slug: "launch" },
    ],
  },
  {
    id: "team_003",
    label: "Design",
    icon: PaletteRounded,
    isExpanded: false,
    channels: [{ id: "channel_design_system", name: "Design System", slug: "design-system" }],
  },
];

function ConnectSidebarNavigationPreview() {
  const [selectedConversationId, setSelectedConversationId] = useState("channel_eng_general");
  const [activeQuickViewId, setActiveQuickViewId] = useState<string | null>(null);
  const [quickViewsOpen, setQuickViewsOpen] = useState(true);
  const [favouritesOpen, setFavouritesOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [teamState, setTeamState] = useState(teams);

  return (
    <ConnectSidebarNavigation
      quickViews={quickViews.map((item) => ({
        id: item.label.toLowerCase() as "mentions" | "threads" | "drafts",
        icon: item.icon,
        label: item.label,
        value: item.value,
      }))}
      favoriteConversations={favouriteConversations}
      chatConversations={chatConversations}
      teams={teamState}
      selectedConversationId={selectedConversationId}
      activeQuickViewId={activeQuickViewId}
      quickViewsOpen={quickViewsOpen}
      favouritesOpen={favouritesOpen}
      chatsOpen={chatsOpen}
      teamsOpen={teamsOpen}
      onToggleQuickViews={() => setQuickViewsOpen((prev) => !prev)}
      onToggleFavourites={() => setFavouritesOpen((prev) => !prev)}
      onToggleChats={() => setChatsOpen((prev) => !prev)}
      onToggleTeams={() => setTeamsOpen((prev) => !prev)}
      onToggleTeam={(teamId) => {
        setTeamState((previous) => previous.map((team) => (team.id === teamId ? { ...team, isExpanded: !team.isExpanded } : team)));
      }}
      onSelectConversation={(conversationId) => {
        setSelectedConversationId(conversationId);
        setActiveQuickViewId(null);
      }}
      onSelectQuickView={(quickViewId) => {
        setActiveQuickViewId(quickViewId);
      }}
      onOpenSidebarMenu={() => {
        // Storybook preview: menu actions are intentionally no-op.
      }}
    />
  );
}

export const AppRailStory: Story = {
  render: () => (
    <Box sx={{ height: 620, display: "flex" }}>
      <AppRailComponent items={appRailItems} />
    </Box>
  ),
};

export const ChatNavigationStory: Story = {
  render: () => (
    <Box sx={{ height: 620, display: "flex", bgcolor: "#f9fafb", p: 2 }}>
      <ConnectSidebarNavigationPreview />
    </Box>
  ),
};
