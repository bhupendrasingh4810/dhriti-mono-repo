import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";

// MUI Icons
import TableChartRounded from "@mui/icons-material/TableChartRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import FileDownloadRounded from "@mui/icons-material/FileDownloadRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import PermMediaRounded from "@mui/icons-material/PermMediaRounded";
import ConfirmationNumberRounded from "@mui/icons-material/ConfirmationNumberRounded";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import ShareRounded from "@mui/icons-material/ShareRounded";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import CallRounded from "@mui/icons-material/CallRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";

import { DTable, type DTableColumn, type DTableFilter } from "../src/components/custom/DTable";

/**
 * # DTable Component Documentation
 *
 * `DTable` is an enterprise-grade, responsive Table & Card Grid system with:
 * - 🔍 **Enterprise Search Bar** with shortcut indication and quick-clear.
 * - 🔀 **List/Table View and Card Grid View Toggle** for flexible presentation.
 * - 🏷️ **Dynamic Filter System** (Select, Multi-select, Search, Boolean, and Custom).
 * - ↕️ **Column Headings with Sort Indicators** (Ascending / Descending / Multi-field).
 * - 📄 **Pagination System** (Rows per page, total count, fast page jumper).
 * - ☑️ **Row Selection & Bulk Action Bar** (Batch operations on selected rows).
 * - 📱 **Fully Responsive Layout** (Horizontal scroll container for table, auto-fit grid for cards).
 */

