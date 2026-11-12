"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/** Viewports below this width (tablet and mobile) use header icons + drawers instead of fixed sidebars. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

/** Server snapshot assumes desktop so SSR markup matches the inline sidebars. */
export function useIsDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(DESKTOP_QUERY);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}

interface MobileNavValue {
  appsOpen: boolean;
  menuOpen: boolean;
  setAppsOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  /** Number of page sidebars currently registered; the header shows the menu icon only when > 0. */
  sidebarCount: number;
  registerSidebar: () => () => void;
  drawerEl: HTMLElement | null;
  setDrawerEl: (element: HTMLElement | null) => void;
}

const MobileNavContext = createContext<MobileNavValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Open state is remembered with the pathname it was opened on, so navigating closes both overlays
  // without a state-setting effect.
  const [appsPath, setAppsPath] = useState<string | null>(null);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [sidebarCount, setSidebarCount] = useState(0);
  const [drawerEl, setDrawerEl] = useState<HTMLElement | null>(null);

  const setAppsOpen = useCallback((open: boolean) => setAppsPath(open ? pathname : null), [pathname]);
  const setMenuOpen = useCallback((open: boolean) => setMenuPath(open ? pathname : null), [pathname]);
  const registerSidebar = useCallback(() => {
    setSidebarCount((count) => count + 1);
    return () => setSidebarCount((count) => count - 1);
  }, []);

  const value = useMemo<MobileNavValue>(
    () => ({
      appsOpen: appsPath === pathname,
      menuOpen: menuPath === pathname,
      setAppsOpen,
      setMenuOpen,
      sidebarCount,
      registerSidebar,
      drawerEl,
      setDrawerEl,
    }),
    [appsPath, menuPath, pathname, setAppsOpen, setMenuOpen, sidebarCount, registerSidebar, drawerEl],
  );

  return <MobileNavContext.Provider value={value}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const value = useContext(MobileNavContext);
  if (!value) throw new Error("useMobileNav must be used within MobileNavProvider");
  return value;
}

/** Null outside the workspace layout so shared sidebars still render inline there. */
export function useOptionalMobileNav() {
  return useContext(MobileNavContext);
}
