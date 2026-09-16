import type { ReactNode } from "react";

import { ControlLayout } from "../control-layout";

export default function OrganizationControlLayout({ children }: { children: ReactNode }) {
  return <ControlLayout mode="organization">{children}</ControlLayout>;
}