const meta = {
  title: "UI Blocks/DTable",
  component: DTable,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Enterprise Table and Card Grid component with built-in search, customizable filters, sortable column headers, pagination, view toggles, and bulk operations.",
      },
    },
  },
  args: {
    columns: [],
    items: [],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 1080, maxWidth: "100%", padding: "16px 0" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 1. DEFAULT ENTERPRISE TASKS TABLE
// ============================================================================

interface TaskRecord {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  assignee: {
    name: string;
    avatarUrl?: string;
    initials?: string;
    avatarColor?: string;
    subtitleType: "designation";
    designation: string;
  };
  progress: {
    value: number;
    color: "primary" | "warning" | "success" | "error";
  };
  dueDate: string;
  status: {
    label: string;
    type: "error" | "warning" | "success" | "info" | "inherit";
  };
}

const taskColumns: DTableColumn<TaskRecord>[] = [
  {
    id: "title",
    label: "Task & Description",
    sortable: true,
    minWidth: 240,
    type: "primaryText",
    cardRole: "header",
  },
  {
    id: "priority",
    label: "Priority",
    sortable: true,
    minWidth: 100,
    type: "status",
    cardRole: "badge",
  },
  {
    id: "assignee",
    label: "Assignee",
    sortable: true,
    minWidth: 180,
    type: "user",
    cardRole: "body",
  },
  {
    id: "progress",
    label: "Progress",
    sortable: true,
    minWidth: 140,
    type: "progress",
    cardRole: "footer",
  },
  {
    id: "dueDate",
    label: "Due Date",
    sortable: true,
    minWidth: 130,
    type: "dateTime",
    cardRole: "body",
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    minWidth: 110,
    type: "status",
    cardRole: "badge",
  },
  {
    id: "actions",
    label: "Actions",
    align: "right",
    width: 60,
    type: "actions",
    cardRole: "footer",
  },
];

const taskFilters: DTableFilter[] = [
  {
    id: "priority",
    label: "Priority",
    type: "select",
    options: [
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" },
    ],
  },
  {
    id: "status",
    label: "Status",
    type: "multi-select",
    options: [
      { label: "In Progress", value: "In Progress" },
      { label: "In Review", value: "In Review" },
      { label: "Completed", value: "Completed" },
      { label: "Blocked", value: "Blocked" },
    ],
  },
];

const sampleTaskRecords: TaskRecord[] = [
  {
    id: "TSK-101",
    title: "Implement SSO SAML 2.0 Integration",
    description: "Support Okta, Azure AD and Google Workspace",
    priority: "high",
    assignee: {
      name: "Sophia Martinez",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      subtitleType: "designation",
      designation: "Staff Software Engineer",
    },
    progress: { value: 65, color: "primary" },
    dueDate: "Due in 2 days",
    status: { label: "In Progress", type: "warning" },
  },
  {
    id: "TSK-102",
    title: "Migrate Postgres Schema for Vector Index",
    description: "Add HNSW vector indexes to pgvector store",
    priority: "high",
    assignee: {
      name: "Lucas Brennan",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      subtitleType: "designation",
      designation: "DevOps Engineer",
    },
    progress: { value: 90, color: "success" },
    dueDate: "Due in 3 days",
    status: { label: "In Review", type: "info" },
  },
  {
    id: "TSK-103",
    title: "Update Design Tokens in @dhriti/ui",
    description: "Align semantic contrast ratios to WCAG AAA",
    priority: "medium",
    assignee: {
      name: "Aaliyah Patel",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      subtitleType: "designation",
      designation: "Design Systems Architect",
    },
    progress: { value: 100, color: "success" },
    dueDate: "Yesterday",
    status: { label: "Completed", type: "success" },
  },
  {
    id: "TSK-104",
    title: "Conduct Pulse Analytics Q3 Latency Benchmark",
    description: "Profile aggregation pipeline query speeds",
    priority: "low",
    assignee: {
      name: "Marcus Vance",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      subtitleType: "designation",
      designation: "Product Lead",
    },
    progress: { value: 20, color: "error" },
    dueDate: "Due in 2 weeks",
    status: { label: "Blocked", type: "error" },
  },
  {
    id: "TSK-105",
    title: "Flow Webhook Retry Engine Optimization",
    description: "Implement exponential backoff on 5xx failures",
    priority: "medium",
    assignee: {
      name: "David Kim",
      initials: "DK",
      avatarColor: "#6366F1",
      subtitleType: "designation",
      designation: "Lead Backend Designer",
    },
    progress: { value: 45, color: "primary" },
    dueDate: "Due in 1 week",
    status: { label: "In Progress", type: "warning" },
  },
];

export const Default: Story = {
  name: "Enterprise Tasks Table",
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Array<string | number>>(["TSK-101"]);

    return (
      <DTable
        headerIcon={<TableChartRounded />}
        headerIconColor="#0284C7"
        headerIconBg="#E0F2FE"
        title="Engineering Tasks & Sprints"
        subtitle="Sprint 44 • 12 active tasks"
        columns={taskColumns}
        items={sampleTaskRecords}
        filters={taskFilters}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={(ids) => setSelectedIds(ids)}
        bulkActions={[
          {
            id: "archive",
            label: "Archive",
            icon: <ArchiveOutlined fontSize="small" />,
            onClick: (ids) => alert(`Archiving: ${ids.join(", ")}`),
          },
          {
            id: "delete",
            label: "Delete",
            color: "error",
            icon: <DeleteRounded fontSize="small" />,
            onClick: (ids) => alert(`Deleting: ${ids.join(", ")}`),
          },
        ]}
        headerButtons={[
          {
            label: "Export CSV",
            variant: "outlined",
            color: "inherit",
            icon: <FileDownloadRounded fontSize="small" />,
            onClick: () => alert("Exporting records..."),
          },
          {
            label: "New Task",
            variant: "contained",
            color: "primary",
            icon: <AddRounded fontSize="small" />,
            onClick: () => alert("Creating task..."),
          },
        ]}
        rowMenuItems={(item) => (
          <>
            <MenuItem onClick={() => alert(`Editing: ${item.title}`)}>
              <EditRounded fontSize="small" style={{ marginRight: 8 }} /> Edit Task
            </MenuItem>
            <MenuItem onClick={() => alert(`Sharing: ${item.title}`)}>
              <SendRounded fontSize="small" style={{ marginRight: 8 }} /> Share Link
            </MenuItem>
            <MenuItem sx={{ color: "error.main" }} onClick={() => alert(`Deleting: ${item.title}`)}>
              <DeleteRounded fontSize="small" style={{ marginRight: 8 }} /> Delete
            </MenuItem>
          </>
        )}
      />
    );
  },
};

