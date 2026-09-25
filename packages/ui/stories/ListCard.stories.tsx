import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import MenuItem from "@mui/material/MenuItem";

// Icons for Headers and Actions
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import PermMediaRounded from "@mui/icons-material/PermMediaRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import ChecklistRounded from "@mui/icons-material/ChecklistRounded";
import CampaignRounded from "@mui/icons-material/CampaignRounded";
import NotificationsRounded from "@mui/icons-material/NotificationsRounded";
import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import LocalOfferRounded from "@mui/icons-material/LocalOfferRounded";
import FolderRounded from "@mui/icons-material/FolderRounded";
import ConfirmationNumberRounded from "@mui/icons-material/ConfirmationNumberRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import PieChartRounded from "@mui/icons-material/PieChartRounded";
import CallRounded from "@mui/icons-material/CallRounded";
import LabelRounded from "@mui/icons-material/LabelRounded";
import ChatBubbleRounded from "@mui/icons-material/ChatBubbleRounded";
import InsightsRounded from "@mui/icons-material/InsightsRounded";
import AccountTreeRounded from "@mui/icons-material/AccountTreeRounded";

import { ListCard, type ListCardItem } from "../src/components/custom/TableListCard";

/**
 * # ListCard Component Documentation
 *
 * `ListCard` is an enterprise-grade, JSON-driven list card that handles headers,
 * ordered multi-column rows, interactive menus, pagination, and multi-selection.
 *
 * ## 1. Quick Start
 * Simply pass a title, header actions, an ordered `columns` array, and an `items` array:
 *
 * ```tsx
 * <ListCard
 *   title="Recent Activities"
 *   columns={["user", "dateTime", "chevron"]}
 *   items={items}
 *   viewAll={{ label: "View all" }}
 *   headerMenuItems={[{ label: "Export" }, { label: "Settings" }]}
 * />
 * ```
 *
 * ## 2. Column Keys & JSON Data Payloads
 *
 * | Column Key | Description | Required / Optional `item` field |
 * | :--- | :--- | :--- |
 * | `"checkbox"` | Checkbox for single/multi-selection | Handled automatically with `selectable` or `selectedIds` |
 * | `"user"` | User avatar + Name + Subtitle (activity, team, designation, or none) | `item.user: { name, avatarUrl, initials, subtitleType, activity, designation, teamName }` |
 * | `"dateTime"` | Relative (1h ago), Due (Due in 2 days), or Standard date (MMM DD, YYYY) | `item.dateTime: { value, format: "format1" \| "format2" \| "format3" }` |
 * | `"media"` | Thumbnail preview + File name + Author & Timestamp | `item.media: { src, thumbnail, title, updatedBy, updatedAt }` |
 * | `"primaryText"` | Main item / Task / Ticket / Campaign name + metadata + link | `item.primaryText: { title, subtitle, description, metadata, href }` |
 * | `"avatarImage"` | Squared/rounded FAB image avatar | `item.avatarImage: { src, shape: "square" \| "rounded", size: "sm" }` |
 * | `"avatarInitials"` | Rounded initials avatar with auto-palette color | `item.avatarInitials: { initials: "AB", color: "#0284C7" }` |
 * | `"status"` | Neon / subtle badge (error, warning, success, info, inherit) | `item.status: { label: "High", type: "error" }` |
 * | `"progress"` | Determinate linear progress bar with percentage | `item.progress: { value: 75, max: 100, color: "primary" }` |
 * | `"email"` | Clickable `mailto:` or static text | `item.email: "user@domain.com"` |
 * | `"mobile"` | Clickable `tel:` or static phone number | `item.mobile: "+1 (555) 019-2834"` |
 * | `"downloadAction"`| Download icon button with callback | `item.downloadAction: { onDownload: (item) => ... }` |
 * | `"emailAction"` | Email icon button with callback | `item.emailAction: { onEmail: (item) => ... }` |
 * | `"referenceId"` | Monospace badge / ID (e.g. `DT-CO-1096`, `#ORD-9821`) | `item.referenceId: { id: "DT-CO-1096", href: "..." }` |
 * | `"app"` | Product app icon badge (Connect, Pulse, Flow, Atlas, Control, Nexus) | `item.app: "Connect"` |
 * | `"event"` | Calendar date badge (Month + Day) + Title + Time details | `item.event: { month: "OCT", day: 14, title: "...", date: "...", time: "..." }` |
 * | `"numeric"` | Price, Amount, or Metric (e.g. `$1,250.00`, `+12%`) | `item.numeric: { value: "$1,250.00", label: "total" }` |
 * | `"tags"` | List of category / topic chips | `item.tags: ["React 19", "MUI v9", "TypeScript"]` |
 * | `"pricing"` | Plan Name + dot-separated feature list | `item.pricing: { planName: "Enterprise Tier", details: ["SSO", "SLA"] }` |
 * | `"file"` | File icon thumbnail + Name + Type, Size, Modified date | `item.file: { name: "...", fileType: "PDF", size: "3.8 MB", modifiedAt: "2h ago" }` |
 * | `"starred"` | Interactive star button with state toggle | `item.starred: true`, `onStarToggle: (item, starred) => ...` |
 * | `"notification"`| Notification avatar + Title + Type & Timestamp | `item.notification: { appIcon, title, type, timestamp, unread }` |
 * | `"chevron"` | Right navigation arrow (`>`) | No item payload required |
 * | `"actions"` | 3-dots vertical menu or custom row action | `rowMenuItems: (item, context) => <MenuItem>...</MenuItem>` |
 * | `"custom"` | Arbitrary custom React node | `item.custom: (item) => <CustomComponent />` |
 */

