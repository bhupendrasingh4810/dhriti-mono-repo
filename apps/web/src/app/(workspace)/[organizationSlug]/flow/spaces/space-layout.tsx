"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AvStack } from "@/components/flow/flow.atoms";
import { gp } from "@/components/flow/flow.data";
import { CreateIssueDialog } from "@/components/flow/dialogs/CreateIssueDialog";
import type { ProjectTab } from "@/types/flow.types";

interface SpaceLayoutProps {
  pk: string;
  initTab?: ProjectTab;
  renderTab?: (tab: ProjectTab) => ReactNode;
  children?: ReactNode;
}

const PROJECT_TABS: { id: ProjectTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "issue-list", label: "Work Items" },
  { id: "backlog", label: "Backlog" },
  { id: "board", label: "Board" },
  { id: "sprints", label: "Sprints" },
  { id: "roadmap", label: "Roadmap" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

export function SpaceLayout({ pk, initTab = "overview", renderTab, children }: SpaceLayoutProps) {
  const [tab, setTab] = useState<ProjectTab>(initTab);
  const [showCreate, setShowCreate] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const project = gp(pk);

  const isRouteLayout = children !== undefined;
  const projectPath = pathname.slice(0, pathname.indexOf("/flow/spaces/") + "/flow/spaces/".length + pk.length);
  const tabPath: Partial<Record<ProjectTab, string>> = {
    overview: "overview",
    "issue-list": "list",
    backlog: "backlog",
    board: "board",
    sprints: "sprints",
    roadmap: "roadmap",
    reports: "reports",
    settings: "settings",
  };

  const handleTabChange = (nextTab: ProjectTab) => {
    setTab(nextTab);

    const path = tabPath[nextTab];
    if (isRouteLayout && path) {
      router.push(`${projectPath}/${path}`);
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-slate-100 bg-white px-5 py-3 mx-4 rounded-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black text-white"
              style={{ backgroundColor: project.color }}
            >
              {project.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                  {project.name}
                </h1>
                <button
                  type="button"
                  aria-label={project.starred ? "Remove from favorites" : "Add to favorites"}
                  className="text-xl text-slate-300 hover:text-amber-400"
                >
                  {project.starred ? "★" : "☆"}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                {project.key} · {project.owner} · {project.members.length} members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AvStack ids={project.members} size={24} />
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "#036c5f" }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Issue
            </button>
          </div>
        </div>
        <div className="flex items-center">
          {PROJECT_TABS.map((projectTab) => (
            <Link
              key={projectTab.id}
              href={`${projectPath}/${tabPath[projectTab.id] ?? ""}`}
              onClick={() => handleTabChange(projectTab.id)}
              className="whitespace-nowrap border-b-2 px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                borderColor: tab === projectTab.id ? "#036c5f" : "transparent",
                color: tab === projectTab.id ? "#036c5f" : "#64748b",
              }}
            >
              {projectTab.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children ?? renderTab?.(tab)}</div>
      {showCreate && <CreateIssueDialog onClose={() => setShowCreate(false)} projectKey={pk} />}
    </div>
  );
}