// ============================================================================
// 2. USER & TEAM DIRECTORY
// ============================================================================

interface UserRecord {
  id: string;
  user: {
    name: string;
    avatarUrl?: string;
    initials?: string;
    avatarColor?: string;
    subtitleType: "team";
    designation: string;
    teamName: string;
  };
  role: string;
  email: string;
  mobile: string;
  status: {
    label: string;
    type: "success" | "warning" | "error" | "info" | "inherit";
  };
  lastActive: string;
}

const userColumns: DTableColumn<UserRecord>[] = [
  {
    id: "user",
    label: "Team Member",
    sortable: true,
    minWidth: 200,
    type: "user",
    cardRole: "header",
  },
  {
    id: "role",
    label: "Role",
    sortable: true,
    minWidth: 130,
    cardRole: "body",
  },
  {
    id: "email",
    label: "Email Address",
    sortable: true,
    minWidth: 190,
    type: "email",
    cardRole: "body",
  },
  {
    id: "mobile",
    label: "Phone Number",
    minWidth: 150,
    type: "mobile",
    cardRole: "body",
  },
  {
    id: "status",
    label: "Work Status",
    sortable: true,
    minWidth: 110,
    type: "status",
    cardRole: "badge",
  },
  {
    id: "lastActive",
    label: "Last Seen",
    sortable: true,
    minWidth: 110,
    type: "dateTime",
    cardRole: "footer",
  },
  {
    id: "actions",
    label: "",
    align: "right",
    width: 60,
    type: "actions",
    cardRole: "footer",
  },
];

const sampleUserRecords: UserRecord[] = [
  {
    id: "usr-1",
    user: {
      name: "Sophia Martinez",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      subtitleType: "team",
      designation: "Staff Software Engineer",
      teamName: "Core Platform",
    },
    role: "Admin",
    email: "sophia.martinez@dhriti.io",
    mobile: "+1 (555) 234-5678",
    status: { label: "Active", type: "success" },
    lastActive: "just now",
  },
  {
    id: "usr-2",
    user: {
      name: "Marcus Vance",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      subtitleType: "team",
      designation: "Product Lead",
      teamName: "Connect & Chat",
    },
    role: "Manager",
    email: "marcus.vance@dhriti.io",
    mobile: "+1 (555) 876-5432",
    status: { label: "In Meeting", type: "warning" },
    lastActive: "15m ago",
  },
  {
    id: "usr-3",
    user: {
      name: "Aaliyah Patel",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      subtitleType: "team",
      designation: "Design Systems Architect",
      teamName: "Dhriti UI",
    },
    role: "Member",
    email: "aaliyah.patel@dhriti.io",
    mobile: "+1 (555) 432-1098",
    status: { label: "Sharing Screen", type: "info" },
    lastActive: "1h ago",
  },
  {
    id: "usr-4",
    user: {
      name: "Lucas Brennan",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      subtitleType: "team",
      designation: "DevOps Engineer",
      teamName: "Infrastructure",
    },
    role: "Member",
    email: "lucas.brennan@dhriti.io",
    mobile: "+1 (555) 912-3849",
    status: { label: "Busy", type: "error" },
    lastActive: "3h ago",
  },
  {
    id: "usr-5",
    user: {
      name: "Emma Watson",
      avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      subtitleType: "team",
      designation: "Security Specialist",
      teamName: "IAM & Auth",
    },
    role: "Auditor",
    email: "emma.watson@dhriti.io",
    mobile: "+1 (555) 674-8291",
    status: { label: "Away", type: "inherit" },
    lastActive: "Yesterday",
  },
];