const meta = {
  title: "UI Blocks/ListCard",
  component: ListCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Enterprise ListCard with JSON configuration, ordered column mapping, header actions, and rich presets.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 780, maxWidth: "100%", padding: "16px 0" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 1. BASIC LIST CARD
// ============================================================================
const basicListItems: ListCardItem[] = [
  {
    id: "act-1",
    user: {
      name: "Courtney Henry",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      subtitleType: "activity",
      activity: "Approved deployment to Production (v2.14.0)",
    },
    dateTime: { value: "just now", format: "format1" },
  },
  {
    id: "act-2",
    user: {
      name: "Michael Foster",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      subtitleType: "activity",
      activity: "Commented on Nexus Knowledge Document #418",
    },
    dateTime: { value: "12m ago", format: "format1" },
  },
  {
    id: "act-3",
    user: {
      name: "Dries Vincent",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      subtitleType: "activity",
      activity: "Merged PR #912 in Flow Automation Engine",
    },
    dateTime: { value: "1h ago", format: "format1" },
  },
  {
    id: "act-4",
    user: {
      name: "Lindsay Walton",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      subtitleType: "activity",
      activity: "Invited 3 new members to Engineering Team",
    },
    dateTime: { value: "1d ago", format: "format1" },
  },
];

export const BasicListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<HistoryRounded />}
      headerIconColor="#0284C7"
      headerIconBgColor="rgba(2, 132, 199, 0.08)"
      headerIconBorderColor="rgba(2, 132, 199, 0.2)"
      title="Recent Activities"
      columns={["user", "dateTime", "chevron"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[
        { label: "Filter activity stream" },
        { label: "Export audit log" },
        { label: "Stream preferences", divider: true },
      ]}
      items={basicListItems}
    />
  ),
};

// ============================================================================
// 2. IMAGE / MEDIA LIST CARD
// ============================================================================
const mediaListItems: ListCardItem[] = [
  {
    id: "media-1",
    media: {
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160",
      title: "q4_brand_identity_guidelines_dark.png",
      updatedBy: "Sarah Jenkins",
      updatedAt: "2 hours ago",
    },
    numeric: { value: "4.8 MB", color: "text.secondary", fontWeight: 500 },
  },
  {
    id: "media-2",
    media: {
      src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=160",
      title: "mobile_app_onboarding_walkthrough.mp4",
      updatedBy: "David Kim",
      updatedAt: "Yesterday",
    },
    numeric: { value: "28.4 MB", color: "text.secondary", fontWeight: 500 },
  },
  {
    id: "media-3",
    media: {
      src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160",
      title: "enterprise_architecture_diagram_v3.svg",
      updatedBy: "Alex Morgan",
      updatedAt: "3 days ago",
    },
    numeric: { value: "850 KB", color: "text.secondary", fontWeight: 500 },
  },
  {
    id: "media-4",
    media: {
      src: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=160",
      title: "product_launch_hero_illustration.webp",
      updatedBy: "Elena Rostova",
      updatedAt: "1 week ago",
    },
    numeric: { value: "1.2 MB", color: "text.secondary", fontWeight: 500 },
  },
];

export const ImageMediaListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<PermMediaRounded />}
      headerIconColor="#8B5CF6"
      headerIconBgColor="rgba(139, 92, 246, 0.08)"
      headerIconBorderColor="rgba(139, 92, 246, 0.2)"
      title="Media Library"
      columns={["media", "numeric", "chevron"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[
        { label: "Upload new asset" },
        { label: "Batch optimize images" },
        { label: "Storage settings" },
      ]}
      items={mediaListItems}
    />
  ),
};

