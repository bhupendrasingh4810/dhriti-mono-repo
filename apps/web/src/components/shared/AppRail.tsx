"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { GamepadRounded, AutoAwesomeRounded, CalendarMonthRounded, ChatBubbleRounded, ChevronLeftRounded, ChevronRightRounded, HomeRounded, MenuBookRounded, SyncRounded } from "@mui/icons-material";

export type AppRailItem = {
  label: string;
  href: string;
  icon: ElementType;
  active?: boolean;
  iconColor?: string;
};

type AppRailProps = {
  items?: AppRailItem[];
  organizationSlug?: string;
  activeApp?: "home" | "connect" | "flow" | "atlas" | "pulse" | "nexus" | "control";
  linkComponent?: ElementType;
  collapseLabel?: string;
};

export function AppRail({
  items,
  organizationSlug = "acme",
  activeApp,
  linkComponent,
  collapseLabel = "Collapse",
}: AppRailProps) {
  const resolvedItems = useMemo(() => {
    if (items && items.length > 0) {
      return items;
    }

    return [
      { label: "Home", icon: HomeRounded, href: `/${organizationSlug}/home`, active: activeApp === "home" },
      { label: "Connect", icon: ChatBubbleRounded, href: `/${organizationSlug}/connect`, active: activeApp === "connect" },
      { label: "Flow", icon: SyncRounded, href: `/${organizationSlug}/flow`, active: activeApp === "flow" },
      { label: "Atlas", icon: MenuBookRounded, href: `/${organizationSlug}/atlas`, active: activeApp === "atlas" },
      { label: "Pulse", icon: CalendarMonthRounded, href: `/${organizationSlug}/pulse`, active: activeApp === "pulse" },
      { label: "Nexus", icon: AutoAwesomeRounded, href: `/${organizationSlug}/nexus`, active: activeApp === "nexus", iconColor: "#3b82f6" },
      { label: "Control", icon: GamepadRounded, href: `/${organizationSlug}/control`, active: activeApp === "control" },
    ] satisfies AppRailItem[];
  }, [activeApp, items, organizationSlug]);

  const initialActiveLabel = useMemo(() => {
    const activeItem = resolvedItems.find((item) => item.active);
    return activeItem?.label ?? resolvedItems[0]?.label ?? "";
  }, [resolvedItems]);

  const [selectedLabel, setSelectedLabel] = useState(initialActiveLabel);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setSelectedLabel(initialActiveLabel);
  }, [initialActiveLabel]);

  return (
    <Box sx={{ width: collapsed ? 56 : 80, px: 1, py: 1.5, bgcolor: "#fff", borderRight: "1px solid #f3f4f6", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto", transition: "width 160ms ease" }}>
      <Stack spacing={1}>
        {resolvedItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedLabel === item.label;

          return (
            <Box
              key={item.label}
              component={linkComponent ?? "a"}
              href={item.href}
              sx={{ textDecoration: "none" }}
              onClick={() => setSelectedLabel(item.label)}
            >
              <Stack spacing={0.5} sx={{ p: 1, borderRadius: 2.5, alignItems: "center", color: isActive ? "#a16207" : "#9ca3af", bgcolor: isActive ? "#fffcf0" : "transparent", '&:hover': { bgcolor: isActive ? "#fffcf0" : "#f9fafb" } }}>
                <Box
                  sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: isActive ? "rgba(252,207,20,0.1)" : "#f9fafb", color: item.iconColor ?? "inherit" }}
                >
                  <Icon sx={{ fontSize: 16 }} />
                </Box>
                {!collapsed && <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{item.label}</Typography>}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ mt: "auto", pt: 1.5, borderTop: "1px solid #f9fafb" }}>
        <Stack spacing={0.5} sx={{ p: 1, borderRadius: 2.5, alignItems: "center", color: "#9ca3af", cursor: "pointer", '&:hover': { bgcolor: "#f9fafb" } }} onClick={() => setCollapsed((prev) => !prev)}>
          {collapsed ? <ChevronRightRounded sx={{ fontSize: 14 }} /> : <ChevronLeftRounded sx={{ fontSize: 14 }} />}
          {!collapsed && <Typography sx={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{collapseLabel}</Typography>}
        </Stack>
      </Box>
    </Box>
  );
}
