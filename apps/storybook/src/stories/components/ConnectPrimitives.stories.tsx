import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AddRounded,
  DeleteOutlineRounded,
  EditRounded,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import {
  ConnectCascadingMenu,
  ConnectMessageHoverActions,
  ConnectReactionUsersList,
  ConnectUserDetailsCard,
  type ConnectCascadingMenuItem,
} from "@dhriti/ui";

const meta: Meta = {
  title: "Components/Connect Primitives",
};

export default meta;
type Story = StoryObj;

const menuItems: ConnectCascadingMenuItem[] = [
  { id: "add", label: "Add member", icon: <AddRounded fontSize="small" /> },
  {
    id: "edit",
    label: "Edit team",
    icon: <EditRounded fontSize="small" />,
    closeOnClick: false,
    children: [
      {
        id: "permissions",
        label: "Permissions",
        closeOnClick: false,
        children: [
          {
            id: "role-access",
            label: "Role access",
            closeOnClick: false,
            children: [{ id: "admin-only", label: "Admin only" }],
          },
        ],
      },
    ],
  },
  { id: "delete", label: "Delete", icon: <DeleteOutlineRounded fontSize="small" />, danger: true },
];

export const UserDetailsCard: Story = {
  render: () => (
    <Box sx={{ p: 4, bgcolor: "#f8fafc" }}>
      <ConnectUserDetailsCard
        avatar="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
        displayName="Priya Verma"
        jobTitle="Engineering Manager"
        location="Pune, India"
      />
    </Box>
  ),
};

export const ReactionUsers: Story = {
  render: () => (
    <Box sx={{ p: 4, bgcolor: "#f8fafc" }}>
      <ConnectReactionUsersList
        emoji="👍"
        users={[
          {
            id: "1",
            avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
            displayName: "Priya Verma",
            jobTitle: "Engineering Manager",
          },
          {
            id: "2",
            avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg",
            displayName: "Rahul Mehta",
            jobTitle: "Senior Software Engineer",
          },
        ]}
      />
    </Box>
  ),
};

export const HoverActions: Story = {
  render: () => (
    <Box sx={{ p: 8, bgcolor: "#f8fafc", position: "relative", height: 200 }}>
      <Box sx={{ position: "absolute", top: 130, left: 80, width: 320, p: 1.5, borderRadius: 2, bgcolor: "#f1f5f9", border: "1px solid #e5e7eb" }}>
        Sample message bubble
      </Box>
      <Box sx={{ position: "absolute", top: 130, left: 80, width: 320 }}>
        <ConnectMessageHoverActions
          open
          align="left"
          onQuickReaction={() => {}}
          onOpenEmoji={() => {}}
          onQuote={() => {}}
          onOpenMenu={() => {}}
        />
      </Box>
    </Box>
  ),
};

export const MenuPrimitive: Story = {
  render: () => (
    <Box sx={{ p: 4, bgcolor: "#f8fafc", color: "#64748b", fontSize: 14 }}>
      ConnectCascadingMenu is interaction-based. Run this in app flow where an anchor element exists.
      <ConnectCascadingMenu anchorEl={null} open={false} onClose={() => {}} items={menuItems} maxDepth={4} />
    </Box>
  ),
};
