"use client";

import FlowSidebar from "@/components/flow/flow-sidebar";
import type { FlowNavView } from "@/types/flow.types";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

export interface FlowProjectNavigationItem {
  key: string;
  name: string;
  color: string;
  initials: string;
}

interface FlowLayoutProps {
  children: ReactNode;
}

function getFlowPath(pathname: string) {
  const flowIndex = pathname.indexOf("/flow");

  return flowIndex === -1 ? pathname : pathname.slice(0, flowIndex + "/flow".length);
}

function getNavView(pathname: string, flowPath: string): FlowNavView {
  if (pathname.startsWith(`${flowPath}/my-work`)) return "my-work";
  if (pathname.startsWith(`${flowPath}/issues`)) return "filters";
  if (pathname.startsWith(`${flowPath}/projects`)) return "projects";

  return "dashboard";
}

function getSelectedProject(pathname: string, flowPath: string) {
  const projectPath = `${flowPath}/projects/`;

  if (!pathname.startsWith(projectPath)) return null;

  return pathname.slice(projectPath.length).split("/", 1)[0] ?? null;
}

export function FlowLayout({ children }: FlowLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const flowPath = getFlowPath(pathname);
  const navView = getNavView(pathname, flowPath);
  const selectedProject = getSelectedProject(pathname, flowPath);

  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-50 p-4"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <aside
        className="flex h-full flex-col border-r border-slate-100 bg-white select-none rounded-2xl"
        style={{ width: collapsed ? 0 : 250, overflow: collapsed ? "hidden" : "visible", transition: "width 0.2s" }}
      >
        <FlowSidebar
          navView={navView}
          onNav={() => { }}
          selectedSpace={selectedProject}
          onSpace={() => { }}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>
      <div className="-mr-4 flex min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
