"use client";

import { type ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/workspace/sidebar";
import Header from "@/components/layout/workspace/header";
import { connectSearchResults, connectUsers } from "@/mocks/connect";
import { PageType } from "@/types/app.types";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

function getActiveApp(pathname: string): PageType {
  if (pathname.includes("/connect")) return "connect";
  if (pathname.includes("/flow")) return "flow";
  if (pathname.includes("/atlas")) return "atlas";
  if (pathname.includes("/pulse")) return "pulse";
  if (pathname.includes("/nexus")) return "nexus";
  return "home";
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { organizationSlug } = useParams();

  const pathname = usePathname();
  const activeApp = getActiveApp(pathname);
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
    <main className="flex h-screen flex-col bg-background">
      <div className="w-full shrink-0">
        <Header
          activeView={activeApp}
          connectSearch={
            activeApp === "connect"
              ? { users: headerSearchUsers, messages: headerSearchMessages, files: headerSearchFiles }
              : undefined
          }
        />
      </div>

      <div className="flex min-h-0 flex-1">
        <Sidebar activeView={activeApp} organizationSlug={organizationSlug as string} />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </main>
  );
}
