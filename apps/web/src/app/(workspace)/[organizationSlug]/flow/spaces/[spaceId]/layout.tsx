import type { ReactNode } from "react";
import { SpaceLayout } from "../space-layout";

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ spaceId: string }>;
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { spaceId } = await params;

  return <SpaceLayout pk={spaceId}>{children}</SpaceLayout>;
}
