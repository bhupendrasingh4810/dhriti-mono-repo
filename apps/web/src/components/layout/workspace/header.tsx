import type { AppView } from "@/types/app.types";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
  ChevronDown,
  CircleHelp,
  Clock,
  LayoutGrid,
  LogOut,
  Menu,
  Map,
  MessageSquare,
  NotebookPen,
  PanelsTopLeft,
  Settings,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConnectHeaderSearch } from "@/features/connect/components/ConnectHeaderSearch";
import { ConnectPresenceIndicator } from "@/features/connect/components/ConnectPresenceIndicator";
import { useConnectPresence } from "@/contexts/connect-presence-context";
import { useConnectSearch } from "@/contexts/connect-search-context";
import { useAuth } from "@/hooks/use-auth";
import { useMobileNav } from "@/contexts/mobile-nav-context";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import { useSettingsAccess } from "@/features/settings/use-app-settings";
import { NotificationBell } from "@/features/notifications/NotificationBell";

interface Props {
  activeView: AppView;
}

export default function Header({ activeView }: Props) {
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, logout } = useAuth();
  const { setAppsOpen, setMenuOpen, sidebarCount } = useMobileNav();
  const settingsAccess = useSettingsAccess();
  const { presence } = useConnectPresence();
  const { recentUsers, recentUsersError, selectUser } = useConnectSearch();
  const userName = user?.name ?? "User";
  const userEmail = user?.email ?? "user@dhriti.app";
  const userInitials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const organizationPath = user?.organization?.slug ?? user?.organization?.id ?? "";
  const canManageSettings = settingsAccess.canManage === true;
  const canAccessDhritiSettings =
    user?.isPlatformUser || user?.role === "PLATFORM_OWNER" || user?.role === "PLATFORM_ADMIN";
  const canAccessOrganizationSettings = user?.role === "ORG_OWNER" || user?.role === "ORG_ADMIN";
  const canOpenSettings = canManageSettings || canAccessDhritiSettings || canAccessOrganizationSettings;

  function clearMenuCloseTimer() {
    if (!menuCloseTimer.current) return;
    clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = null;
  }

  function closeMenus() {
    clearMenuCloseTimer();
    setSettingsAnchor(null);
    setUserAnchor(null);
  }

  function scheduleMenuClose() {
    clearMenuCloseTimer();
    menuCloseTimer.current = setTimeout(closeMenus, 150);
  }

  useEffect(() => () => clearMenuCloseTimer(), []);

  const settingsItems: ConnectCascadingMenuItem[] = [
    {
      id: "atlas-settings",
      label: "Atlas Settings",
      icon: <Map aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/atlas/settings`,
    },
    {
      id: "cadence-settings",
      label: "Cadence Settings",
      icon: <Clock aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/cadence/settings`,
    },
    {
      id: "connect-settings",
      label: "Connect Settings",
      icon: <MessageSquare aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/connect/settings`,
    },
    ...(canAccessDhritiSettings
      ? [
          {
            id: "dhriti-settings",
            label: "Dhriti Settings",
            icon: <Settings aria-hidden="true" size={16} strokeWidth={1.75} />,
            href: `/${organizationPath}/control/platform/settings`,
          },
        ]
      : []),
    {
      id: "flow-settings",
      label: "Flow Settings",
      icon: <Settings aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/flow/settings`,
    },
    {
      id: "hrms-settings",
      label: "HRMS Settings",
      icon: <Users aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/hrms/settings`,
    },
    {
      id: "nexus-settings",
      label: "Nexus Settings",
      icon: <Sparkles aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/nexus/settings`,
    },
    {
      id: "notes-settings",
      label: "Notes Settings",
      icon: <NotebookPen aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/notes/settings`,
    },
    ...(canAccessOrganizationSettings
      ? [
          {
            id: "organization-settings",
            label: "Organization Settings",
            icon: <Settings aria-hidden="true" size={16} strokeWidth={1.75} />,
            href: `/${organizationPath}/control/org/settings`,
          },
        ]
      : []),
    {
      id: "pulse-settings",
      label: "Pulse Settings",
      icon: <Activity aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/pulse/settings`,
    },
  ];

  const userItems: ConnectCascadingMenuItem[] = [
    {
      id: "user-card",
      label: userName,
      description: userEmail,
      descriptionLayout: "stacked",
      icon: (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-xs font-bold text-text-inverse">
          {user?.avatarUrl ? (
            // Uploaded avatars may be data URLs and do not need image optimization.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            userInitials
          )}
        </span>
      ),
      closeOnClick: false,
    },
    {
      id: "profile",
      label: "Profile",
      icon: <UserRound aria-hidden="true" size={16} strokeWidth={1.75} />,
      dividerAbove: true,
      href: `/${organizationPath}/user/profile`,
    },
    {
      id: "general-settings",
      label: "General Settings",
      icon: <Settings aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/user/settings/general`,
    },
    {
      id: "notification-settings",
      label: "Notification Settings",
      icon: <Bell aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/user/settings/notification`,
    },
    {
      id: "logout",
      label: "Logout",
      icon: <LogOut aria-hidden="true" size={16} strokeWidth={1.75} />,
      dividerAbove: true,
      danger: true,
      onClick: () => void logout(),
    },
  ];

  return (
    <header
      className="flex w-full min-w-0 items-center gap-2 px-3 lg:gap-4 lg:px-6 border-b border-slate-100 flex-shrink-0 bg-white relative z-10"
      style={{ height: "60px" }}
    >
      {/* Brand name */}
      <span className="text-lg font-bold text-slate-900 lg:mr-2" style={{ fontFamily: "var(--font-display)" }}>
        <div className="flex items-center justify-center py-4 border-b border-slate-100" style={{ height: "60px" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
            <PanelsTopLeft aria-hidden="true" size={18} strokeWidth={2} className="text-white" />
          </div>
        </div>
      </span>

      {/* Tablet/mobile: apps dialog and page menu replace the fixed sidebars */}
      <div className="flex items-center gap-1 lg:hidden">
        {sidebarCount > 0 && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <Menu aria-hidden="true" size={20} strokeWidth={1.75} />
          </button>
        )}
        <button
          type="button"
          aria-label="Open apps"
          onClick={() => setAppsOpen(true)}
          className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        >
          <LayoutGrid aria-hidden="true" size={20} strokeWidth={1.75} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1"></nav>

      {activeView === "connect" && user?.organization?.id && (
        <div className="absolute left-1/2 z-10 w-full max-w-[680px] -translate-x-1/2 px-4">
          <ConnectHeaderSearch
            organizationId={user.organization.id}
            recentUsers={recentUsers}
            recentUsersError={recentUsersError}
            onSelectUser={selectUser}
          />
        </div>
      )}

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {settingsAccess.loading ? (
          <span role="status" className="text-xs text-text-secondary">
            Checking settings access…
          </span>
        ) : settingsAccess.error ? (
          <div className="flex items-center gap-1">
            <span role="alert" className="text-xs text-error">
              Settings access unavailable
            </span>
            <button type="button" className="text-xs text-brand underline" onClick={settingsAccess.retry}>
              Retry
            </button>
          </div>
        ) : null}
        <NotificationBell />
        <button className="w-9 h-9 cursor-pointer rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <CircleHelp size={20} strokeWidth={1.75} />
        </button>
        {canOpenSettings ? (
          <button
            type="button"
            onMouseEnter={(event) => {
              clearMenuCloseTimer();
              setSettingsAnchor(event.currentTarget);
              setUserAnchor(null);
            }}
            onMouseLeave={scheduleMenuClose}
            onClick={(event) => {
              setSettingsAnchor((anchor) => (anchor === event.currentTarget ? null : event.currentTarget));
              setUserAnchor(null);
            }}
            aria-label="Open settings"
            aria-haspopup="menu"
            aria-expanded={Boolean(settingsAnchor)}
            className="flex h-9 w-9 items-center justify-center rounded-lg cursor-pointer text-slate-500 transition-all hover:bg-slate-50"
          >
            <Settings size={20} strokeWidth={1.75} />
          </button>
        ) : null}
        <button
          type="button"
          onMouseEnter={(event) => {
            clearMenuCloseTimer();
            setUserAnchor(event.currentTarget);
            setSettingsAnchor(null);
          }}
          onMouseLeave={scheduleMenuClose}
          onClick={(event) => {
            setUserAnchor((anchor) => (anchor === event.currentTarget ? null : event.currentTarget));
            setSettingsAnchor(null);
          }}
          aria-label="Open user menu"
          aria-haspopup="menu"
          aria-expanded={Boolean(userAnchor)}
          className="ml-1 flex cursor-pointer items-center gap-2 rounded-lg p-1 transition-all hover:bg-slate-50"
        >
          <div className="relative w-8 h-8 rounded-full bg-brand flex items-center justify-center">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-text-inverse text-xs font-bold">{userInitials}</span>
            )}
            {user ? <ConnectPresenceIndicator presence={presence} /> : null}
          </div>
          <ChevronDown
            size={12}
            strokeWidth={2.5}
            className={`text-slate-400 transition-transform ${userAnchor ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {canOpenSettings ? (
        <ConnectCascadingMenu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={closeMenus}
          items={settingsItems}
          minWidth={240}
          onMouseEnter={clearMenuCloseTimer}
          onMouseLeave={scheduleMenuClose}
        />
      ) : null}
      <ConnectCascadingMenu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={closeMenus}
        items={userItems}
        minWidth={192}
        openToLeft
        onMouseEnter={clearMenuCloseTimer}
        onMouseLeave={scheduleMenuClose}
      />
    </header>
  );
}