export const UserDirectory: Story = {
  name: "Team Members Directory",
  render: () => (
    <DTable
      headerIcon={<GroupRounded />}
      headerIconColor="#8B5CF6"
      headerIconBg="#F3E8FF"
      title="Team Members Directory"
      subtitle="5 total workspace contributors"
      columns={userColumns}
      items={sampleUserRecords}
      filters={[
        {
          id: "role",
          label: "Role",
          type: "select",
          options: [
            { label: "Admin", value: "Admin" },
            { label: "Manager", value: "Manager" },
            { label: "Member", value: "Member" },
            { label: "Auditor", value: "Auditor" },
          ],
        },
      ]}
      headerButtons={[
        {
          label: "Invite Member",
          variant: "contained",
          color: "primary",
          icon: <AddRounded fontSize="small" />,
          onClick: () => alert("Inviting member..."),
        },
      ]}
      rowMenuItems={(item) => (
        <>
          <MenuItem onClick={() => alert(`Viewing profile: ${item.user.name}`)}>
            <VisibilityRounded fontSize="small" style={{ marginRight: 8 }} /> View Profile
          </MenuItem>
          <MenuItem onClick={() => alert(`Emailing: ${item.email}`)}>
            <MailOutlineRounded fontSize="small" style={{ marginRight: 8 }} /> Send Email
          </MenuItem>
          <MenuItem onClick={() => alert(`Calling: ${item.mobile}`)}>
            <CallRounded fontSize="small" style={{ marginRight: 8 }} /> Call Member
          </MenuItem>
          <MenuItem sx={{ color: "error.main" }} onClick={() => alert(`Deactivating: ${item.user.name}`)}>
            <DeleteRounded fontSize="small" style={{ marginRight: 8 }} /> Deactivate
          </MenuItem>
        </>
      )}
    />
  ),
};

// ============================================================================
// 3. ORDERS & FINANCIAL TRANSACTIONS
// ============================================================================

interface OrderRecord {
  id: string;
  referenceId: { id: string; prefix?: string };
  customer: {
    name: string;
    avatarUrl?: string;
    subtitleType: "designation";
    designation: string;
  };
  date: string;
  numeric: { value: string; label?: string };
  status: {
    label: string;
    type: "success" | "info" | "warning" | "error";
  };
}

const orderColumns: DTableColumn<OrderRecord>[] = [
  {
    id: "referenceId",
    label: "Order Number",
    sortable: true,
    minWidth: 140,
    type: "referenceId",
    cardRole: "header",
  },
  {
    id: "customer",
    label: "Customer",
    sortable: true,
    minWidth: 180,
    type: "user",
    cardRole: "body",
  },
  {
    id: "date",
    label: "Order Date",
    sortable: true,
    minWidth: 130,
    type: "dateTime",
    cardRole: "body",
  },
  {
    id: "numeric",
    label: "Total Amount",
    sortable: true,
    align: "right",
    minWidth: 120,
    type: "numeric",
    cardRole: "body",
  },
  {
    id: "status",
    label: "Fulfillment Status",
    sortable: true,
    minWidth: 120,
    type: "status",
    cardRole: "badge",
  },
  {
    id: "actions",
    label: "",
    align: "right",
    width: 60,
    type: "actions",
    cardRole: "footer",
  },
];