// ============================================================================
// 3. DETAILED LIST CARD
// ============================================================================
const detailedListItems: ListCardItem[] = [
  {
    id: "mem-1",
    user: {
      name: "Sophia Martinez",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      subtitleType: "team",
      designation: "Staff Software Engineer",
      teamName: "Core Platform",
    },
    email: { address: "sophia.martinez@dhriti.io", align: "right" },
    status: { label: "Active", type: "success" },
  },
  {
    id: "mem-2",
    user: {
      name: "Marcus Vance",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      subtitleType: "team",
      designation: "Product Lead",
      teamName: "Connect & Chat",
    },
    email: { address: "marcus.vance@dhriti.io", align: "right" },
    status: { label: "In Meeting", type: "warning" },
  },
  {
    id: "mem-3",
    user: {
      name: "Aaliyah Patel",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      subtitleType: "team",
      designation: "Design Systems Architect",
      teamName: "Dhriti UI",
    },
    email: { address: "aaliyah.patel@dhriti.io", align: "right" },
    status: { label: "Sharing Screen", type: "info" },
  },
  {
    id: "mem-4",
    user: {
      name: "Lucas Brennan",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      subtitleType: "team",
      designation: "DevOps Engineer",
      teamName: "Infrastructure",
    },
    email: { address: "lucas.brennan@dhriti.io", align: "right" },
    status: { label: "Busy", type: "error" },
  },
  {
    id: "mem-5",
    user: {
      name: "Emma Watson",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      subtitleType: "team",
      designation: "Security Specialist",
      teamName: "IAM & Auth",
    },
    email: { address: "emma.watson@dhriti.io", align: "right" },
    status: { label: "Away", type: "inherit" },
  },
];

export const DetailedListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<GroupRounded />}
      headerIconColor="#10B981"
      headerIconBgColor="rgba(16, 185, 129, 0.08)"
      headerIconBorderColor="rgba(16, 185, 129, 0.2)"
      title="Team Members"
      columns={["user", "email", "status", "chevron"]}
      customButton={{
        label: "Invite",
        startIcon: <AddRounded fontSize="small" />,
        variant: "contained",
        size: "small",
      }}
      headerMenuItems={[
        { label: "Manage teams" },
        { label: "Export member directory" },
        { label: "Role permissions", divider: true },
      ]}
      items={detailedListItems}
    />
  ),
};

// ============================================================================
// 4. ACTIONABLE LIST CARD
// ============================================================================
const actionableTaskItems: ListCardItem[] = [
  {
    id: "task-1",
    primaryText: {
      title: "Implement SSO SAML 2.0 Integration",
      description: "Support Okta, Azure AD and Google Workspace",
    },
    status: { label: "High", type: "error" },
    dateTime: { value: "Due in 2 days", format: "format2" },
    avatarInitials: { initials: "SM", color: "#0284C7" },
  },
  {
    id: "task-2",
    primaryText: {
      title: "Migrate Postgres Schema for Nexus Knowledge",
      description: "Add vector search embeddings table & indexes",
    },
    status: { label: "High", type: "error" },
    dateTime: { value: "Due in 3 days", format: "format2" },
    avatarInitials: { initials: "LB", color: "#EF4444" },
  },
  {
    id: "task-3",
    primaryText: {
      title: "Update Design Tokens in @dhriti/ui",
      description: "Align semantic contrast ratios to WCAG AAA",
    },
    status: { label: "Medium", type: "warning" },
    dateTime: { value: "Due in 1 week", format: "format2" },
    avatarInitials: { initials: "AP", color: "#8B5CF6" },
  },
  {
    id: "task-4",
    primaryText: {
      title: "Conduct Pulse Analytics Q3 Benchmark",
      description: "Profile aggregation pipeline latency",
    },
    status: { label: "Low", type: "success" },
    dateTime: { value: "Due in 2 weeks", format: "format2" },
    avatarInitials: { initials: "MV", color: "#10B981" },
  },
];

export const ActionableListCardStory: Story = {
  name: "Actionable List Card",
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Array<string | number>>(["task-1", "task-2", "task-3"]);

    return (
      <ListCard
        headerImage={<ChecklistRounded />}
        headerIconColor="#0284C7"
        headerIconBgColor="rgba(2, 132, 199, 0.08)"
        headerIconBorderColor="rgba(2, 132, 199, 0.2)"
        title="Tasks"
        subtitle={`(${selectedIds.length} Selected)`}
        subtitlePosition="right"
        selectable
        selectedIds={selectedIds}
        onItemToggle={(item, selected) => {
          setSelectedIds((prev) => (selected ? [...prev, item.id] : prev.filter((id) => id !== item.id)));
        }}
        columns={["checkbox", "primaryText", "status", "dateTime", "avatarInitials", "actions"]}
        headerIcons={[
          { icon: <ArchiveOutlined fontSize="small" />, tooltip: "Archive selected" },
          { icon: <AccessTimeOutlined fontSize="small" />, tooltip: "Schedule selected" },
          { icon: <DeleteRounded fontSize="small" />, tooltip: "Delete selected" },
        ]}
        headerMenuItems={[{ label: "Select all tasks" }, { label: "Clear selection" }, { label: "Bulk export CSV" }]}
        rowMenuItems={(item, context) =>
          context.selectedIds.length > 1 ? (
            <>
              <MenuItem>Batch complete ({context.selectedIds.length} tasks)</MenuItem>
              <MenuItem>Batch reassign</MenuItem>
              <MenuItem sx={{ color: "error.main" }}>Batch delete</MenuItem>
            </>
          ) : (
            <>
              <MenuItem>Edit task</MenuItem>
              <MenuItem>Change priority</MenuItem>
              <MenuItem>Reassign owner</MenuItem>
              <MenuItem sx={{ color: "error.main" }}>Delete task</MenuItem>
            </>
          )
        }
        items={actionableTaskItems}
      />
    );
  },
};

