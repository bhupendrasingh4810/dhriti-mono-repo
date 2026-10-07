import { useState } from "react";
import type { ElementType, MouseEvent, ReactNode } from "react";
import { ChevronRightRounded, ExpandMoreRounded, Inventory2Rounded, MoreHorizRounded } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@dhriti/ui";
import {
  ConnectSidebarQuickView,
  ConnectSidebarConversation,
  ConnectSidebarTeamGroup,
  ConnectSidebarMenuContext,
  ConnectSidebarSectionId,
} from "@/types/connect.types";

const sidebarMenuButtonSx = {
  width: 28,
  height: 28,
  minWidth: 28,
  p: 0,
  display: "inline-grid",
  placeItems: "center",
  bgcolor: "transparent",
  "&:hover": {
    bgcolor: "transparent",
  },
};

type ConnectSidebarProps = {
  quickViews: ConnectSidebarQuickView[];
  favoriteConversations: ConnectSidebarConversation[];
  chatConversations: ConnectSidebarConversation[];
  teams: ConnectSidebarTeamGroup[];
  selectedConversationId: string;
  activeQuickViewId?: string | null;
  onToggleTeam: (teamId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onSelectQuickView: (quickViewId: ConnectSidebarQuickView["id"]) => void;
  onOpenSidebarMenu: (event: MouseEvent<HTMLElement>, context: ConnectSidebarMenuContext) => void;
};

function SidebarAccordionSection({
  sectionId,
  title,
  open,
  onToggle,
  onOpenMenu,
  hoveredSectionId,
  onHoverSection,
  menuTooltip,
  children,
}: {
  sectionId: ConnectSidebarSectionId;
  title: string;
  open: boolean;
  onToggle: () => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
  hoveredSectionId: ConnectSidebarSectionId | null;
  onHoverSection: (sectionId: ConnectSidebarSectionId | null) => void;
  menuTooltip: string;
  children: ReactNode;
}) {
  const hovered = hoveredSectionId === sectionId;

  return (
    <Accordion
      expanded={open}
      onChange={onToggle}
      disableGutters
      square
      elevation={0}
      onMouseEnter={() => onHoverSection(sectionId)}
      onMouseLeave={() => onHoverSection(null)}
      sx={{ position: "relative", bgcolor: "transparent", border: 0, boxShadow: "none", "&::before": { display: "none" } }}
    >
      <AccordionSummary
        sx={{
          px: 1.5,
          mb: 1,
          minHeight: 0,
          "&.Mui-expanded": { minHeight: 0 },
          "& .MuiAccordionSummary-content": { m: 0, alignItems: "center", justifyContent: "space-between" },
          "& .MuiAccordionSummary-content.Mui-expanded": { m: 0 },
        }}
      >
        <Typography variant="overline" color="text.disabled">
          {title}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <ExpandMoreRounded
            sx={{
              fontSize: 18,
              color: "text.disabled",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: (theme) => theme.transitions.create("transform", { duration: 140 }),
            }}
          />
        </Stack>
      </AccordionSummary>
      <Box sx={{ position: "absolute", right: 30, top: 0, width: 28, height: 28, display: "grid", placeItems: "center", zIndex: 1 }}>
        <Tooltip title={menuTooltip}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onOpenMenu(event);
            }}
            sx={{
              ...sidebarMenuButtonSx,
              opacity: hovered ? 1 : 0,
              pointerEvents: hovered ? "auto" : "none",
              transition: (theme) => theme.transitions.create("opacity", { duration: 120 }),
            }}
          >
            <MoreHorizRounded sx={{ fontSize: 17, color: "text.disabled" }} />
          </IconButton>
        </Tooltip>
      </Box>
      <AccordionDetails sx={{ p: 0 }}>{children}</AccordionDetails>
    </Accordion>
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
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          opacity: hovered ? 0 : 1,
          transition: (theme) => theme.transitions.create("opacity", { duration: 120 }),
          pointerEvents: "none",
        }}
      >
        {(count ?? 0) > 0 ? (
          <Typography variant="overline" color="primary.main">
            {count}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          opacity: hovered ? 1 : 0,
          transition: (theme) => theme.transitions.create("opacity", { duration: 120 }),
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <Tooltip title={tooltip}>
          <IconButton size="small" onClick={onOpenMenu} sx={sidebarMenuButtonSx}>
            <MoreHorizRounded sx={{ fontSize: 17, color: "text.disabled" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export function ConnectSidebar({
  quickViews,
  favoriteConversations,
  chatConversations,
  teams,
  selectedConversationId,
  activeQuickViewId,
  onToggleTeam,
  onSelectConversation,
  onSelectQuickView,
  onOpenSidebarMenu,
}: ConnectSidebarProps) {
  const [quickViewsOpen, setQuickViewsOpen] = useState(true);
  const [favouritesOpen, setFavouritesOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<ConnectSidebarSectionId | null>(null);

  return (
    <Box
      sx={{
        width: 312,
        bgcolor: "background.paper",
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <Stack direction="row" sx={{ p: 2, alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Connect
        </Typography>
        <MoreHorizRounded sx={{ fontSize: 18, color: "text.disabled" }} />
      </Stack>

      <Box sx={{ p: 1.5, overflowY: "auto" }}>
        <Stack spacing={3}>
          <SidebarAccordionSection
            sectionId="quick-views"
            title="Quick Views"
            open={quickViewsOpen}
            onToggle={() => setQuickViewsOpen((prev) => !prev)}
            hoveredSectionId={hoveredSectionId}
            onHoverSection={setHoveredSectionId}
            menuTooltip="More quick view options"
            onOpenMenu={(event) =>
              onOpenSidebarMenu(event, {
                kind: "section",
                id: "quick-views",
                label: "Quick Views",
                sectionId: "quick-views",
              })
            }
          >
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
                    sx={{
                      px: 1.5,
                      py: 0.9,
                      borderRadius: (theme) => theme.tokens.radius.md,
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      bgcolor: isActive ? "surfaces.surfaceSelected" : "transparent",
                      "&:hover": { bgcolor: "surfaces.surfaceHover" },
                    }}
                  >
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", color: "text.secondary" }}>
                      <Icon sx={{ fontSize: 16, color: isActive ? "primary.main" : "text.disabled" }} />
                      <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 600 }}>
                        {view.label}
                      </Typography>
                    </Stack>
                    <SidebarTrailingSlot
                      hovered={isHovered}
                      count={view.value}
                      tooltip={view.id === "drafts" ? "More draft options" : "More quick view options"}
                      onOpenMenu={(event) =>
                        onOpenSidebarMenu(event, {
                          kind: "quick-view",
                          id: view.id,
                          label: view.label,
                          sectionId: "quick-views",
                        })
                      }
                    />
                  </Stack>
                );
              })}
            </Stack>
          </SidebarAccordionSection>

          <SidebarAccordionSection
            sectionId="favorites"
            title="Favorites"
            open={favouritesOpen}
            onToggle={() => setFavouritesOpen((prev) => !prev)}
            hoveredSectionId={hoveredSectionId}
            onHoverSection={setHoveredSectionId}
            menuTooltip="More section options"
            onOpenMenu={(event) =>
              onOpenSidebarMenu(event, { kind: "section", id: "favorites", label: "Favorites", sectionId: "favorites" })
            }
          >
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
                    sx={{
                      px: 1.5,
                      py: 0.8,
                      borderRadius: (theme) => theme.tokens.radius.sm,
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      bgcolor: isSelected ? "surfaces.surfaceSelected" : "transparent",
                      "&:hover": { bgcolor: "surfaces.surfaceHover" },
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                      {conversation.type === "channel" ? (
                        <Typography
                          variant="body2"
                          sx={{ color: isSelected ? "primary.main" : "text.disabled", fontWeight: 700 }}
                        >
                          #
                        </Typography>
                      ) : (
                        <Avatar src={conversation.avatar} sx={{ width: 28, height: 28 }} />
                      )}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: isSelected ? 700 : 500 }}
                        noWrap
                      >
                        {conversation.name}
                      </Typography>
                    </Stack>
                    <SidebarTrailingSlot
                      hovered={isHovered}
                      count={unread}
                      tooltip={
                        conversation.isSelfSpace
                          ? "More personal options"
                          : conversation.type === "channel"
                            ? "More channel options"
                            : "More chat options"
                      }
                      onOpenMenu={(event) =>
                        onOpenSidebarMenu(event, {
                          kind: conversation.isSelfSpace
                            ? "personal"
                            : conversation.type === "channel"
                              ? "channel"
                              : "user",
                          id: conversation.id,
                          label: conversation.name,
                          sectionId: "favorites",
                        })
                      }
                    />
                  </Stack>
                );
              })}
            </Stack>
          </SidebarAccordionSection>

          <SidebarAccordionSection
            sectionId="chats"
            title="Chats"
            open={chatsOpen}
            onToggle={() => setChatsOpen((prev) => !prev)}
            hoveredSectionId={hoveredSectionId}
            onHoverSection={setHoveredSectionId}
            menuTooltip="More section options"
            onOpenMenu={(event) =>
              onOpenSidebarMenu(event, { kind: "section", id: "chats", label: "Chats", sectionId: "chats" })
            }
          >
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
                    sx={{
                      px: 1.5,
                      py: 0.8,
                      borderRadius: (theme) => theme.tokens.radius.sm,
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      bgcolor: isSelected ? "surfaces.surfaceSelected" : "transparent",
                      "&:hover": { bgcolor: "surfaces.surfaceHover" },
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                      <Avatar src={conversation.avatar} sx={{ width: 28, height: 28 }} />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: unread > 0 ? 700 : 500 }}
                        noWrap
                      >
                        {conversation.name}
                      </Typography>
                    </Stack>
                    <SidebarTrailingSlot
                      hovered={isHovered}
                      count={unread}
                      tooltip="More chat options"
                      onOpenMenu={(event) =>
                        onOpenSidebarMenu(event, {
                          kind: "user",
                          id: conversation.id,
                          label: conversation.name,
                          sectionId: "chats",
                        })
                      }
                    />
                  </Stack>
                );
              })}
            </Stack>
          </SidebarAccordionSection>

          <SidebarAccordionSection
            sectionId="teams"
            title="Teams & Channels"
            open={teamsOpen}
            onToggle={() => setTeamsOpen((prev) => !prev)}
            hoveredSectionId={hoveredSectionId}
            onHoverSection={setHoveredSectionId}
            menuTooltip="More section options"
            onOpenMenu={(event) =>
              onOpenSidebarMenu(event, { kind: "section", id: "teams", label: "Teams & Channels", sectionId: "teams" })
            }
          >
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
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ alignItems: "center", minWidth: 0, cursor: "pointer" }}
                        onClick={() => onToggleTeam(team.id)}
                      >
                        {team.isExpanded ? (
                          <ExpandMoreRounded sx={{ fontSize: 18 }} />
                        ) : (
                          <ChevronRightRounded sx={{ fontSize: 18 }} />
                        )}
                        <TeamIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                          {team.label}
                        </Typography>
                      </Stack>
                      <Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Tooltip title="More team options">
                          <IconButton
                            size="small"
                            onClick={(event) =>
                              onOpenSidebarMenu(event, {
                                kind: "team",
                                id: team.id,
                                label: team.label,
                                sectionId: "teams",
                              })
                            }
                            sx={{
                              ...sidebarMenuButtonSx,
                              opacity: teamHovered ? 1 : 0,
                              pointerEvents: teamHovered ? "auto" : "none",
                              transition: (theme) => theme.transitions.create("opacity", { duration: 120 }),
                            }}
                          >
                            <MoreHorizRounded sx={{ fontSize: 17, color: "text.disabled" }} />
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
                              onMouseLeave={() =>
                                setHoveredRowId((previous) => (previous === channelRowId ? null : previous))
                              }
                              sx={{ alignItems: "center", justifyContent: "space-between" }}
                            >
                              <Typography
                                onClick={() => onSelectConversation(channel.id)}
                                variant="body2"
                                sx={{
                                  py: 0.45,
                                  px: 0.6,
                                  borderRadius: (theme) => theme.tokens.radius.sm,
                                  color: isSelected ? "primary.main" : "text.secondary",
                                  fontWeight: isSelected ? 700 : 500,
                                  cursor: "pointer",
                                  "&:hover": { bgcolor: "surfaces.surfaceHover" },
                                }}
                              >
                                {channel.isPrivate ? "lock " : "# "}
                                {channel.slug}
                              </Typography>
                              <Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0 }}>
                                <Tooltip title="More channel options">
                                  <IconButton
                                    size="small"
                                    onClick={(event) =>
                                      onOpenSidebarMenu(event, {
                                        kind: "channel",
                                        id: channel.id,
                                        label: channel.name,
                                        parentId: team.id,
                                        sectionId: "teams",
                                      })
                                    }
                                    sx={{
                                      ...sidebarMenuButtonSx,
                                      opacity: channelHovered ? 1 : 0,
                                      pointerEvents: channelHovered ? "auto" : "none",
                                      transition: (theme) => theme.transitions.create("opacity", { duration: 120 }),
                                    }}
                                  >
                                    <MoreHorizRounded sx={{ fontSize: 17, color: "text.disabled" }} />
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
          </SidebarAccordionSection>
        </Stack>
      </Box>
    </Box>
  );
}
