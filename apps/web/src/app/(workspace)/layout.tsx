"use client";

import { type ReactNode } from "react";
import { useParams, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/workspace/sidebar";
import Header from "@/components/layout/workspace/header";
import { ConnectSearchProvider } from "@/contexts/connect-search-context";
import { useAuth } from "@/hooks/use-auth";
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
  const { user } = useAuth();

  const pathname = usePathname();
  const activeApp = getActiveApp(pathname);
  return (
    <ConnectSearchProvider organizationId={user?.organization?.id ?? ""}>
      <main className="flex h-screen flex-col bg-background">
        <div className="w-full shrink-0">
          <Header activeView={activeApp} />
        </div>

        <div className="flex min-h-0 flex-1">
          <Sidebar activeView={activeApp} organizationSlug={organizationSlug as string} />
          <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </main>
    </ConnectSearchProvider>
  );
}