// ============================================================================
// 5. PROGRESS LIST CARD
// ============================================================================
const progressCampaignItems: ListCardItem[] = [
  {
    id: "camp-1",
    avatarImage: {
      src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100",
      shape: "square",
      size: "sm",
    },
    primaryText: {
      title: "Global Enterprise Roadshow 2026",
      description: "Targeting Fortune 500 tech leaders",
    },
    status: { label: "In Progress", type: "warning" },
    progress: { value: 68, showPercentage: true, color: "warning" },
  },
  {
    id: "camp-2",
    avatarImage: {
      src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100",
      shape: "square",
      size: "sm",
    },
    primaryText: {
      title: "Nexus Knowledge Base Launch",
      description: "Product Hunt & DevCommunity Campaign",
    },
    status: { label: "Completed", type: "success" },
    progress: { value: 100, showPercentage: true, color: "success" },
  },
  {
    id: "camp-3",
    avatarImage: {
      src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100",
      shape: "square",
      size: "sm",
    },
    primaryText: {
      title: "Flow Automation Q3 Drip Emailer",
      description: "Nurturing 24,000 trial accounts",
    },
    status: { label: "In Review", type: "info" },
    progress: { value: 85, showPercentage: true, color: "info" },
  },
  {
    id: "camp-4",
    avatarImage: {
      src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100",
      shape: "square",
      size: "sm",
    },
    primaryText: {
      title: "Developer Community Hackathon",
      description: "Dhriti Plugin & Extensions Challenge",
    },
    status: { label: "Not Started", type: "inherit" },
    progress: { value: 12, showPercentage: true, color: "primary" },
  },
];

export const ProgressListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<CampaignRounded />}
      headerIconColor="#F59E0B"
      headerIconBgColor="rgba(245, 158, 11, 0.08)"
      headerIconBorderColor="rgba(245, 158, 11, 0.2)"
      title="Campaigns"
      columns={["avatarImage", "primaryText", "status", "progress", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[{ label: "New Campaign" }, { label: "Campaign analytics" }, { label: "Archive completed" }]}
      rowMenuItems={() => (
        <>
          <MenuItem>View campaign</MenuItem>
          <MenuItem>Edit milestones</MenuItem>
          <MenuItem>Pause campaign</MenuItem>
        </>
      )}
      items={progressCampaignItems}
    />
  ),
};

// ============================================================================
// 6. NOTIFICATION LIST CARD
// ============================================================================
const notificationItems: ListCardItem[] = [
  {
    id: "notif-1",
    notification: {
      appName: "Connect",
      appIcon: <ChatBubbleRounded fontSize="small" />,
      title: "Sophia Martinez mentioned you in #general: 'Please review the new UI schema'",
      type: "Mention",
      timestamp: "5m ago",
      unread: true,
    },
  },
  {
    id: "notif-2",
    notification: {
      appName: "Flow",
      appIcon: <AccountTreeRounded fontSize="small" />,
      title: "Automated workflow 'Nightly DB Backup' completed successfully",
      type: "Workflow",
      timestamp: "1h ago",
      unread: false,
    },
  },
  {
    id: "notif-3",
    notification: {
      appName: "Pulse",
      appIcon: <InsightsRounded fontSize="small" />,
      title: "Alert: API latency spike detected on US-East region (>450ms)",
      type: "System Alert",
      timestamp: "3h ago",
      unread: true,
    },
  },
  {
    id: "notif-4",
    notification: {
      appName: "Atlas",
      appIcon: <NotificationsRounded fontSize="small" />,
      title: "Sprint 42 planning milestone reached 90% completion",
      type: "Planning",
      timestamp: "Yesterday",
      unread: false,
    },
  },
];

