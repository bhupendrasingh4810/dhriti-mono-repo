import type { ReactNode } from "react";

import { ControlLayout } from "../control-layout";

export default function PlatformControlLayout({ children }: { children: ReactNode }) {
  return <ControlLayout mode="platform">{children}</ControlLayout>;
}
