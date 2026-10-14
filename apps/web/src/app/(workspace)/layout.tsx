"use client";

import { type ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import { Box } from "@dhriti/ui";
import { ConnectHeader } from "@/features/connect/components/ConnectHeader";
import Sidebar from "@/components/layout/workspace/sidebar";
import Header from "@/components/layout/workspace/header";
import { connectSearchResults, connectUsers } from "@/mocks/connect";
import { PageName, PageType } from "@/types/app.types";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ organizationSlug: string }>;
}

function getActiveApp(pathname: string): PageType {
  if (pathname.includes("/connect")) return "connect";
  if (pathname.includes("/flow")) return "flow";
  if (pathname.includes("/atlas")) return "atlas";
  if (pathname.includes("/pulse")) return "pulse";
  if (pathname.includes("/nexus")) return "nexus";
  return "home";
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { organizationSlug } = useParams();

  const pathname = usePathname();
  const activeApp = getActiveApp(pathname);
  const headerAppName =
    activeApp === "home"
      ? PageName.Home
      : activeApp === "connect"
        ? PageName.Connect
        : activeApp === "flow"
          ? PageName.Flow
          : activeApp === "atlas"
            ? PageName.Atlas
            : activeApp === "pulse"
              ? PageName.Pulse
              : PageName.Nexus;

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
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ width: "100%", flexShrink: 0 }}>
        {activeApp === "connect" ? (
          <ConnectHeader users={headerSearchUsers} messages={headerSearchMessages} files={headerSearchFiles} />
        ) : (
          <Header activeView={activeApp} onViewChange={() => {}} />
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Sidebar
          activeView={activeApp}
          organizationSlug={organizationSlug as string}
          onViewChange={() => {}}
          onLogout={() => {}}
        />
        <Box sx={{ flex: 1, minWidth: 0, overflowY: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}