export const NotificationListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<NotificationsRounded />}
      headerIconColor="#EC4899"
      headerIconBgColor="rgba(236, 72, 153, 0.08)"
      headerIconBorderColor="rgba(236, 72, 153, 0.2)"
      title="Notifications"
      columns={["notification", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[{ label: "Mark all as read" }, { label: "Notification channels" }, { label: "Mute alerts" }]}
      rowMenuItems={() => (
        <>
          <MenuItem>Mark as read</MenuItem>
          <MenuItem>View source</MenuItem>
          <MenuItem sx={{ color: "error.main" }}>Delete notification</MenuItem>
        </>
      )}
      items={notificationItems}
    />
  ),
};

// ============================================================================
// 7. PROFILE SUMMARY LIST CARD
// ============================================================================
const profileSummaryItems: ListCardItem[] = [
  {
    id: "prof-1",
    user: {
      name: "Ethan Wright",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      subtitleType: "designation",
      designation: "Chief Technology Officer",
    },
    status: { label: "Online", type: "success" },
    email: { address: "ethan.wright@dhriti.io", align: "right" },
  },
  {
    id: "prof-2",
    user: {
      name: "Clara Oswald",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      subtitleType: "designation",
      designation: "VP of Product Engineering",
    },
    status: { label: "Away", type: "warning" },
    email: { address: "clara.oswald@dhriti.io", align: "right" },
  },
  {
    id: "prof-3",
    user: {
      name: "Noah Bennett",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      subtitleType: "designation",
      designation: "Head of Information Security",
    },
    status: { label: "Busy", type: "error" },
    email: { address: "noah.bennett@dhriti.io", align: "right" },
  },
  {
    id: "prof-4",
    user: {
      name: "Zoe Saldana",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      subtitleType: "designation",
      designation: "Principal Cloud Architect",
    },
    status: { label: "Offline", type: "inherit" },
    email: { address: "zoe.saldana@dhriti.io", align: "right" },
  },
];

export const ProfileSummaryListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<AccountCircleRounded />}
      headerIconColor="#6366F1"
      headerIconBgColor="rgba(99, 102, 241, 0.08)"
      headerIconBorderColor="rgba(99, 102, 241, 0.2)"
      title="Profile Summary"
      columns={["user", "status", "email", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[{ label: "Export executive list" }, { label: "Directory settings" }]}
      rowMenuItems={() => (
        <>
          <MenuItem>View executive profile</MenuItem>
          <MenuItem>Send direct message</MenuItem>
          <MenuItem>View calendar</MenuItem>
        </>
      )}
      items={profileSummaryItems}
    />
  ),
};

// ============================================================================
// 8. PRICING / PLAN LIST CARD
// ============================================================================
const pricingPlanItems: ListCardItem[] = [
  {
    id: "plan-1",
    pricing: {
      planName: "Starter Tier",
      details: ["Up to 10 Seats", "100GB Storage", "Community Support"],
    },
    numeric: { value: "$10/month", color: "text.primary", fontWeight: 700 },
    status: { label: "Current", type: "info" },
  },
  {
    id: "plan-2",
    pricing: {
      planName: "Professional Growth",
      details: ["Up to 100 Seats", "2TB Cloud Storage", "24/7 Priority SLA"],
    },
    numeric: { value: "$49/month", color: "text.primary", fontWeight: 700 },
    status: { label: "Upgrade", type: "success" },
  },
  {
    id: "plan-3",
    pricing: {
      planName: "Enterprise WorkOS",
      details: ["Unlimited Seats", "Dedicated Private VPC", "Custom SAML & Audit"],
    },
    numeric: { value: "Custom", color: "text.primary", fontWeight: 700 },
    status: { label: "Contact Sales", type: "warning" },
  },
];

export const PricingPlanListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<LocalOfferRounded />}
      headerIconColor="#10B981"
      headerIconBgColor="rgba(16, 185, 129, 0.08)"
      headerIconBorderColor="rgba(16, 185, 129, 0.2)"
      title="Pricing List"
      columns={["pricing", "numeric", "status", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[
        { label: "Compare all features" },
        { label: "Billing history" },
        { label: "Enterprise agreements" },
      ]}
      rowMenuItems={() => (
        <>
          <MenuItem>Select plan</MenuItem>
          <MenuItem>Talk to account manager</MenuItem>
          <MenuItem>Download plan sheet</MenuItem>
        </>
      )}
      items={pricingPlanItems}
    />
  ),
};

