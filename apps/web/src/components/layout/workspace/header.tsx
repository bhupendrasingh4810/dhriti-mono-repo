import type { AppView } from "@/types/app.types";
import { useState } from "react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { useAuth } from "@/hooks/use-auth";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
// import { useOrganization } from "@/hooks/use-organization";

interface Props {
  activeView: AppView;
  onViewChange: (v: AppView) => void;
}

const APP_VIEW_TITLES: Partial<Record<AppView, string>> = {
  connect: "Connect",
  pulse: "Pulse",
  flow: "Flow",
  atlas: "Atlas",
  cadence: "Cadence",
  control: "Control",
};

export default function Header({ activeView, onViewChange }: Props) {
  // const { currentOrg, organization } = useOrganization();
  const [appsOpen, setAppsOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const { user, logout } = useAuth();
  const userName = user?.name ?? "User";
  const userEmail = user?.email ?? "user@dhriti.app";
  const userInitials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const settingsItems: ConnectCascadingMenuItem[] = [
    {
      id: "general-settings",
      label: "General Settings",
      icon: <SettingsMenuIcon kind="general" />,
      sectionTitle: "Personal Settings",
    },
    { id: "notification-settings", label: "Notification Settings", icon: <SettingsMenuIcon kind="notification" /> },
    {
      id: "system-settings",
      label: "System",
      icon: <SettingsMenuIcon kind="system" />,
      sectionTitle: "Flow Admin Settings",
      dividerAbove: true,
    },
    { id: "space-settings", label: "Spaces", icon: <SettingsMenuIcon kind="spaces" /> },
    { id: "work-item-settings", label: "Work Items", icon: <SettingsMenuIcon kind="workItems" /> },
    // {
    //   id: "connect-settings",
    //   label: "Connect Settings",
    //   icon: <SettingsMenuIcon kind="connect" />,
    //   sectionTitle: "Connect Settings",
    //   dividerAbove: true,
    // },
    // {
    //   id: "pulse-settings",
    //   label: "Pulse Settings",
    //   icon: <SettingsMenuIcon kind="pulse" />,
    //   sectionTitle: "Pulse Settings",
    //   dividerAbove: true,
    // },
    // {
    //   id: "atlas-settings",
    //   label: "Atlas Settings",
    //   icon: <SettingsMenuIcon kind="atlas" />,
    //   sectionTitle: "Atlas Settings",
    //   dividerAbove: true,
    // },
    // {
    //   id: "cadence-settings",
    //   label: "Cadence Settings",
    //   icon: <SettingsMenuIcon kind="cadence" />,
    //   sectionTitle: "Cadence Settings",
    //   dividerAbove: true,
    // },
    // {
    //   id: "hrms-settings",
    //   label: "HRMS Settings",
    //   icon: <SettingsMenuIcon kind="hrms" />,
    //   sectionTitle: "HRMS Settings",
    //   dividerAbove: true,
    // },
    {
      id: "user-management",
      label: "User Management",
      icon: <SettingsMenuIcon kind="users" />,
      sectionTitle: "Dhriti Admin Settings",
      dividerAbove: true,
    },
    { id: "billing", label: "Billing", icon: <SettingsMenuIcon kind="billing" /> },
  ];

  const userItems: ConnectCascadingMenuItem[] = [
    {
      id: "user-card",
      label: userName,
      description: userEmail,
      icon: (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#036c5f] text-xs font-bold text-white">
          {userInitials}
        </span>
      ),
      closeOnClick: false,
    },
    { id: "profile", label: "Profile", icon: <SettingsMenuIcon kind="profile" />, dividerAbove: true },
    { id: "theme", label: "Theme", icon: <SettingsMenuIcon kind="theme" /> },
    {
      id: "logout",
      label: "Logout",
      icon: <SettingsMenuIcon kind="logout" />,
      dividerAbove: true,
      danger: true,
      onClick: () => void logout(),
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
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
              <rect x="11" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="2" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
            </svg>
          </div>
        </div>
      </span>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        <button
          onClick={() => onViewChange("home")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: activeView === "home" ? "#e6f4f2" : "transparent",
            color: activeView === "home" ? "#036c5f" : "#64748b",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </button>

        <div className="relative">
          <button
            onClick={() => setAppsOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-slate-600 hover:bg-slate-50"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Apps
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {appsOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl border border-slate-100 shadow-lg py-1.5 z-50">
              {(Object.entries(APP_VIEW_TITLES) as [AppView, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    onViewChange(id);
                    setAppsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#036c5f]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(event) => {
            setSettingsAnchor((anchor) => (anchor === event.currentTarget ? null : event.currentTarget));
            setUserAnchor(null);
          }}
          aria-label="Open settings"
          aria-haspopup="menu"
          aria-expanded={Boolean(settingsAnchor)}
          className="flex h-9 w-9 items-center justify-center rounded-lg cursor-pointer text-slate-500 transition-all hover:bg-slate-50"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20.3h-3v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.04 15 1.7 1.7 0 0 0 5.48 13.96h-.1v-3h.1A1.7 1.7 0 0 0 7.04 9.92 1.7 1.7 0 0 0 6.7 8.04l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.04-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(event) => {
            setUserAnchor((anchor) => (anchor === event.currentTarget ? null : event.currentTarget));
            setSettingsAnchor(null);
          }}
          aria-label="Open user menu"
          aria-haspopup="menu"
          aria-expanded={Boolean(userAnchor)}
          className="ml-1 flex items-center gap-2 rounded-lg p-1 transition-all hover:bg-slate-50"
        >
          <div className="w-8 h-8 rounded-full bg-[#036c5f] flex items-center justify-center">
            <span className="text-white text-xs font-bold">{userInitials}</span>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      <ConnectCascadingMenu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
        items={settingsItems}
        minWidth={248}
      />
      <ConnectCascadingMenu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={() => setUserAnchor(null)}
        items={userItems}
        minWidth={248}
      />
    </header>
  );
}

type SettingsMenuIconProps = {
  kind:
    | "general"
    | "notification"
    | "system"
    | "spaces"
    | "workItems"
    | "connect"
    | "pulse"
    | "atlas"
    | "cadence"
    | "hrms"
    | "users"
    | "billing"
    | "profile"
    | "theme"
    | "logout";
};

function SettingsMenuIcon({ kind }: SettingsMenuIconProps) {
  const paths = {
    general: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.1 2.1-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20.3h-3v-.1a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.1-2.1.06-.06A1.7 1.7 0 0 0 7.04 15 1.7 1.7 0 0 0 5.48 13.96h-.1v-3h.1A1.7 1.7 0 0 0 7.04 9.92 1.7 1.7 0 0 0 6.7 8.04l-.06-.06 2.1-2.1.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.04-1.56v-.1h3v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.1 2.1-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.1v3h-.1A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
    notification: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    system: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    spaces: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    workItems: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    connect: (
      <>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </>
    ),
    pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
    atlas: (
      <>
        <path d="m9 18-6-3V5l6 3 6-3 6 3v10l-6-3z" />
        <path d="M9 8v10M15 5v10" />
      </>
    ),
    cadence: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    hrms: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2" />
        <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 16c2.5 0 4 1.3 4 4" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2" />
        <path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 16c2.5 0 4 1.3 4 4" />
      </>
    ),
    billing: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </>
    ),
    theme: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
  }[kind];

  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}
