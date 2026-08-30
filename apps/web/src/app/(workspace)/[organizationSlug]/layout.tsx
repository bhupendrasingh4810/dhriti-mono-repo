import type { ReactNode } from "react";
import OrganizationWorkspaceLayoutClient from "./organization-workspace-layout-client";

export default async function OrganizationWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  return <OrganizationWorkspaceLayoutClient organizationSlug={organizationSlug}>{children}</OrganizationWorkspaceLayoutClient>;
}
