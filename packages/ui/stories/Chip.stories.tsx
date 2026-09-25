/**
 * Chip Component Stories
 *
 * Comprehensive Storybook documentation for Dhriti Chip component.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "../src/components/mui";
import { Check as CheckIcon, Favorite as FavoriteIcon, Star as StarIcon } from "@mui/icons-material";

const meta = {
  title: "Components/Chip",
  component: Chip,

  parameters: {
    layout: "centered",
  },

  args: {
    label: "Chip Label",
    variant: "filled",
    size: "medium",
    color: "default",
  },

  argTypes: {
    label: {
      control: "text",
    },
    variant: {
      control: "select",
      options: ["filled", "outlined"],
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    color: {
      control: "select",
      options: ["default", "primary", "secondary", "error", "info", "success", "warning"],
    },
    disabled: {
      control: "boolean",
    },
    startIcon: {
      control: false,
    },
    endIcon: {
      control: false,
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof Chip>;

// ============================================================================
// FILLED
// ============================================================================

// /**
//  * Default filled chip.
//  */
// export const FilledDefault: Story = {
//   name: "Default (Filled)",
//   args: {
//     variant: "filled",
//     color: "default",
//     label: "Default",
//   },
// };

/**
 * Filled chips with all colors.
 */
export const FilledAllColors: Story = {
  name: "All Colors (Filled)",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="filled" color="default" label="Default" />
      <Chip variant="filled" color="primary" label="Primary" />
      <Chip variant="filled" color="secondary" label="Secondary" />
      <Chip variant="filled" color="error" label="Error" />
      <Chip variant="filled" color="info" label="Info" />
      <Chip variant="filled" color="success" label="Success" />
      <Chip variant="filled" color="warning" label="Warning" />
    </div>
  ),
};

// ============================================================================
// OUTLINED
// ============================================================================

// /**
//  * Default outlined chip.
//  */
// export const OutlinedDefault: Story = {
//   name: "Default (Outlined)",
//   args: {
//     variant: "outlined",
//     color: "default",
//     label: "Default",
//   },
// };

/**
 * Outlined chips with all colors.
 */
export const OutlinedAllColors: Story = {
  name: "All Colors (Outlined)",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="outlined" color="default" label="Default" />
      <Chip variant="outlined" color="primary" label="Primary" />
      <Chip variant="outlined" color="secondary" label="Secondary" />
      <Chip variant="outlined" color="error" label="Error" />
      <Chip variant="outlined" color="info" label="Info" />
      <Chip variant="outlined" color="success" label="Success" />
      <Chip variant="outlined" color="warning" label="Warning" />
    </div>
  ),
};

// ============================================================================
// CUSTOM OUTLINED ICON
// ============================================================================

export const OutlinedWithIcons: Story = {
  name: "With Icons",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="outlined" color="primary" label="Star" startIcon={<StarIcon />} />
      <Chip variant="outlined" color="secondary" label="Check" startIcon={<CheckIcon />} />
      <Chip variant="outlined" color="error" label="Favorite" startIcon={<FavoriteIcon />} />
      <Chip variant="outlined" color="success" label="Success" startIcon={<CheckIcon />} />
      <Chip variant="outlined" color="warning" label="Star" startIcon={<StarIcon />} />
    </div>
  ),
};

// ============================================================================
// DISABLED
// ============================================================================

export const DisabledAll: Story = {
  name: "All Disabled",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="filled" color="default" label="Default" disabled />
      <Chip variant="filled" color="primary" label="Primary" disabled />
      <Chip variant="filled" color="secondary" label="Secondary" disabled />
      <Chip variant="outlined" color="default" label="Default" disabled />
      <Chip variant="outlined" color="primary" label="Primary" disabled />
      <Chip variant="outlined" color="secondary" label="Secondary" disabled />
    </div>
  ),
};

// ============================================================================
// SIZES
// ============================================================================

