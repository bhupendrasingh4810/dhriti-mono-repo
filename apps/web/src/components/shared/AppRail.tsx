"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import { Box, Stack, Typography } from "@dhriti/ui";
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
      { label: "Nexus", icon: AutoAwesomeRounded, href: `/${organizationSlug}/nexus`, active: activeApp === "nexus", iconColor: "info.main" },
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
    <Box sx={{ width: collapsed ? 56 : 80, px: 1, py: 1.5, bgcolor: "surfaces.surface", borderRight: 1, borderColor: "borders.borderSubtle", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto", transition: (theme) => theme.transitions.create("width", { duration: 160 }) }}>
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
              <Stack spacing={0.5} sx={{ p: 1, borderRadius: (theme) => theme.tokens.radius.md, alignItems: "center", color: isActive ? "primary.dark" : "text.secondary" }}>
                <Box
                  sx={{ width: 40, height: 40, borderRadius: (theme) => theme.tokens.radius.md, display: "grid", placeItems: "center", bgcolor: isActive ? "surfaces.surfaceSelected" : "surfaces.surfaceHover", color: item.iconColor ?? "inherit" }}
                >
                  <Icon sx={{ fontSize: 16 }} />
                </Box>
                {!collapsed && <Typography variant="overline">{item.label}</Typography>}
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ mt: "auto", pt: 1.5, borderTop: 1, borderColor: "borders.borderSubtle" }}>
        <Stack spacing={0.5} sx={{ p: 1, borderRadius: (theme) => theme.tokens.radius.md, alignItems: "center", color: "text.secondary", cursor: "pointer", '&:hover': { bgcolor: "surfaces.surfaceHover" } }} onClick={() => setCollapsed((prev) => !prev)}>
          {collapsed ? <ChevronRightRounded sx={{ fontSize: 14 }} /> : <ChevronLeftRounded sx={{ fontSize: 14 }} />}
          {!collapsed && <Typography variant="overline">{collapseLabel}</Typography>}
        </Stack>
      </Box>
    </Box>
  );
}
