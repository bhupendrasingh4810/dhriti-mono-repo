import { ReactNode } from "react";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import {
  AddRounded,
  CheckRounded,
  DeleteOutlineRounded,
  EditRounded,
  ExitToAppRounded,
  LinkRounded,
  NotificationsNoneRounded, // 💡 Fixed original typo: "NotificationsNoneRounde"
  OpenInNewRounded,
  PersonAddAlt1Rounded,
  SettingsRounded,
  VisibilityOffRounded,
  WbSunnyOutlined,
  ChevronRightRounded,
  ForwardToInboxRounded,
  PushPinRounded,
  SaveAltRounded,
  MarkEmailUnreadRounded,
  TranslateRounded,
  FlagOutlined,
  MoreVertRounded,
} from "@mui/icons-material";

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
}

// 🧬 Shared action sub-menus used across multiple context variants
const getMoveSectionChildren = (setCreateSectionOpen: (open: boolean) => void, includeFavorites = true) => [
  ...(includeFavorites ? [{ id: "move-favorites", label: "Favorites" }] : []),
  { id: "move-new-section", label: "New Section", onClick: () => setCreateSectionOpen(true) },
];

export function getMenuItems(
  sidebarMenuContext: SidebarContext | null | undefined,
  sectionViewMode: Record<string, string>,
  setSectionViewMode: React.Dispatch<React.SetStateAction<SectionViewModeState>>,
  setCreateSectionOpen: (open: boolean) => void,
  setCreateTeamOpen: (open: boolean) => void,
  setCreateChannelOpen: (open: boolean) => void,
  pushSystemMessage: (msg: string) => void,
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
            onClick: () => setSectionViewMode((prev) => ({ ...prev, [sectionId]: "all" })),
          },
          {
            id: "view-unread",
            label: "Unread only",
            selected: sectionViewMode[sectionId] === "unread",
            onClick: () => setSectionViewMode((prev) => ({ ...prev, [sectionId]: "unread" })),
          },
        ];
      }

      if (sectionId === "teams") {
        return [
          {
            id: "create-team",
            label: "Create Team",
            icon: <AddRounded fontSize="small" />,
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
            icon: <VisibilityOffRounded fontSize="small" />,
            sectionTitle: "Options",
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
          onClick: () => setSectionViewMode((prev) => ({ ...prev, [key]: "always" })),
        },
        {
          id: "show-unread",
          label: "When unread",
          selected: sectionViewMode[key] === "unread",
          onClick: () => setSectionViewMode((prev) => ({ ...prev, [key]: "unread" })),
        },
      ];
    }

    case "personal":
      return [
        { id: "open-window", label: "Open in new window", icon: <OpenInNewRounded fontSize="small" /> },
        {
          id: "move-section",
          label: "Move to section",
          closeOnClick: false,
          children: getMoveSectionChildren(setCreateSectionOpen),
        },
        { id: "hide", label: "Hide", icon: <VisibilityOffRounded fontSize="small" /> },
      ];

    case "user":
      return [
        { id: "open-window", label: "Open in new window", icon: <OpenInNewRounded fontSize="small" /> },
        { id: "mark-read", label: "Mark as read", icon: <CheckRounded fontSize="small" /> },
        {
          id: "move-section",
          label: "Move to section",
          closeOnClick: false,
          children: getMoveSectionChildren(setCreateSectionOpen),
        },
        { id: "mute", label: "Mute", icon: <NotificationsNoneRounded fontSize="small" /> },
        { id: "notify", label: "Notify when available", icon: <WbSunnyOutlined fontSize="small" /> },
        { id: "workflows", label: "Workflows", icon: <SettingsRounded fontSize="small" /> },
        { id: "copy-link", label: "Copy link", icon: <LinkRounded fontSize="small" /> },
        {
          id: "remove-history",
          label: "Remove Chat History",
          icon: <DeleteOutlineRounded fontSize="small" />,
          dividerAbove: true,
          danger: true,
        },
        { id: "hide", label: "Hide", icon: <VisibilityOffRounded fontSize="small" /> },
      ];

    case "channel":
      return [
        { id: "open-window", label: "Open in new window", icon: <OpenInNewRounded fontSize="small" /> },
        {
          id: "channel-notifications",
          label: "Channel notifications",
          icon: <NotificationsNoneRounded fontSize="small" />,
        },
        {
          id: "move-section",
          label: "Move to section",
          closeOnClick: false,
          children: getMoveSectionChildren(setCreateSectionOpen, false), // No Favorites for channels
        },
        { id: "remove-section", label: "Remove from section", icon: <DeleteOutlineRounded fontSize="small" /> },
        { id: "hide", label: "Hide", icon: <VisibilityOffRounded fontSize="small" /> },
        {
          id: "manage-channel",
          label: "Manage channel",
          icon: <SettingsRounded fontSize="small" />,
          dividerAbove: true,
          onClick: () => pushSystemMessage(`Manage channel requested for ${sidebarMenuContext.label || ""}.`),
        },
        { id: "manage-tags", label: "Manage channel tags", icon: <EditRounded fontSize="small" /> },
        { id: "copy-link", label: "Copy Link", icon: <LinkRounded fontSize="small" /> },
        { id: "workflows", label: "Work flows", icon: <SettingsRounded fontSize="small" /> },
        { id: "go-team", label: "Go to team", icon: <ChevronRightRounded fontSize="small" /> },
      ];

    case "team":
      return [
        { id: "hide-channels", label: "Hide all Channels", icon: <VisibilityOffRounded fontSize="small" /> },
        { id: "add-member", label: "Add member", icon: <PersonAddAlt1Rounded fontSize="small" /> },
        {
          id: "add-channel",
          label: "Add channel",
          icon: <AddRounded fontSize="small" />,
          onClick: () => setCreateChannelOpen(true),
        },
        {
          id: "manage-team",
          label: "Manage team",
          icon: <SettingsRounded fontSize="small" />,
          onClick: () => pushSystemMessage(`Manage team requested for ${sidebarMenuContext.label || ""}.`),
        },
        { id: "manage-tags", label: "Manage tags", icon: <EditRounded fontSize="small" /> },
        { id: "copy-link", label: "Copy link", icon: <LinkRounded fontSize="small" /> },
        { id: "leave-team", label: "Leave team", icon: <ExitToAppRounded fontSize="small" /> },
      ];

    case "message":
      return [
        { id: "forward", label: "Forward", icon: <ForwardToInboxRounded fontSize="small" /> },
        { id: "copy-link", label: "Copy Link", icon: <LinkRounded fontSize="small" /> },
        { id: "pin", label: "Pin", icon: <PushPinRounded fontSize="small" /> },
        { id: "save", label: "Save this Message", icon: <SaveAltRounded fontSize="small" /> },
        { id: "mark-unread", label: "Mark as unread", icon: <MarkEmailUnreadRounded fontSize="small" /> },
        { id: "translate", label: "Translations", icon: <TranslateRounded fontSize="small" /> },
        { id: "report", label: "Report this Message", icon: <FlagOutlined fontSize="small" />, danger: true },
        { id: "more", label: "More actions", icon: <MoreVertRounded fontSize="small" /> },
      ];
    default:
      return [];
  }
}
