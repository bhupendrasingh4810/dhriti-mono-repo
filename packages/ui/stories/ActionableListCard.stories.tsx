import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import FolderRounded from "@mui/icons-material/FolderRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import WarningRounded from "@mui/icons-material/WarningRounded";
import MoreVert from "@mui/icons-material/MoreVert";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { ActionableListCard, type ActionableListItem } from "../src/components/custom/TableListCard";

const items: ActionableListItem[] = [
  { id: 1, title: "John Doe", description: "Frontend Engineer", metadata: "Active now", leading: <PersonRounded color="primary" />, action: <Chip label="Active" color="success" size="small" /> },
  { id: 2, title: "Product roadmap", description: "Updated 2 hours ago", metadata: "12 tasks", leading: <FolderRounded color="primary" />, action: <IconButton size="small" aria-label="More actions"><MoreVertRounded /></IconButton> },
  { id: 3, title: "Review deployment", description: "Production release", metadata: "Due today", leading: <WarningRounded color="warning" />, action: <Button size="small">Review</Button> },
];

const taskItems: ActionableListItem[] = [
  { id: "task-1", title: "Prepare Q4 launch plan", priority: "high", dueIn: "Due in 2 days", assigneeInitials: "AB" },
  { id: "task-2", title: "Review design handoff", priority: "medium", dueIn: "Due in 1 week", assigneeInitials: "SK" },
  { id: "task-3", title: "Update onboarding checklist", priority: "low", dueIn: "Due in 2 weeks", assigneeInitials: "JM" },
  { id: "task-4", title: "Conduct user interviews", priority: "high", dueIn: "Due in 3 days", assigneeInitials: "LM" },
  { id: "task-5", title: "Finalize marketing strategy", priority: "medium", dueIn: "Due in 1 week", assigneeInitials: "NP" },
];

const headerControls = (
  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
    <Tooltip title="Archive"><IconButton size="small" aria-label="Archive"><ArchiveOutlined fontSize="small" /></IconButton></Tooltip>
    <Tooltip title="Schedule"><IconButton size="small" aria-label="Schedule"><AccessTimeOutlined fontSize="small" /></IconButton></Tooltip>
    <Tooltip title="Delete"><IconButton size="small" aria-label="Delete"><DeleteRounded fontSize="small" /></IconButton></Tooltip>
    <Tooltip title="More actions"><IconButton size="small" aria-label="More actions"><MoreVert fontSize="small" /></IconButton></Tooltip>
  </Stack>
);

const meta = {
  title: "UI Blocks/ListCard/ActionableListCard",
  component: ActionableListCard,
  parameters: { layout: "centered" },
  args: {
    title: "Tasks",
    subtitle: "3 open",
    layout: "tasks",
    items: taskItems,
    headerControls,
  },
  argTypes: {
    items: { control: false },
    headerAction: { control: false },
    footer: { control: false },
    emptyState: { control: false },
    sx: { control: false },
  },
} satisfies Meta<typeof ActionableListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeaderAction: Story = { args: { headerControls } };
export const WithFooter: Story = { args: { footer: <Button fullWidth>View activity</Button> } };
export const Loading: Story = { args: { loading: true, loadingRows: 5 } };
export const Empty: Story = { args: { items: [], emptyState: "No notifications yet" } };
export const ActionableList: Story = {
  args: {
    items: taskItems,
  },
  render: (args) => {
    const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
    return (
      <ActionableListCard
        {...args}
        selectable
        selectedIds={selectedIds}
        onItemToggle={(item, selected) => {
          setSelectedIds((current) => selected
            ? [...current, item.id]
            : current.filter((id) => id !== item.id));
        }}
        rowMenuItems={(item, context) => (
          context.selectedIds.length > 1 ? (
            <MenuItem>Apply action to {context.selectedIds.length} tasks</MenuItem>
          ) : (
            <MenuItem>Open {typeof item.title === "string" ? item.title : "task"}</MenuItem>
          )
        )}
      />
    );
  },
};