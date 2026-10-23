import { ReactNode } from "react";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import {
  Bell,
  Check,
  ChevronRight,
  EyeOff,
  ExternalLink,
  Flag,
  Forward,
  Link,
  LogOut,
  MailOpen,
  MoreVertical,
  Pencil,
  Pin,
  Plus,
  Save,
  Settings,
  Sun,
  Trash2,
  UserPlus,
  Languages,
} from "lucide-react";

// 📝 Define clear structural interfaces for your configuration
export interface MenuItem {
  id: string;
  label: string;
  selected?: boolean;
  sectionTitle?: string;
  icon?: ReactNode;
  closeOnClick?: boolean;
  dividerAbove?: boolean;
  danger?: boolean;
  onClick?: () => void;
  children?: MenuItem[];
}

export interface SidebarContext {
  kind: "section" | "quick-view" | "personal" | "user" | "channel" | "team" | "message";
  sectionId?: string;
  id?: string;
  label?: string;
}

export interface SectionViewModeState {
  favorites: string;
  chats: string;
  mentions: string;
  threads: string;
  drafts: string;
}

export interface TeamMenuActions {
  canLeave: boolean;
  onAddMember: () => void;
  onManageTeam: () => void;
  onLeaveTeam: () => void;
}

// 🧬 Shared action sub-menus used across multiple context variants
const getMoveSectionChildren = (setCreateSectionOpen: (open: boolean) => void, includeFavorites = true) => [
  ...(includeFavorites ? [{ id: "move-favorites", label: "Favorites" }] : []),
  { id: "move-new-section", label: "New Section", onClick: () => setCreateSectionOpen(true) },
];

function conversationUrl(conversationId: string | undefined) {
  const url = new URL(window.location.href);
  if (conversationId) url.searchParams.set("conversation", conversationId);
  return url.toString();
}