const sampleOrderRecords: OrderRecord[] = [
  {
    id: "ord-1",
    referenceId: { id: "9482", prefix: "#ORD-" },
    customer: {
      name: "Eleanor Vance",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      subtitleType: "designation",
      designation: "Acme Corp",
    },
    date: "Sep 11, 2026",
    numeric: { value: "$1,250.00", label: "USD" },
    status: { label: "Delivered", type: "success" },
  },
  {
    id: "ord-2",
    referenceId: { id: "9481", prefix: "#ORD-" },
    customer: {
      name: "Benjamin Cole",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      subtitleType: "designation",
      designation: "Starlight Inc",
    },
    date: "Sep 10, 2026",
    numeric: { value: "$3,490.00", label: "USD" },
    status: { label: "Shipped", type: "info" },
  },
  {
    id: "ord-3",
    referenceId: { id: "9480", prefix: "#ORD-" },
    customer: {
      name: "Hannah Abbott",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      subtitleType: "designation",
      designation: "Global Logistics",
    },
    date: "Sep 09, 2026",
    numeric: { value: "$890.00", label: "USD" },
    status: { label: "Processing", type: "warning" },
  },
  {
    id: "ord-4",
    referenceId: { id: "9479", prefix: "#ORD-" },
    customer: {
      name: "Oliver Queen",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      subtitleType: "designation",
      designation: "Queen Industries",
    },
    date: "Sep 07, 2026",
    numeric: { value: "$2,100.00", label: "USD" },
    status: { label: "Cancelled", type: "error" },
  },
];

export const OrdersTable: Story = {
  name: "Orders & Billing Table",
  render: () => (
    <DTable
      headerIcon={<ShoppingCartRounded />}
      headerIconColor="#10B981"
      headerIconBg="#D1FAE5"
      title="Customer Orders"
      subtitle="4 recent transactions"
      columns={orderColumns}
      items={sampleOrderRecords}
      rowMenuItems={(item) => (
        <>
          <MenuItem onClick={() => alert(`Viewing order ${item.referenceId.prefix ?? ""}${item.referenceId.id}`)}>
            <ReceiptLongRounded fontSize="small" style={{ marginRight: 8 }} /> View Invoice
          </MenuItem>
          <MenuItem onClick={() => alert(`Sharing receipt for ${item.customer.name}`)}>
            <ShareRounded fontSize="small" style={{ marginRight: 8 }} /> Share Receipt
          </MenuItem>
          <MenuItem onClick={() => alert(`Emailing receipt to ${item.customer.name}`)}>
            <MailOutlineRounded fontSize="small" style={{ marginRight: 8 }} /> Resend Email
          </MenuItem>
          <MenuItem sx={{ color: "error.main" }} onClick={() => alert(`Refunding order ${item.referenceId.id}`)}>
            <DeleteRounded fontSize="small" style={{ marginRight: 8 }} /> Cancel & Refund
          </MenuItem>
        </>
      )}
    />
  ),
};

// ============================================================================
// 4. MEDIA ASSETS (CARD VIEW DEFAULT)
// ============================================================================

interface MediaRecord {
  id: string;
  media: {
    src: string;
    title: string;
    updatedBy: string;
    updatedAt: string;
  };
  fileSize: string;
  tags: string[];
  status: {
    label: string;
    type: "success" | "info" | "warning";
  };
}

const mediaColumns: DTableColumn<MediaRecord>[] = [
  {
    id: "media",
    label: "Asset Preview & Title",
    sortable: true,
    minWidth: 240,
    type: "media",
    cardRole: "media",
  },
  {
    id: "fileSize",
    label: "File Size",
    sortable: true,
    minWidth: 100,
    cardRole: "body",
  },
  {
    id: "tags",
    label: "Tags",
    minWidth: 160,
    type: "tags",
    cardRole: "body",
  },
  {
    id: "status",
    label: "Status",
    sortable: true,
    minWidth: 110,
    type: "status",
    cardRole: "badge",
  },
  {
    id: "actions",
    label: "",
    align: "right",
    width: 60,
    type: "actions",
    cardRole: "footer",
  },
];

