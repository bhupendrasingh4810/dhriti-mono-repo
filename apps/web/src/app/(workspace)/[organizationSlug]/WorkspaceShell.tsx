"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { AppRail, ConnectWorkspaceHeader, WorkspaceAppsHeader } from "@dhriti/ui";
import { connectSearchResults, connectUsers } from "@/mocks/connect";

type WorkspaceShellProps = {
  organizationSlug: string;
  children: ReactNode;
};

function getActiveApp(pathname: string): "home" | "connect" | "flow" | "atlas" | "pulse" | "nexus" {
  if (pathname.includes("/connect")) return "connect";
  if (pathname.includes("/flow")) return "flow";
  if (pathname.includes("/atlas")) return "atlas";
  if (pathname.includes("/pulse")) return "pulse";
  if (pathname.includes("/nexus")) return "nexus";
  return "home";
}

export function WorkspaceShell({ organizationSlug, children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const activeApp = getActiveApp(pathname);
  const headerAppName = activeApp === "home"
    ? "Home"
    : activeApp === "connect"
      ? "Connect"
      : activeApp === "flow"
        ? "Flow"
        : activeApp === "atlas"
          ? "Atlas"
          : activeApp === "pulse"
            ? "Pulse"
            : "Nexus";

  const headerSearchUsers = connectUsers.map((user) => ({
    id: user.id,
    title: user.displayName,
    description: user.jobTitle,
  }));
  const headerSearchMessages = connectSearchResults
    .filter((item) => item.type === "message")
    .map((item) => ({ id: item.id, title: item.title, description: item.description }));
  const headerSearchFiles = connectSearchResults
    .filter((item) => item.type === "file")
    .map((item) => ({ id: item.id, title: item.title, description: item.description }));

  return (
    <Box className="h-screen flex flex-col bg-[#f9fafb]">
      <Box sx={{ width: "100%", flexShrink: 0 }}>
        {activeApp === "connect" ? (
          <ConnectWorkspaceHeader users={headerSearchUsers} messages={headerSearchMessages} files={headerSearchFiles} />
        ) : (
          <WorkspaceAppsHeader appName={headerAppName} />
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        <AppRail organizationSlug={organizationSlug} activeApp={activeApp} linkComponent={Link} />
        <Box sx={{ flex: 1, minWidth: 0, overflowY: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}
