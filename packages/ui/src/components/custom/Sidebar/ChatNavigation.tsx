"use client";

import { useState } from "react";
import type { ElementType } from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import PushPinRounded from "@mui/icons-material/PushPinRounded";

export type ChatNavigationStat = {
  icon: ElementType;
  label: string;
  count: number;
};

export type ChatNavigationChat = {
  name: string;
  avatar?: string;
  unreadCount?: number;
};

export type ChatNavigationCollapsedGroup = {
  label: string;
  icon: ElementType;
};

type ChatNavigationProps = {
  quickStats: ChatNavigationStat[];
  favourites: string[];
  activeFavourite?: string;
  chats: ChatNavigationChat[];
  expandedTeam: {
    name: string;
    channels: string[];
  };
  collapsedGroups: ChatNavigationCollapsedGroup[];
};

export function ChatNavigation({
  quickStats,
  favourites,
  activeFavourite,
  chats,
  expandedTeam,
  collapsedGroups,
}: ChatNavigationProps) {
  const [favouritesOpen, setFavouritesOpen] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(true);
  const [teamsOpen, setTeamsOpen] = useState(true);

  return (
    <Box sx={{ p: 1.5, overflowY: "auto" }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          {quickStats.map((row) => {
            const Icon = row.icon;

            return (
              <Stack key={row.label} direction="row" sx={{ px: 1.5, py: 1, borderRadius: 2, alignItems: "center", justifyContent: "space-between", '&:hover': { bgcolor: "#f9fafb" } }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", color: "#4b5563" }}>
                  <Icon sx={{ fontSize: 16, color: "#9ca3af" }} />
                  <Typography sx={{ fontSize: 14, fontWeight: row.count ? 700 : 400 }}>{row.label}</Typography>
                </Stack>
                <Box sx={{ px: 0.75, py: 0.2, borderRadius: 1, bgcolor: "#fffcf0", color: "#a16207", fontSize: 10, fontWeight: 700 }}>
                  {row.count}
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Box>
          <Stack direction="row" sx={{ px: 1.5, mb: 1, justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setFavouritesOpen((prev) => !prev)}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Favourites
            </Typography>
            <ExpandMoreRounded sx={{ fontSize: 12, color: "#9ca3af", transform: favouritesOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 140ms ease" }} />
          </Stack>
          {favouritesOpen && (
            <Stack spacing={0.25}>
              {favourites.map((channel) => {
                const isActive = activeFavourite === channel;

                return (
                  <Stack key={channel} direction="row" sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, alignItems: "center", justifyContent: "space-between", bgcolor: isActive ? "#f9fafb" : "transparent", fontWeight: isActive ? 700 : 500 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontSize: 12, color: isActive ? "#60a5fa" : "#818cf8", fontWeight: 700 }}>#</Typography>
                      <Typography sx={{ fontSize: 14, color: "#4b5563" }}>{channel}</Typography>
                    </Stack>
                    <PushPinRounded sx={{ fontSize: 11, color: isActive ? "#9ca3af" : "#d1d5db" }} />
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>

        <Box>
          <Stack direction="row" sx={{ px: 1.5, mb: 1, justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setChatsOpen((prev) => !prev)}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Chats
            </Typography>
            <ExpandMoreRounded sx={{ fontSize: 12, color: "#9ca3af", transform: chatsOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 140ms ease" }} />
          </Stack>
          {chatsOpen && (
            <Stack spacing={0.25}>
              {chats.map((chat) => {
                const hasAvatar = Boolean(chat.avatar);
                const hasCount = typeof chat.unreadCount === "number";

                return (
                  <Stack key={chat.name} direction="row" sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, alignItems: "center", justifyContent: "space-between", '&:hover': { bgcolor: "#f9fafb" } }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      {hasAvatar ? <Avatar src={chat.avatar} sx={{ width: 16, height: 16 }} /> : <PeopleRounded sx={{ fontSize: 14, color: "#d1d5db" }} />}
                      <Typography sx={{ fontSize: 14, color: "#4b5563", fontWeight: hasCount ? 700 : 400 }}>{chat.name}</Typography>
                    </Stack>
                    {hasCount && <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#a16207" }}>{chat.unreadCount}</Typography>}
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>

        <Box>
          <Stack direction="row" sx={{ px: 1.5, mb: 1, justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setTeamsOpen((prev) => !prev)}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Teams & Channels
            </Typography>
            <ExpandMoreRounded sx={{ fontSize: 12, color: "#9ca3af", transform: teamsOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 140ms ease" }} />
          </Stack>
          {teamsOpen && (
            <Stack spacing={0.5} sx={{ px: 1.5 }}>
              <Stack>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <ExpandMoreRounded sx={{ fontSize: 11 }} />
                  <ApartmentRounded sx={{ fontSize: 12, color: "#9ca3af" }} />
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{expandedTeam.name}</Typography>
                </Stack>
                <Stack sx={{ pl: 3 }}>
                  {expandedTeam.channels.map((channel) => (
                    <Typography key={channel} sx={{ py: 0.4, fontSize: 14, color: "#6b7280" }}>
                      # {channel}
                    </Typography>
                  ))}
                </Stack>
              </Stack>

              {collapsedGroups.map((group) => {
                const Icon = group.icon;

                return (
                  <Stack key={group.label} direction="row" spacing={0.5} sx={{ alignItems: "center", color: "#6b7280" }}>
                    <ChevronRightRounded sx={{ fontSize: 11 }} />
                    <Icon sx={{ fontSize: 12, color: "#9ca3af" }} />
                    <Typography sx={{ fontSize: 14 }}>{group.label}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