const sampleMediaRecords: MediaRecord[] = [
  {
    id: "med-1",
    media: {
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=260",
      title: "q4_brand_identity_dark.png",
      updatedBy: "Sarah Jenkins",
      updatedAt: "2 hours ago",
    },
    fileSize: "4.8 MB",
    tags: ["Brand", "Identity", "Design"],
    status: { label: "Approved", type: "success" },
  },
  {
    id: "med-2",
    media: {
      src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=260",
      title: "mobile_app_onboarding.mp4",
      updatedBy: "David Kim",
      updatedAt: "Yesterday",
    },
    fileSize: "28.4 MB",
    tags: ["Video", "Mobile", "Tutorial"],
    status: { label: "In Review", type: "warning" },
  },
  {
    id: "med-3",
    media: {
      src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=260",
      title: "architecture_diagram_v3.svg",
      updatedBy: "Alex Morgan",
      updatedAt: "3 days ago",
    },
    fileSize: "850 KB",
    tags: ["Architecture", "SVG", "Schema"],
    status: { label: "Published", type: "info" },
  },
  {
    id: "med-4",
    media: {
      src: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=260",
      title: "product_launch_hero.webp",
      updatedBy: "Elena Rostova",
      updatedAt: "1 week ago",
    },
    fileSize: "1.2 MB",
    tags: ["Hero", "Web", "Marketing"],
    status: { label: "Approved", type: "success" },
  },
];

export const MediaCardView: Story = {
  name: "Media Library (Card Grid Default)",
  render: () => (
    <DTable
      headerIcon={<PermMediaRounded />}
      headerIconColor="#F59E0B"
      headerIconBg="#FEF3C7"
      title="Media & Asset Library"
      subtitle="Switch between Card and Table view"
      columns={mediaColumns}
      items={sampleMediaRecords}
      defaultViewMode="card"
      rowMenuItems={(item) => (
        <>
          <MenuItem onClick={() => alert(`Previewing ${item.media.title}`)}>
            <VisibilityRounded fontSize="small" style={{ marginRight: 8 }} /> Preview Asset
          </MenuItem>
          <MenuItem onClick={() => alert(`Downloading ${item.media.title}`)}>
            <FileDownloadRounded fontSize="small" style={{ marginRight: 8 }} /> Download
          </MenuItem>
          <MenuItem onClick={() => alert(`Sharing link to ${item.media.title}`)}>
            <ShareRounded fontSize="small" style={{ marginRight: 8 }} /> Copy Link
          </MenuItem>
          <MenuItem sx={{ color: "error.main" }} onClick={() => alert(`Deleting ${item.media.title}`)}>
            <DeleteRounded fontSize="small" style={{ marginRight: 8 }} /> Delete Asset
          </MenuItem>
        </>
      )}
    />
  ),
};

// ============================================================================
// 5. SUPPORT TICKETS WITH SUITE APPS
// ============================================================================

interface TicketRecord {
  id: string;
  referenceId: { id: string };
  app: "Connect" | "Flow" | "Pulse" | "Atlas" | "Control";
  primaryText: { title: string; description: string };
  priority: "high" | "medium" | "low";
  status: { label: string; type: "error" | "warning" | "success" };
}

const ticketColumns: DTableColumn<TicketRecord>[] = [
  {
    id: "referenceId",
    label: "Ticket ID",
    sortable: true,
    minWidth: 120,
    type: "referenceId",
    cardRole: "header",
  },
  {
    id: "app",
    label: "Product App",
    sortable: true,
    minWidth: 100,
    type: "app",
    cardRole: "badge",
  },
  {
    id: "primaryText",
    label: "Issue Subject",
    sortable: true,
    minWidth: 260,
    type: "primaryText",
    cardRole: "header",
  },
  {
    id: "priority",
    label: "Priority",
    sortable: true,
    minWidth: 100,
    type: "status",
    cardRole: "badge",
  },
  {
    id: "status",
    label: "Ticket Status",
    sortable: true,
    minWidth: 110,
    type: "status",
    cardRole: "badge",
  },
  {
    id: "actions",
    label: "",
    align: "right",
    width: 60,
    type: "actions",
    cardRole: "footer",
  },
];

