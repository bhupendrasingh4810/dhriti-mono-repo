"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useIsDesktop, useOptionalMobileNav } from "@/contexts/mobile-nav-context";

/**
 * Wrap a page sidebar (an `<aside>` element) with this component.
 * - Desktop (>= lg): renders the sidebar inline, unchanged.
 * - Tablet/mobile: the sidebar is moved into the slide-in drawer opened by the header menu icon,
 *   and registers itself so the header knows a menu is available.
 */
export function PageSidebar({ children }: { children: ReactNode }) {
  const nav = useOptionalMobileNav();
  const isDesktop = useIsDesktop();
  const registerSidebar = nav?.registerSidebar;
  const inDrawer = Boolean(nav) && !isDesktop;

  useEffect(() => {
    if (!inDrawer || !registerSidebar) return;
    return registerSidebar();
  }, [inDrawer, registerSidebar]);

  if (!inDrawer) return <>{children}</>;
  return nav?.drawerEl ? createPortal(children, nav.drawerEl) : null;
}
