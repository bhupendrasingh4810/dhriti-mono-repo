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
  LogOut,
  Map,
  MessageSquare,
  PanelsTopLeft,
  Settings,
  SquareCheckBig,
  Sun,
  UserRound,
  Users,
} from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { ConnectHeaderSearch } from "@/features/connect/components/ConnectHeaderSearch";
import type { ConnectHeaderSearchItem } from "@/types/connect.types";
import { useAuth } from "@/hooks/use-auth";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";

interface Props {
  activeView: AppView;
  onViewChange: (v: AppView) => void;
  connectSearch?: {
    users: ConnectHeaderSearchItem[];
    messages: ConnectHeaderSearchItem[];
    files: ConnectHeaderSearchItem[];
  };
}

export default function Header({ activeView, onViewChange, connectSearch }: Props) {
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
      icon: <Settings aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Personal Settings",
    },
    { id: "notification-settings", label: "Notification Settings", icon: <Bell aria-hidden="true" size={16} strokeWidth={1.75} /> },
    {
      id: "user-management",
      label: "User Management",
      icon: <Users aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Dhriti Admin Settings",
      dividerAbove: true,
    },
    { id: "billing", label: "Billing", icon: <CreditCard aria-hidden="true" size={16} strokeWidth={1.75} /> },
    {
      id: "system-settings",
      label: "System",
      icon: <FileText aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Workspace Settings",
      dividerAbove: true,
    },
    { id: "space-settings", label: "Spaces", icon: <Grid2X2 aria-hidden="true" size={16} strokeWidth={1.75} /> },
    { id: "work-item-settings", label: "Work Items", icon: <SquareCheckBig aria-hidden="true" size={16} strokeWidth={1.75} /> },
    {
      id: "connect-settings",
      label: "Connect Settings",
      icon: <MessageSquare aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Application Settings",
      dividerAbove: true,
    },
    {
      id: "pulse-settings",
      label: "Pulse Settings",
      icon: <Activity aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Pulse Settings",
      dividerAbove: true,
    },
    {
      id: "atlas-settings",
      label: "Atlas Settings",
      icon: <Map aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Atlas Settings",
      dividerAbove: true,
    },
    {
      id: "cadence-settings",
      label: "Cadence Settings",
      icon: <Clock aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "Cadence Settings",
      dividerAbove: true,
    },
    {
      id: "hrms-settings",
      label: "HRMS Settings",
      icon: <Users aria-hidden="true" size={16} strokeWidth={1.75} />,
      sectionTitle: "HRMS Settings",
      dividerAbove: true,
    },
    
  ];

  const userItems: ConnectCascadingMenuItem[] = [
    {
      id: "user-card",
      label: userName,
      description: userEmail,
      descriptionLayout: "stacked",
      icon: (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#036c5f] text-xs font-bold text-white">
          {userInitials}
        </span>
      ),
      closeOnClick: false,
    },
    { id: "profile", label: "Profile", icon: <UserRound aria-hidden="true" size={16} strokeWidth={1.75} />, dividerAbove: true },
    { id: "theme", label: "Theme", icon: <Sun aria-hidden="true" size={16} strokeWidth={1.75} /> },
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
          <Bell size={20} strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#036c5f]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <CircleHelp size={20} strokeWidth={1.75} />
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
          <Settings size={20} strokeWidth={1.75} />
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
        minWidth={720}
        columns={3}
      />
      <ConnectCascadingMenu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={() => setUserAnchor(null)}
        items={userItems}
        minWidth={192}
        openToLeft
      />
    </header>
  );
}