const sampleTicketRecords: TicketRecord[] = [
  {
    id: "tick-1",
    referenceId: { id: "DT-CO-1096" },
    app: "Connect",
    primaryText: {
      title: "Websocket reconnection loop in chat rooms",
      description: "Reported by Acme Global (Enterprise customer)",
    },
    priority: "high",
    status: { label: "Open", type: "error" },
  },
  {
    id: "tick-2",
    referenceId: { id: "DT-FL-1022" },
    app: "Flow",
    primaryText: {
      title: "Kafka consumer offset lag in webhook dispatcher",
      description: "Queue depth exceeded threshold of 5,000",
    },
    priority: "medium",
    status: { label: "In Progress", type: "warning" },
  },
  {
    id: "tick-3",
    referenceId: { id: "DT-PL-1140" },
    app: "Pulse",
    primaryText: {
      title: "Pulse query timeout on large historical ranges",
      description: "Query exceeded 30s timeout limit",
    },
    priority: "high",
    status: { label: "Open", type: "error" },
  },
  {
    id: "tick-4",
    referenceId: { id: "DT-CT-1075" },
    app: "Control",
    primaryText: {
      title: "SSO certificate rotation reminder for Azure tenant",
      description: "Cert expires in 14 days",
    },
    priority: "low",
    status: { label: "Resolved", type: "success" },
  },
];

export const SupportTickets: Story = {
  name: "Support Tickets & SLAs",
  render: () => (
    <DTable
      headerIcon={<ConfirmationNumberRounded />}
      headerIconColor="#EF4444"
      headerIconBg="#FEE2E2"
      title="Support Tickets Queue"
      subtitle="Enterprise customer requests"
      columns={ticketColumns}
      items={sampleTicketRecords}
      filters={[
        {
          id: "app",
          label: "Product App",
          type: "select",
          options: [
            { label: "Connect", value: "Connect" },
            { label: "Flow", value: "Flow" },
            { label: "Pulse", value: "Pulse" },
            { label: "Control", value: "Control" },
          ],
        },
        {
          id: "priority",
          label: "Priority",
          type: "select",
          options: [
            { label: "High", value: "high" },
            { label: "Medium", value: "medium" },
            { label: "Low", value: "low" },
          ],
        },
      ]}
      rowMenuItems={(item) => (
        <>
          <MenuItem onClick={() => alert(`Opening ticket ${item.referenceId.id}`)}>
            <VisibilityRounded fontSize="small" style={{ marginRight: 8 }} /> Open Ticket
          </MenuItem>
          <MenuItem onClick={() => alert(`Reassigning ${item.referenceId.id}`)}>
            <EditRounded fontSize="small" style={{ marginRight: 8 }} /> Reassign Priority
          </MenuItem>
          <MenuItem onClick={() => alert(`Sharing link to ${item.referenceId.id}`)}>
            <ShareRounded fontSize="small" style={{ marginRight: 8 }} /> Share Ticket
          </MenuItem>
          <MenuItem sx={{ color: "error.main" }} onClick={() => alert(`Closing ${item.referenceId.id}`)}>
            <DeleteRounded fontSize="small" style={{ marginRight: 8 }} /> Close Ticket
          </MenuItem>
        </>
      )}
    />
  ),
};

// ============================================================================
// 6. LOADING STATE
// ============================================================================

export const LoadingState: Story = {
  name: "Loading Skeleton State",
  render: () => (
    <DTable
      title="Loading Dataset..."
      subtitle="Please wait while records are fetched"
      columns={taskColumns}
      items={[]}
      loading={true}
      loadingRows={6}
    />
  ),
};

// ============================================================================
// 7. EMPTY STATE
// ============================================================================

export const EmptyState: Story = {
  name: "Custom Empty State",
  render: () => (
    <DTable
      title="Archived Records"
      subtitle="No archived items available"
      columns={taskColumns}
      items={[]}
      emptyState={{
        title: "No Archived Items Found",
        description: "Items archived within the last 30 days will appear here automatically.",
        actionLabel: "Go to Active Tasks",
        onAction: () => alert("Navigating to active tasks..."),
      }}
    />
  ),
};
