import type { AppView } from "@/types/app.types";
import { useState } from "react";
import {
  Activity,
  Bell,
  ChevronDown,
  CircleHelp,
  Clock,
  CreditCard,
  FileText,
  Grid2X2,
  Home,
  LogOut,
  Map,
  MessageSquare,
  PanelsTopLeft,
  Settings,
  SquareCheckBig,
  Sun,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConnectHeaderSearch, type ConnectHeaderSearchItem } from "@/features/connect/components/ConnectHeaderSearch";
import { useAuth } from "@/hooks/use-auth";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
// import { useOrganization } from "@/hooks/use-organization";

interface Props {
  activeView: AppView;
  onViewChange: (v: AppView) => void;
  connectSearch?: {
    users: ConnectHeaderSearchItem[];
    messages: ConnectHeaderSearchItem[];
    files: ConnectHeaderSearchItem[];
  };
}

const APP_VIEW_TITLES: Partial<Record<AppView, string>> = {
  connect: "Connect",
  pulse: "Pulse",
  flow: "Flow",
  atlas: "Atlas",
  cadence: "Cadence",
  control: "Control",
};

export default function Header({ activeView, onViewChange, connectSearch }: Props) {
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
            <PanelsTopLeft aria-hidden="true" size={18} strokeWidth={2} className="text-white" />
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
          <Home size={15} strokeWidth={2} />
          Home
        </button>

        <div className="relative">
          <button
            onClick={() => setAppsOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-slate-600 hover:bg-slate-50"
          >
            <Grid2X2 size={15} strokeWidth={2} />
            Apps
            <ChevronDown size={12} strokeWidth={2.5} />
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

      {activeView === "connect" && connectSearch && (
        <div className="absolute left-1/2 z-10 w-full max-w-[680px] -translate-x-1/2 px-4">
          <ConnectHeaderSearch {...connectSearch} />
        </div>
      )}

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#036c5f]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <CircleHelp size={18} strokeWidth={1.75} />
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
          <Settings size={24} strokeWidth={1.75} />
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
          <ChevronDown size={12} strokeWidth={2.5} color="#94a3b8" />
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

const SETTINGS_MENU_ICONS: Record<SettingsMenuIconProps["kind"], LucideIcon> = {
  general: Settings,
  notification: Bell,
  system: FileText,
  spaces: Grid2X2,
  workItems: SquareCheckBig,
  connect: MessageSquare,
  pulse: Activity,
  atlas: Map,
  cadence: Clock,
  hrms: Users,
  users: Users,
  billing: CreditCard,
  profile: UserRound,
  theme: Sun,
  logout: LogOut,
};

function SettingsMenuIcon({ kind }: SettingsMenuIconProps) {
  const Icon = SETTINGS_MENU_ICONS[kind];

  return <Icon aria-hidden="true" size={16} strokeWidth={1.75} />;
}