// ============================================================================
// 9. FILE LIST CARD
// ============================================================================
const fileListItems: ListCardItem[] = [
  {
    id: "file-1",
    file: {
      name: "Q4_Financial_Consolidation_Report.pdf",
      fileType: "PDF",
      size: "4.2 MB",
      modifiedAt: "10m ago",
    },
    downloadAction: {
      onDownload: (item) => alert(`Downloading: ${item.file?.name}`),
    },
  },
  {
    id: "file-2",
    file: {
      name: "Dhriti_Platform_Security_Compliance_2026.docx",
      fileType: "DOCX",
      size: "1.8 MB",
      modifiedAt: "1h ago",
    },
    downloadAction: {
      onDownload: (item) => alert(`Downloading: ${item.file?.name}`),
    },
  },
  {
    id: "file-3",
    file: {
      name: "Nexus_Search_Vectors_Dump.parquet",
      fileType: "PARQUET",
      size: "128.4 MB",
      modifiedAt: "Yesterday",
    },
    downloadAction: {
      onDownload: (item) => alert(`Downloading: ${item.file?.name}`),
    },
  },
  {
    id: "file-4",
    file: {
      name: "WorkOS_Integration_Specs_v3.json",
      fileType: "JSON",
      size: "340 KB",
      modifiedAt: "3 days ago",
    },
    downloadAction: {
      onDownload: (item) => alert(`Downloading: ${item.file?.name}`),
    },
  },
];

export const FileListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<FolderRounded />}
      headerIconColor="#F97316"
      headerIconBgColor="rgba(249, 115, 22, 0.08)"
      headerIconBorderColor="rgba(249, 115, 22, 0.2)"
      title="Files"
      columns={["file", "downloadAction", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[{ label: "Upload files" }, { label: "Create folder" }, { label: "Storage breakdown" }]}
      rowMenuItems={() => (
        <>
          <MenuItem>Share link</MenuItem>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Move to folder</MenuItem>
          <MenuItem sx={{ color: "error.main" }}>Delete file</MenuItem>
        </>
      )}
      items={fileListItems}
    />
  ),
};

// ============================================================================
// 10. SUPPORT TICKET CARD
// ============================================================================
const supportTicketItems: ListCardItem[] = [
  {
    id: "tick-1",
    referenceId: { id: "DT-CO-1096" },
    primaryText: {
      title: "Websocket reconnection loop in Connect chat room",
      description: "Reported by Acme Global (Enterprise customer)",
    },
    status: { label: "High", type: "error" },
    tags: [{ label: "Open", type: "error" }],
  },
  {
    id: "tick-2",
    referenceId: { id: "DT-FL-1022" },
    primaryText: {
      title: "Kafka consumer offset lag in Flow webhook dispatcher",
      description: "Queue depth exceeded threshold of 5,000",
    },
    status: { label: "Medium", type: "warning" },
    tags: [{ label: "In Progress", type: "warning" }],
  },
  {
    id: "tick-3",
    referenceId: { id: "DT-CT-1075" },
    primaryText: {
      title: "SSO certificate rotation reminder for Azure tenant",
      description: "Cert expires in 14 days",
    },
    status: { label: "Low", type: "success" },
    tags: [{ label: "Resolved", type: "success" }],
  },
  {
    id: "tick-4",
    referenceId: { id: "DT-PL-1140" },
    primaryText: {
      title: "Pulse metrics widget export timeout on large date ranges",
      description: "Query exceeded 30s timeout limit",
    },
    status: { label: "High", type: "error" },
    tags: [{ label: "Open", type: "error" }],
  },
];

export const SupportTicketCard: Story = {
  render: () => (
    <ListCard
      headerImage={<ConfirmationNumberRounded />}
      headerIconColor="#EF4444"
      headerIconBgColor="rgba(239, 68, 68, 0.08)"
      headerIconBorderColor="rgba(239, 68, 68, 0.2)"
      title="Support Tickets"
      columns={["referenceId", "primaryText", "status", "tags", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[{ label: "Create ticket" }, { label: "Queue SLA report" }, { label: "Support settings" }]}
      rowMenuItems={() => (
        <>
          <MenuItem>Open ticket</MenuItem>
          <MenuItem>Assign agent</MenuItem>
          <MenuItem>Change status</MenuItem>
          <MenuItem>Escalate to Tier 2</MenuItem>
        </>
      )}
      items={supportTicketItems}
    />
  ),
};

// ============================================================================
// 11. ORDER LIST CARD
// ============================================================================
const orderItems: ListCardItem[] = [
  {
    id: "ord-1",
    referenceId: { id: "#ORD-9482" },
    dateTime: { value: "Sep 11, 2026", format: "format3" },
    numeric: { value: "$1,250.00", color: "text.primary", fontWeight: 700 },
    status: { label: "Delivered", type: "success" },
  },
  {
    id: "ord-2",
    referenceId: { id: "#ORD-9481" },
    dateTime: { value: "Sep 10, 2026", format: "format3" },
    numeric: { value: "$3,490.00", color: "text.primary", fontWeight: 700 },
    status: { label: "Shipped", type: "info" },
  },
  {
    id: "ord-3",
    referenceId: { id: "#ORD-9480" },
    dateTime: { value: "Sep 09, 2026", format: "format3" },
    numeric: { value: "$890.00", color: "text.primary", fontWeight: 700 },
    status: { label: "Processing", type: "warning" },
  },
  {
    id: "ord-4",
    referenceId: { id: "#ORD-9479" },
    dateTime: { value: "Sep 07, 2026", format: "format3" },
    numeric: { value: "$2,100.00", color: "text.primary", fontWeight: 700 },
    status: { label: "Returned", type: "error" },
  },
];

export const OrderListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<ShoppingCartRounded />}
      headerIconColor="#06B6D4"
      headerIconBgColor="rgba(6, 182, 212, 0.08)"
      headerIconBorderColor="rgba(6, 182, 212, 0.2)"
      title="Orders"
      columns={["referenceId", "dateTime", "numeric", "status", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[
        { label: "Export invoices" },
        { label: "Payment gateway status" },
        { label: "Order fulfillment settings" },
      ]}
      rowMenuItems={() => (
        <>
          <MenuItem>View invoice</MenuItem>
          <MenuItem>Track shipment</MenuItem>
          <MenuItem>Download receipt</MenuItem>
          <MenuItem sx={{ color: "error.main" }}>Cancel order</MenuItem>
        </>
      )}
      items={orderItems}
    />
  ),
};

