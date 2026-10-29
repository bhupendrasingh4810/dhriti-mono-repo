import type { AppView } from "@/types/app.types";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
  ChevronDown,
  CircleHelp,
  Clock,
  CreditCard,
  FileText,
  Grid2X2,
  LogOut,
  Map,
  MessageSquare,
  NotebookPen,
  PanelsTopLeft,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquareCheckBig,
  UserRound,
  Users,
} from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConnectHeaderSearch } from "@/features/connect/components/ConnectHeaderSearch";
import { ConnectPresenceIndicator } from "@/features/connect/components/ConnectPresenceIndicator";
import { useConnectPresence } from "@/contexts/connect-presence-context";
import { useConnectSearch } from "@/contexts/connect-search-context";
import { useAuth } from "@/hooks/use-auth";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import { useSettingsAccess } from "@/features/settings/use-app-settings";

interface Props {
  activeView: AppView;
}

export default function Header({ activeView }: Props) {
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, logout } = useAuth();
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

  function clearMenuCloseTimer() {
    if (!menuCloseTimer.current) return;
    clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = null;
  }

  function closeMenus() {
    clearMenuCloseTimer();
    setSettingsAnchor(null);
    setNotificationAnchor(null);
    setUserAnchor(null);
  }

  function scheduleMenuClose() {
    clearMenuCloseTimer();
    menuCloseTimer.current = setTimeout(closeMenus, 150);
  }

  useEffect(() => () => clearMenuCloseTimer(), []);

  const settingsItems: ConnectCascadingMenuItem[] = [
    {
      id: "user-management",
      label: "User Management",
      icon: <Users aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Dhriti Admin Settings",
      href: `/${organizationPath}/settings/users`,
    },
    {
      id: "billing",
      label: "Billing",
      icon: <CreditCard aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/settings/billing`,
    },
    {
      id: "system-settings",
      label: "System",
      icon: <FileText aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Flow Settings",
      dividerAbove: true,
      href: `/${organizationPath}/settings/system`,
    },
    {
      id: "space-settings",
      label: "Spaces",
      icon: <Grid2X2 aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/settings/spaces`,
    },
    {
      id: "work-item-settings",
      label: "Work Items",
      icon: <SquareCheckBig aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/settings/work-items`,
    },
    {
      id: "flow-defaults",
      label: "Defaults and limits",
      icon: <SlidersHorizontal aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/flow/settings`,
    },
    {
      id: "connect-settings",
      label: "Connect Settings",
      icon: <MessageSquare aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Connect Settings",
      dividerAbove: true,
      href: `/${organizationPath}/connect/settings`,
    },
    {
      id: "pulse-settings",
      label: "Pulse Settings",
      icon: <Activity aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Pulse Settings",
      dividerAbove: true,
      href: `/${organizationPath}/pulse/settings`,
    },
    {
      id: "atlas-settings",
      label: "Atlas Settings",
      icon: <Map aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Atlas Settings",
      dividerAbove: true,
      href: `/${organizationPath}/atlas/settings`,
    },
    {
      id: "cadence-settings",
      label: "Cadence Settings",
      icon: <Clock aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Cadence Settings",
      dividerAbove: true,
      href: `/${organizationPath}/cadence/settings`,
    },
    {
      id: "hrms-settings",
      label: "HRMS Settings",
      icon: <Users aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "HRMS Settings",
      dividerAbove: true,
      href: `/${organizationPath}/hrms/settings`,
    },
    {
      id: "nexus-settings",
      label: "Nexus Settings",
      icon: <Sparkles aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Nexus Settings",
      dividerAbove: true,
      href: `/${organizationPath}/nexus/settings`,
    },
    {
      id: "notes-settings",
      label: "Notes Settings",
      icon: <NotebookPen aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Notes Settings",
      dividerAbove: true,
      href: `/${organizationPath}/notes/settings`,
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
      href: `/${organizationPath}/settings/general`,
    },
    {
      id: "notification-settings",
      label: "Notification Settings",
      icon: <Bell aria-hidden="true" size={16} strokeWidth={1.75} />,
      href: `/${organizationPath}/settings/notifications`,
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
  const notificationItems: ConnectCascadingMenuItem[] = [
    {
      id: "notifications-empty",
      label: "No new notifications",
      description: "You are all caught up.",
      descriptionLayout: "stacked",
      icon: <Bell aria-hidden="true" size={16} strokeWidth={1.75} />,
      closeOnClick: false,
    },
  ];

  return (
    <header
      className="flex items-center gap-4 px-6 border-b border-slate-100 flex-shrink-0 bg-white relative z-10"
      style={{ height: "60px" }}
    >
      {/* Brand name */}
      <span className="text-lg font-bold text-slate-900 mr-2" style={{ fontFamily: "var(--font-display)" }}>
        <div className="flex items-center justify-center py-4 border-b border-slate-100" style={{ height: "60px" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
            <PanelsTopLeft aria-hidden="true" size={18} strokeWidth={2} className="text-white" />
          </div>
        </div>
      </span>

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
        <button
          type="button"
          onMouseEnter={(event) => {
            clearMenuCloseTimer();
            setNotificationAnchor(event.currentTarget);
            setSettingsAnchor(null);
            setUserAnchor(null);
          }}
          onMouseLeave={scheduleMenuClose}
          onClick={(event) => {
            setNotificationAnchor((anchor) => (anchor === event.currentTarget ? null : event.currentTarget));
            setSettingsAnchor(null);
            setUserAnchor(null);
          }}
          aria-label="Open notifications"
          aria-haspopup="menu"
          aria-expanded={Boolean(notificationAnchor)}
          className="relative w-9 h-9 cursor-pointer rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
        >
          <Bell size={20} strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#036c5f]" />
        </button>
        <button className="w-9 h-9 cursor-pointer rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <CircleHelp size={20} strokeWidth={1.75} />
        </button>
        {canManageSettings ? (
          <button
            type="button"
            onMouseEnter={(event) => {
              clearMenuCloseTimer();
              setSettingsAnchor(event.currentTarget);
              setNotificationAnchor(null);
              setUserAnchor(null);
            }}
            onMouseLeave={scheduleMenuClose}
            onClick={(event) => {
              setSettingsAnchor((anchor) => (anchor === event.currentTarget ? null : event.currentTarget));
              setNotificationAnchor(null);
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
            setNotificationAnchor(null);
          }}
          onMouseLeave={scheduleMenuClose}
          onClick={(event) => {
            setUserAnchor((anchor) => (anchor === event.currentTarget ? null : event.currentTarget));
            setSettingsAnchor(null);
            setNotificationAnchor(null);
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
      <ConnectCascadingMenu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={closeMenus}
        items={notificationItems}
        heading="Notifications"
        minWidth={240}
        openToLeft
        onMouseEnter={clearMenuCloseTimer}
        onMouseLeave={scheduleMenuClose}
      />
      {canManageSettings ? (
        <ConnectCascadingMenu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={closeMenus}
          items={settingsItems}
          minWidth={720}
          columns={3}
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
