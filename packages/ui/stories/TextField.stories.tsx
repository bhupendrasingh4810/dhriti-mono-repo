/**
 * TextField Stories
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "@storybook/test";

import { TextField } from "../src/components/forms";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FolderIcon from "@mui/icons-material/Folder";

const meta = {
  title: "Components/TextField",
  component: TextField,

  parameters: {
    layout: "centered",
  },

  args: {
    label: "Project name",
    placeholder: "Enter project name",
    helperText: "Choose a descriptive name",
    fullWidth: true,
  },

  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    helperText: { control: "text" },
    errorText: { control: "text" },
    description: { control: "text" },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    required: { control: "boolean" },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    clearable: { control: "boolean" },
    loading: { control: "boolean" },
    success: { control: "boolean" },
    warning: { control: "boolean" },
    startIcon: { control: false },
    endIcon: { control: false },
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default text field.
 */
export const Default: Story = {};

/**
 * Text field with start icon.
 */
export const WithStartIcon: Story = {
  args: {
    startIcon: <FolderIcon />,
  },
};

/**
 * Text field with error.
 */
export const Error: Story = {
  args: {
    errorText: "This field is required",
    value: "",
  },
};

/**
 * Text field with warning state.
 */
export const Warning: Story = {
  args: {
    warning: true,
    helperText: "This name is similar to an existing project",
  },
};

/**
 * Text field with success state.
 */
export const Success: Story = {
  args: {
    success: true,
    helperText: "Name is available",
  },
};

/**
 * Disabled text field.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Cannot edit this",
  },
};

/**
 * Read-only text field.
 */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: "Read-only value",
  },
};

/**
 * Text field with clear button.
 */
export const Clearable: Story = {
  args: {
    clearable: true,
    value: "Can be cleared",
  },
};

/**
 * Text field with loading state.
 */
export const Loading: Story = {
  args: {
    loading: true,
    value: "Validating...",
  },
};

/**
 * Small size text field.
 */
export const Small: Story = {
  args: {
    size: "small",
    label: "Small field",
  },
};

/**
 * Large size text field.
 */
export const Large: Story = {
  args: {
    size: "large",
    label: "Large field",
  },
};

/**
 * Required text field.
 */
export const Required: Story = {
  args: {
    required: true,
    label: "Required field *",
  },
};

/**
 * Text field with description.
 */
export const WithDescription: Story = {
  args: {
    description: "This will be shown above the input",
    helperText: "This is helper text below",
  },
};

/**
 * All validation states.
 */
export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 300 }}>
      <TextField label="Default" placeholder="Normal state" />
      <TextField label="Error" errorText="Invalid input" />
      <TextField label="Warning" warning helperText="Caution advised" />
      <TextField label="Success" success helperText="Looks good!" />
      <TextField label="Loading" loading value="Checking..." />
    </div>
  ),
};