// ============================================================================
// 12. EVENT LIST CARD
// ============================================================================
const eventItems: ListCardItem[] = [
  {
    id: "ev-1",
    event: {
      month: "OCT",
      day: 14,
      title: "Dhriti Global Product Keynote 2026",
      date: "Oct 14, 2026",
      time: "10:00 AM - 11:30 AM",
    },
    tags: [{ label: "Main Auditorium", type: "info" }],
  },
  {
    id: "ev-2",
    event: {
      month: "OCT",
      day: 18,
      title: "Flow Engine Engineering All-Hands",
      date: "Oct 18, 2026",
      time: "02:00 PM - 03:00 PM",
    },
    tags: [{ label: "Conference Room A", type: "info" }],
  },
  {
    id: "ev-3",
    event: {
      month: "NOV",
      day: "02",
      title: "Enterprise Architecture Review & Security Audit",
      date: "Nov 02, 2026",
      time: "09:00 AM - 12:00 PM",
    },
    tags: [{ label: "Online (Connect Video)", type: "info" }],
  },
  {
    id: "ev-4",
    event: {
      month: "NOV",
      day: 15,
      title: "Pulse Real-time Analytics Workshop",
      date: "Nov 15, 2026",
      time: "03:30 PM - 05:00 PM",
    },
    tags: [{ label: "Training Lab 2", type: "info" }],
  },
];

export const EventListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<CalendarMonthRounded />}
      headerIconColor="#8B5CF6"
      headerIconBgColor="rgba(139, 92, 246, 0.08)"
      headerIconBorderColor="rgba(139, 92, 246, 0.2)"
      title="Events"
      columns={["event", "tags", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[{ label: "Add new event" }, { label: "Sync Google Calendar" }, { label: "Calendar settings" }]}
      rowMenuItems={() => (
        <>
          <MenuItem>View event details</MenuItem>
          <MenuItem>RSVP / Join call</MenuItem>
          <MenuItem>Copy meeting link</MenuItem>
        </>
      )}
      items={eventItems}
    />
  ),
};

// ============================================================================
// 13. PROGRESS OVERVIEW CARD
// ============================================================================
const progressOverviewItems: ListCardItem[] = [
  {
    id: "prog-1",
    primaryText: {
      title: "Core Platform API Gateway Migration",
      description: "Zero-downtime routing cutover to Envoy",
    },
    progress: { value: 78, showPercentage: true, color: "primary" },
    status: { label: "In Progress", type: "warning" },
  },
  {
    id: "prog-2",
    primaryText: {
      title: "SOC 2 Type II Compliance Audit",
      description: "Controls validation and evidence collection",
    },
    progress: { value: 100, showPercentage: true, color: "success" },
    status: { label: "Completed", type: "success" },
  },
  {
    id: "prog-3",
    primaryText: {
      title: "Nexus Multi-tenant Vector Indexing",
      description: "HNSW graph optimization on pgvector",
    },
    progress: { value: 45, showPercentage: true, color: "info" },
    status: { label: "In Progress", type: "warning" },
  },
  {
    id: "prog-4",
    primaryText: {
      title: "Atlas WorkOS Resource Capacity Planner",
      description: "Gantt view and resource allocation engine",
    },
    progress: { value: 0, showPercentage: true, color: "inherit" },
    status: { label: "Not Started", type: "inherit" },
  },
];

