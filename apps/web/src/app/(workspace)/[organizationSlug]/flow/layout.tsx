import type { ReactNode } from "react";

import { FlowLayout } from "./flow-layout";

interface FlowRouteLayoutProps {
  children: ReactNode;
}

export default function FlowRouteLayout({ children }: FlowRouteLayoutProps) {
  return <FlowLayout>{children}</FlowLayout>;
}