export const SizesAllOutlined: Story = {
  name: "All Sizes (Outlined)",
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Chip variant="outlined" size="small" label="Small" />
      <Chip variant="outlined" size="medium" label="Medium" />
      <Chip variant="outlined" size="large" label="Large" />
    </div>
  ),
};

// ============================================================================
// WITH ICONS
// ============================================================================

/**
 * Chip with start icon.
 */
export const WithStartIcon: Story = {
  name: "With Start Icon",
  args: {
    variant: "filled",
    color: "primary",
    label: "Chip with Icon",
    startIcon: <StarIcon />,
  },
};

/**
 * Chip with end icon.
 */
export const WithEndIcon: Story = {
  name: "With End Icon",
  args: {
    variant: "filled",
    color: "secondary",
    label: "Chip with Icon",
    endIcon: <CheckIcon />,
  },
};

/**
 * Chips with different icons.
 */
export const WithIconsAll: Story = {
  name: "With Different Icons",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="filled" color="primary" label="Star" startIcon={<StarIcon />} />
      <Chip variant="filled" color="secondary" label="Check" startIcon={<CheckIcon />} />
      <Chip variant="filled" color="error" label="Favorite" startIcon={<FavoriteIcon />} />
      <Chip variant="outlined" color="primary" label="Star" startIcon={<StarIcon />} />
      <Chip variant="outlined" color="secondary" label="Check" startIcon={<CheckIcon />} />
    </div>
  ),
};

// ============================================================================
// CLICKABLE
// ============================================================================

/**
 * Clickable chip.
 */
export const Clickable: Story = {
  name: "Clickable",
  args: {
    variant: "filled",
    color: "primary",
    label: "Click me",
    onClick: () => alert("Chip clicked!"),
  },
};

/**
 * Clickable outlined chip.
 */
export const ClickableOutlined: Story = {
  name: "Clickable (Outlined)",
  args: {
    variant: "outlined",
    color: "primary",
    label: "Click me",
    onClick: () => alert("Chip clicked!"),
  },
};

// ============================================================================
// DELETABLE
// ============================================================================

/**
 * Deletable chip.
 */
export const Deletable: Story = {
  name: "Deletable",
  args: {
    variant: "filled",
    color: "primary",
    label: "Deletable Chip",
    onDelete: () => alert("Chip deleted!"),
  },
};

/**
 * Deletable outlined chip.
 */
export const DeletableOutlined: Story = {
  name: "Deletable (Outlined)",
  args: {
    variant: "outlined",
    color: "primary",
    label: "Deletable Chip",
    onDelete: () => alert("Chip deleted!"),
  },
};

// ============================================================================
// ENTERPRISE PATTERNS
// ============================================================================

/**
 * Filter chips.
 */
export const FilterChips: Story = {
  name: "Filter Chips",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="filled" color="primary" label="All" />
      <Chip variant="outlined" color="default" label="Active" />
      <Chip variant="outlined" color="default" label="Pending" />
      <Chip variant="outlined" color="default" label="Completed" />
      <Chip variant="outlined" color="default" label="Archived" />
    </div>
  ),
};

/**
 * Status chips.
 */
export const StatusChips: Story = {
  name: "Status Chips",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="filled" color="success" label="Active" startIcon={<CheckIcon />} />
      <Chip variant="filled" color="warning" label="Pending" />
      <Chip variant="filled" color="error" label="Inactive" />
      <Chip variant="filled" color="info" label="Processing" />
    </div>
  ),
};

/**
 * Tag chips.
 */
export const TagChips: Story = {
  name: "Tag Chips",
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip variant="outlined" color="default" label="React" />
      <Chip variant="outlined" color="default" label="TypeScript" />
      <Chip variant="outlined" color="default" label="MUI" />
      <Chip variant="outlined" color="default" label="Node.js" />
      <Chip variant="outlined" color="default" label="GraphQL" />
    </div>
  ),
};