export const ProgressOverviewCard: Story = {
  render: () => (
    <ListCard
      headerImage={<PieChartRounded />}
      headerIconColor="#3B82F6"
      headerIconBgColor="rgba(59, 130, 246, 0.08)"
      headerIconBorderColor="rgba(59, 130, 246, 0.2)"
      title="Progress"
      columns={["primaryText", "progress", "status", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[
        { label: "Progress dashboard" },
        { label: "Generate status report" },
        { label: "Set quarterly OKRs" },
      ]}
      rowMenuItems={() => (
        <>
          <MenuItem>View roadmap</MenuItem>
          <MenuItem>Update progress</MenuItem>
          <MenuItem>Assign team</MenuItem>
        </>
      )}
      items={progressOverviewItems}
    />
  ),
};

// ============================================================================
// 14. CONTACT LIST CARD
// ============================================================================
const contactListItems: ListCardItem[] = [
  {
    id: "con-1",
    user: {
      name: "Eleanor Vance",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      subtitleType: "none",
    },
    email: "eleanor.vance@dhriti.io",
    mobile: "+1 (555) 392-8190",
  },
  {
    id: "con-2",
    user: {
      name: "Benjamin Cole",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      subtitleType: "none",
    },
    email: "benjamin.cole@dhriti.io",
    mobile: "+1 (555) 748-2910",
  },
  {
    id: "con-3",
    user: {
      name: "Hannah Abbott",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      subtitleType: "none",
    },
    email: "hannah.abbott@dhriti.io",
    mobile: "+1 (555) 839-1029",
  },
  {
    id: "con-4",
    user: {
      name: "Oliver Queen",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      subtitleType: "none",
    },
    email: "oliver.queen@dhriti.io",
    mobile: "+1 (555) 920-3847",
  },
];

export const ContactListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<CallRounded />}
      headerIconColor="#10B981"
      headerIconBgColor="rgba(16, 185, 129, 0.08)"
      headerIconBorderColor="rgba(16, 185, 129, 0.2)"
      title="Contacts List"
      columns={["user", "email", "mobile", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[
        { label: "Import contacts (vCard/CSV)" },
        { label: "Export contacts" },
        { label: "Sync mobile directory" },
      ]}
      rowMenuItems={() => (
        <>
          <MenuItem>Call contact</MenuItem>
          <MenuItem>Send email</MenuItem>
          <MenuItem>Edit contact details</MenuItem>
        </>
      )}
      items={contactListItems}
    />
  ),
};

// ============================================================================
// 15. TAG / LABEL LIST CARD
// ============================================================================
const tagListItems: ListCardItem[] = [
  {
    id: "tag-1",
    primaryText: {
      title: "UI Components & Design System",
      description: "Reusable primitives, tokens, storybook",
    },
    tags: [
      { label: "React 19", type: "info" },
      { label: "MUI v9", type: "primary" },
      { label: "TypeScript", type: "warning" },
      { label: "Tailwind", type: "success" },
      { label: "Tokens", type: "error" },
    ],
    numeric: { value: 42, label: "components" },
  },
  {
    id: "tag-2",
    primaryText: {
      title: "Marketing & Brand Assets",
      description: "Logos, vector badges, keynote decks",
    },
    tags: [
      { label: "Logos", type: "error" },
      { label: "Decks", type: "warning" },
      { label: "Typography", type: "info" },
      { label: "Colors", type: "success" },
    ],
    numeric: { value: 18, label: "files" },
  },
  {
    id: "tag-3",
    primaryText: {
      title: "Product Documentation & RFCs",
      description: "Architecture decisions, schemas, guides",
    },
    tags: [
      { label: "Architecture", type: "primary" },
      { label: "API", type: "info" },
      { label: "Auth", type: "success" },
      { label: "Kafka", type: "warning" },
      { label: "Prisma", type: "error" },
    ],
    numeric: { value: 35, label: "documents" },
  },
  {
    id: "tag-4",
    primaryText: {
      title: "Engineering Automation Tasks",
      description: "CI/CD pipelines, docker builds, tests",
    },
    tags: [
      { label: "Turbo", type: "warning" },
      { label: "GitHub Actions", type: "info" },
      { label: "Docker", type: "primary" },
      { label: "Terraform", type: "success" },
    ],
    numeric: { value: 27, label: "pipelines" },
  },
];

export const TagLabelListCard: Story = {
  render: () => (
    <ListCard
      headerImage={<LabelRounded />}
      headerIconColor="#EC4899"
      headerIconBgColor="rgba(236, 72, 153, 0.08)"
      headerIconBorderColor="rgba(236, 72, 153, 0.2)"
      title="Tags / Labels"
      columns={["primaryText", "tags", "numeric", "actions"]}
      viewAll={{ label: "View all" }}
      headerMenuItems={[
        { label: "Create tag group" },
        { label: "Manage tag taxonomy" },
        { label: "Tag usage analytics" },
      ]}
      rowMenuItems={() => (
        <>
          <MenuItem>Edit tag group</MenuItem>
          <MenuItem>Add tags</MenuItem>
          <MenuItem sx={{ color: "error.main" }}>Delete group</MenuItem>
        </>
      )}
      items={tagListItems}
    />
  ),
};
