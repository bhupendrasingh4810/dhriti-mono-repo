"use client";

import { useState } from "react";
import type { ElementType, MouseEvent } from "react";
import {
  ChevronRightRounded,
  ExpandMoreRounded,
  Inventory2Rounded,
  MoreHorizRounded,
} from "@mui/icons-material";
import { Avatar, Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";

export type ConnectSidebarSectionId = "quick-views" | "favorites" | "chats" | "teams";

export type ConnectSidebarMenuContext = {
  kind: "section" | "quick-view" | "team" | "channel" | "user" | "personal";
  id: string;
  label: string;
  sectionId?: ConnectSidebarSectionId;
  parentId?: string;
};

export type ConnectSidebarConversation = {
  id: string;
  name: string;
  type: "channel" | "direct" | "group";
  avatar?: string;
  unreadCount?: number;
  isSelfSpace?: boolean;
};

export type ConnectSidebarTeamChannel = {
  id: string;
  name: string;
  slug: string;
  isPrivate?: boolean;
};

export type ConnectSidebarTeamGroup = {
  id: string;
  label: string;
  icon?: ElementType;
  channels: ConnectSidebarTeamChannel[];
  isExpanded: boolean;
};

export type ConnectSidebarQuickView = {
  id: "mentions" | "threads" | "drafts";
  label: string;
  icon: ElementType;
  value: number;
};

type ConnectSidebarNavigationProps = {
  quickViews: ConnectSidebarQuickView[];
  favoriteConversations: ConnectSidebarConversation[];
  chatConversations: ConnectSidebarConversation[];
  teams: ConnectSidebarTeamGroup[];
  selectedConversationId: string;
  activeQuickViewId?: string | null;
  quickViewsOpen: boolean;
  favouritesOpen: boolean;
  chatsOpen: boolean;
  teamsOpen: boolean;
  onToggleQuickViews: () => void;
  onToggleFavourites: () => void;
  onToggleChats: () => void;
  onToggleTeams: () => void;
  onToggleTeam: (teamId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onSelectQuickView: (quickViewId: ConnectSidebarQuickView["id"]) => void;
  onOpenSidebarMenu: (event: MouseEvent<HTMLElement>, context: ConnectSidebarMenuContext) => void;
};

function SidebarSectionHeader({
  title,
  open,
  onToggle,
  onOpenMenu,
  hovered,
  menuTooltip,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
  hovered: boolean;
  menuTooltip: string;
}) {
  return (
    <Stack direction="row" sx={{ px: 1.5, mb: 1, justifyContent: "space-between", alignItems: "center" }}>
      <Typography onClick={onToggle} sx={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", cursor: "pointer" }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={0.2} sx={{ alignItems: "center" }}>
        <Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center" }}>
          <Tooltip title={menuTooltip}>
            <IconButton size="small" onClick={onOpenMenu} sx={{ opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none", transition: "opacity 120ms ease" }}>
              <MoreHorizRounded sx={{ fontSize: 17, color: "#9ca3af" }} />
            </IconButton>
          </Tooltip>
        </Box>
        <ExpandMoreRounded onClick={onToggle} sx={{ fontSize: 18, color: "#9ca3af", cursor: "pointer", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 140ms ease" }} />
      </Stack>
    </Stack>
  );
}

function SidebarTrailingSlot({
  hovered,
  count,
  tooltip,
  onOpenMenu,
}: {
  hovered: boolean;
  count?: number;
  tooltip: string;
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Box sx={{ width: 28, height: 28, position: "relative", flexShrink: 0 }}>
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: hovered ? 0 : 1, transition: "opacity 120ms ease", pointerEvents: "none" }}>
        {(count ?? 0) > 0 ? <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#a16207" }}>{count}</Typography> : null}
      </Box>
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: hovered ? 1 : 0, transition: "opacity 120ms ease", pointerEvents: hovered ? "auto" : "none" }}>
        <Tooltip title={tooltip}>
          <IconButton size="small" onClick={onOpenMenu}>
            <MoreHorizRounded sx={{ fontSize: 17, color: "#9ca3af" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function ConnectSidebarNavigation({
  quickViews,
  favoriteConversations,
  chatConversations,
  teams,
  selectedConversationId,
  activeQuickViewId,
  quickViewsOpen,
  favouritesOpen,
  chatsOpen,
  teamsOpen,
  onToggleQuickViews,
  onToggleFavourites,
  onToggleChats,
  onToggleTeams,
  onToggleTeam,
  onSelectConversation,
  onSelectQuickView,
  onOpenSidebarMenu,
}: ConnectSidebarNavigationProps) {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<ConnectSidebarSectionId | null>(null);

  return (
    <Box
      sx={{
        width: 312,
        bgcolor: "#fff",
        borderRight: "1px solid #f3f4f6",
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" sx={{ p: 2, borderBottom: "1px solid #f9fafb", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Connect</Typography>
        <MoreHorizRounded sx={{ fontSize: 18, color: "#9ca3af" }} />
      </Stack>

      <Box sx={{ p: 1.5, overflowY: "auto" }}>
        <Stack spacing={3}>
          <Box onMouseEnter={() => setHoveredSectionId("quick-views")} onMouseLeave={() => setHoveredSectionId((previous) => (previous === "quick-views" ? null : previous))}>
            <SidebarSectionHeader
              title="Quick Views"
              open={quickViewsOpen}
              onToggle={onToggleQuickViews}
              hovered={hoveredSectionId === "quick-views"}
              menuTooltip="More quick view options"
              onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "section", id: "quick-views", label: "Quick Views", sectionId: "quick-views" })}
            />
            {quickViewsOpen ? (
              <Stack spacing={0.25}>
                {quickViews.map((view) => {
                  const Icon = view.icon;
                  const rowId = `quick-view-${view.id}`;
                  const isActive = activeQuickViewId === view.id;
                  const isHovered = hoveredRowId === rowId;

                  return (
                    <Stack
                      key={view.id}
                      direction="row"
                      onMouseEnter={() => setHoveredRowId(rowId)}
                      onMouseLeave={() => setHoveredRowId((previous) => (previous === rowId ? null : previous))}
                      onClick={() => onSelectQuickView(view.id)}
                      sx={{ px: 1.5, py: 0.9, borderRadius: 2, alignItems: "center", justifyContent: "space-between", cursor: "pointer", bgcolor: isActive ? "#f9fafb" : "transparent", "&:hover": { bgcolor: "#f9fafb" } }}
                    >
                      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", color: "#4b5563" }}>
                        <Icon sx={{ fontSize: 16, color: isActive ? "#2563eb" : "#9ca3af" }} />
                        <Typography sx={{ fontSize: 14, fontWeight: isActive ? 700 : 600 }}>{view.label}</Typography>
                      </Stack>
                      <SidebarTrailingSlot
                        hovered={isHovered}
                        count={view.value}
                        tooltip={view.id === "drafts" ? "More draft options" : "More quick view options"}
                        onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "quick-view", id: view.id, label: view.label, sectionId: "quick-views" })}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            ) : null}
          </Box>

          <Box onMouseEnter={() => setHoveredSectionId("favorites")} onMouseLeave={() => setHoveredSectionId((previous) => (previous === "favorites" ? null : previous))}>
            <SidebarSectionHeader
              title="Favorites"
              open={favouritesOpen}
              onToggle={onToggleFavourites}
              hovered={hoveredSectionId === "favorites"}
              menuTooltip="More section options"
              onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "section", id: "favorites", label: "Favorites", sectionId: "favorites" })}
            />
            {favouritesOpen ? (
              <Stack spacing={0.25}>
                {favoriteConversations.map((conversation) => {
                  const rowId = `favorite-${conversation.id}`;
                  const isSelected = selectedConversationId === conversation.id;
                  const unread = conversation.unreadCount ?? 0;
                  const isHovered = hoveredRowId === rowId;

                  return (
                    <Stack
                      key={conversation.id}
                      direction="row"
                      onMouseEnter={() => setHoveredRowId(rowId)}
                      onMouseLeave={() => setHoveredRowId((previous) => (previous === rowId ? null : previous))}
                      onClick={() => onSelectConversation(conversation.id)}
                      sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, alignItems: "center", justifyContent: "space-between", cursor: "pointer", bgcolor: isSelected ? "#f9fafb" : "transparent", "&:hover": { bgcolor: "#f9fafb" } }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                        {conversation.type === "channel" ? (
                          <Typography sx={{ fontSize: 12, color: isSelected ? "#60a5fa" : "#818cf8", fontWeight: 700 }}>#</Typography>
                        ) : (
                          <Avatar src={conversation.avatar} sx={{ width: 16, height: 16 }} />
                        )}
                        <Typography sx={{ fontSize: 14, color: "#4b5563", fontWeight: isSelected ? 700 : 500 }} noWrap>
                          {conversation.name}
                        </Typography>
                      </Stack>
                      <SidebarTrailingSlot
                        hovered={isHovered}
                        count={unread}
                        tooltip={conversation.isSelfSpace ? "More personal options" : conversation.type === "channel" ? "More channel options" : "More chat options"}
                        onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: conversation.isSelfSpace ? "personal" : conversation.type === "channel" ? "channel" : "user", id: conversation.id, label: conversation.name, sectionId: "favorites" })}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            ) : null}
          </Box>

          <Box onMouseEnter={() => setHoveredSectionId("chats")} onMouseLeave={() => setHoveredSectionId((previous) => (previous === "chats" ? null : previous))}>
            <SidebarSectionHeader
              title="Chats"
              open={chatsOpen}
              onToggle={onToggleChats}
              hovered={hoveredSectionId === "chats"}
              menuTooltip="More section options"
              onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "section", id: "chats", label: "Chats", sectionId: "chats" })}
            />
            {chatsOpen ? (
              <Stack spacing={0.25}>
                {chatConversations.map((conversation) => {
                  const unread = conversation.unreadCount ?? 0;
                  const isSelected = selectedConversationId === conversation.id;
                  const rowId = `chat-${conversation.id}`;
                  const isHovered = hoveredRowId === rowId;

                  return (
                    <Stack
                      key={conversation.id}
                      direction="row"
                      onMouseEnter={() => setHoveredRowId(rowId)}
                      onMouseLeave={() => setHoveredRowId((previous) => (previous === rowId ? null : previous))}
                      onClick={() => onSelectConversation(conversation.id)}
                      sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, alignItems: "center", justifyContent: "space-between", cursor: "pointer", bgcolor: isSelected ? "#f9fafb" : "transparent", "&:hover": { bgcolor: "#f9fafb" } }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                        <Avatar src={conversation.avatar} sx={{ width: 16, height: 16 }} />
                        <Typography sx={{ fontSize: 14, color: "#4b5563", fontWeight: unread > 0 ? 700 : 500 }} noWrap>
                          {conversation.name}
                        </Typography>
                      </Stack>
                      <SidebarTrailingSlot
                        hovered={isHovered}
                        count={unread}
                        tooltip="More chat options"
                        onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "user", id: conversation.id, label: conversation.name, sectionId: "chats" })}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            ) : null}
          </Box>

          <Box onMouseEnter={() => setHoveredSectionId("teams")} onMouseLeave={() => setHoveredSectionId((previous) => (previous === "teams" ? null : previous))}>
            <SidebarSectionHeader
              title="Teams & Channels"
              open={teamsOpen}
              onToggle={onToggleTeams}
              hovered={hoveredSectionId === "teams"}
              menuTooltip="More section options"
              onOpenMenu={(event) => onOpenSidebarMenu(event, { kind: "section", id: "teams", label: "Teams & Channels", sectionId: "teams" })}
            />
            {teamsOpen ? (
              <Stack spacing={0.5} sx={{ px: 1.5 }}>
                {teams.map((team) => {
                  const TeamIcon = team.icon ?? Inventory2Rounded;
                  const teamRowId = `team-${team.id}`;
                  const teamHovered = hoveredRowId === teamRowId;

                  return (
                    <Stack key={team.id} spacing={0.35}>
                      <Stack
                        direction="row"
                        onMouseEnter={() => setHoveredRowId(teamRowId)}
                        onMouseLeave={() => setHoveredRowId((previous) => (previous === teamRowId ? null : previous))}
                        sx={{ alignItems: "center", justifyContent: "space-between" }}
                      >
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0, cursor: "pointer" }} onClick={() => onToggleTeam(team.id)}>
                          {team.isExpanded ? <ExpandMoreRounded sx={{ fontSize: 18 }} /> : <ChevronRightRounded sx={{ fontSize: 18 }} />}
                          <TeamIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 700 }} noWrap>{team.label}</Typography>
                        </Stack>
                        <Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <Tooltip title="More team options">
                            <IconButton size="small" onClick={(event) => onOpenSidebarMenu(event, { kind: "team", id: team.id, label: team.label, sectionId: "teams" })} sx={{ opacity: teamHovered ? 1 : 0, pointerEvents: teamHovered ? "auto" : "none", transition: "opacity 120ms ease" }}>
                              <MoreHorizRounded sx={{ fontSize: 17, color: "#9ca3af" }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Stack>

                      {team.isExpanded ? (
                        <Stack sx={{ pl: 3 }}>
                          {team.channels.map((channel) => {
                            const isSelected = selectedConversationId === channel.id;
                            const channelRowId = `channel-${channel.id}`;
                            const channelHovered = hoveredRowId === channelRowId;

                            return (
                              <Stack
                                key={channel.id}
                                direction="row"
                                onMouseEnter={() => setHoveredRowId(channelRowId)}
                                onMouseLeave={() => setHoveredRowId((previous) => (previous === channelRowId ? null : previous))}
                                sx={{ alignItems: "center", justifyContent: "space-between" }}
                              >
                                <Typography onClick={() => onSelectConversation(channel.id)} sx={{ py: 0.45, px: 0.6, borderRadius: 1, fontSize: 14, color: isSelected ? "#2563eb" : "#6b7280", fontWeight: isSelected ? 700 : 500, cursor: "pointer", "&:hover": { bgcolor: "#f9fafb" } }}>
                                  {channel.isPrivate ? "lock " : "# "}{channel.slug}
                                </Typography>
                                <Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                  <Tooltip title="More channel options">
                                    <IconButton size="small" onClick={(event) => onOpenSidebarMenu(event, { kind: "channel", id: channel.id, label: channel.name, parentId: team.id, sectionId: "teams" })} sx={{ opacity: channelHovered ? 1 : 0, pointerEvents: channelHovered ? "auto" : "none", transition: "opacity 120ms ease" }}>
                                      <MoreHorizRounded sx={{ fontSize: 17, color: "#9ca3af" }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Stack>
                            );
                          })}
                        </Stack>
                      ) : null}
                    </Stack>
                  );
                })}
              </Stack>
            ) : null}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
