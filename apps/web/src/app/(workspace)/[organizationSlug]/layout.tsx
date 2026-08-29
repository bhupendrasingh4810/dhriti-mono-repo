import type { ReactNode } from "react";
import { WorkspaceShell } from "./WorkspaceShell";

export default async function OrganizationWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  return <WorkspaceShell organizationSlug={organizationSlug}>{children}</WorkspaceShell>;
}