export function getMenuItems(
  sidebarMenuContext: SidebarContext | null | undefined,
  sectionViewMode: SectionViewModeState,
  setSectionViewMode: React.Dispatch<React.SetStateAction<SectionViewModeState>>,
  setCreateSectionOpen: (open: boolean) => void,
  setCreateTeamOpen: (open: boolean) => void,
  setCreateChannelOpen: (open: boolean) => void,
  pushSystemMessage: (msg: string) => void,
  onSaveSidebarSettings: (settings: {
    favoritesFilter?: "all" | "unread";
    chatsFilter?: "all" | "unread";
    mentions?: "always" | "unread";
    threads?: "always" | "unread";
    drafts?: "visible" | "hidden";
  }) => void,
  teamActions?: TeamMenuActions,
): ConnectCascadingMenuItem[] {
  if (!sidebarMenuContext?.kind) return [];

  // 🔀 Switch by context kind to instantly narrow execution paths
  switch (sidebarMenuContext.kind) {
    case "section": {
      const { sectionId } = sidebarMenuContext;

      if (sectionId === "quick-views") {
        return [
          { id: "show-always", label: "Always", selected: true, sectionTitle: "Show" },
          { id: "show-unread", label: "When unread" },
        ];
      }

      if (sectionId === "favorites" || sectionId === "chats") {
        return [
          {
            id: "view-all",
            label: "All",
            selected: sectionViewMode[sectionId] === "all",
            sectionTitle: "View",
            onClick: () => {
              setSectionViewMode((prev) => ({ ...prev, [sectionId]: "all" }));
              onSaveSidebarSettings(sectionId === "favorites" ? { favoritesFilter: "all" } : { chatsFilter: "all" });
            },
          },
          {
            id: "view-unread",
            label: "Unread only",
            selected: sectionViewMode[sectionId] === "unread",
            onClick: () => {
              setSectionViewMode((prev) => ({ ...prev, [sectionId]: "unread" }));
              onSaveSidebarSettings(sectionId === "favorites" ? { favoritesFilter: "unread" } : { chatsFilter: "unread" });
            },
          },
        ];
      }

      if (sectionId === "teams") {
        return [
          {
            id: "create-team",
            label: "Create Team",
            icon: <Plus size={16} />,
            sectionTitle: "Options",
            onClick: () => setCreateTeamOpen(true),
          },
        ];
      }
      return [];
    }

    case "quick-view": {
      if (sidebarMenuContext.id === "drafts") {
        return [
          {
            id: "hide-drafts",
            label: "Hide",
            icon: <EyeOff size={16} />,
            sectionTitle: "Options",
            onClick: () => {
              setSectionViewMode((prev) => ({ ...prev, drafts: "hidden" }));
              onSaveSidebarSettings({ drafts: "hidden" });
            },
          },
        ];
      }

      const key = sidebarMenuContext.id as "mentions" | "threads";
      return [
        {
          id: "show-always",
          label: "Always",
          selected: sectionViewMode[key] === "always",
          sectionTitle: "Show",
          onClick: () => {
            setSectionViewMode((prev) => ({ ...prev, [key]: "always" }));
            onSaveSidebarSettings({ [key]: "always" });
          },
        },
        {
          id: "show-unread",
          label: "When unread",
          selected: sectionViewMode[key] === "unread",
          onClick: () => {
            setSectionViewMode((prev) => ({ ...prev, [key]: "unread" }));
            onSaveSidebarSettings({ [key]: "unread" });
          },
        },
      ];
    }

    case "personal":
      return [
        { id: "open-window", label: "Open in new window", icon: <ExternalLink size={16} /> },
        {
          id: "move-section",
          label: "Move to section",
          closeOnClick: false,
          children: getMoveSectionChildren(setCreateSectionOpen),
        },
        { id: "hide", label: "Hide", icon: <EyeOff size={16} /> },
      ];

    case "user":
      return [
        { id: "open-window", label: "Open in new window", icon: <ExternalLink size={16} />, onClick: () => window.open(conversationUrl(sidebarMenuContext.id), "_blank", "noopener,noreferrer") },
        { id: "mark-read", label: "Mark as read", icon: <Check size={16} /> },
        // {
        //   id: "move-section",
        //   label: "Move to section",
        //   closeOnClick: false,
        //   children: getMoveSectionChildren(setCreateSectionOpen),
        // },
        { id: "mute", label: "Mute", icon: <Bell size={16} /> },
        { id: "notify", label: "Notify when available", icon: <Sun size={16} /> },
        // { id: "workflows", label: "Workflows", icon: <SettingsRounded fontSize="small" /> }, TODO
        { id: "copy-link", label: "Copy link", icon: <Link size={16} />, onClick: () => void navigator.clipboard.writeText(conversationUrl(sidebarMenuContext.id)).catch(() => undefined) },
        {
          id: "remove-history",
          label: "Remove Chat History",
          icon: <Trash2 size={16} />,
          dividerAbove: true,
          danger: true,
        },
        // { id: "hide", label: "Hide", icon: <VisibilityOffRounded fontSize="small" /> }, TODO
      ];

    case "channel":
      return [
        { id: "open-window", label: "Open in new window", icon: <ExternalLink size={16} />, onClick: () => window.open(conversationUrl(sidebarMenuContext.id), "_blank", "noopener,noreferrer") },
        // {
        //   id: "channel-notifications",
        //   label: "Channel notifications",
        //   icon: <Bell size={16} />,
        // },
        // {
        //   id: "move-section",
        //   label: "Move to section",
        //   closeOnClick: false,
        //   children: getMoveSectionChildren(setCreateSectionOpen, false), // No Favorites for channels
        // },
        // { id: "remove-section", label: "Remove from section", icon: <Trash2 size={16} /> },
        // { id: "hide", label: "Hide", icon: <EyeOff size={16} /> },
        // {
        //   id: "manage-channel",
        //   label: "Manage channel",
        //   icon: <Settings size={16} />,
        //   dividerAbove: true,
        //   onClick: () => pushSystemMessage(`Manage channel requested for ${sidebarMenuContext.label || ""}.`),
        // },
        // { id: "manage-tags", label: "Manage channel tags", icon: <Pencil size={16} /> },
        { id: "copy-link", label: "Copy Link", icon: <Link size={16} />, onClick: () => void navigator.clipboard.writeText(conversationUrl(sidebarMenuContext.id)) },
        // { id: "workflows", label: "Work flows", icon: <Settings size={16} /> },
        // { id: "go-team", label: "Go to team", icon: <ChevronRight size={16} /> },
      ];

    case "team":
      return [
        // { id: "hide-channels", label: "Hide all Channels", icon: <EyeOff size={16} /> },
        { id: "add-member", label: "Add member", icon: <UserPlus size={16} />, onClick: teamActions?.onAddMember },
        {
          id: "add-channel",
          label: "Add channel",
          icon: <Plus size={16} />,
          onClick: () => setCreateChannelOpen(true),
        },
        {
          id: "manage-team",
          label: "Manage team",
          icon: <Settings size={16} />,
          onClick: teamActions?.onManageTeam,
        },
        // { id: "manage-tags", label: "Manage tags", icon: <Pencil size={16} /> },
        // { id: "copy-link", label: "Copy link", icon: <Link size={16} /> },
        ...(teamActions?.canLeave ? [{ id: "leave-team", label: "Leave team", icon: <LogOut size={16} />, dividerAbove: true, danger: true, onClick: teamActions.onLeaveTeam }] : []),
      ];

    case "message":
      return [
        { id: "forward", label: "Forward", icon: <Forward size={16} /> },
        { id: "copy-link", label: "Copy Link", icon: <Link size={16} /> },
        { id: "pin", label: "Pin", icon: <Pin size={16} /> },
        { id: "save", label: "Save this Message", icon: <Save size={16} /> },
        { id: "mark-unread", label: "Mark as unread", icon: <MailOpen size={16} /> },
        { id: "translate", label: "Translations", icon: <Languages size={16} /> },
        { id: "report", label: "Report this Message", icon: <Flag size={16} />, danger: true },
        { id: "more", label: "More actions", icon: <MoreVertical size={16} /> },
      ];
    default:
      return [];
  }
}
