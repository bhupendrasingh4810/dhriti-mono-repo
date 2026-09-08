/**
 * Alert Component Stories
 * 
 * Comprehensive Storybook documentation for Dhriti Alert component.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";
import { Alert, Button } from "../src/components/mui";
import {
  CheckCircleOutlineRounded,
  ErrorOutlineRounded,
  InfoOutlined as InfoOutlinedIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";

const meta = {
  title: "Components/Alert",
  component: Alert,

  parameters: {
    layout: "centered",
  },

  args: {
    children: "This is an alert message",
    severity: "info",
    variant: "filled",
    fullWidth: true,
  },

  argTypes: {
    children: {
      control: "text",
    },
    severity: {
      control: "select",
      options: ["success", "error", "warning", "info"],
    },
    variant: {
      control: "select",
      options: ["filled", "outlined"],
    },
    description: {
      control: "text",
    },
    action: {
      control: false,
    },
    dismissible: {
      control: "boolean",
    },
    showIcon: {
      control: "boolean",
    },
    icon: {
      control: false,
    },
    fullWidth: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

// ============================================================================
// FILLED
// ============================================================================

export const Filled: Story = {
  name: "Filled",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
      <Alert severity="success" variant="filled">
        Success! Your changes have been saved.
      </Alert>

      <Alert severity="error" variant="filled">
        Error! Something went wrong.
      </Alert>

      <Alert severity="warning" variant="filled">
        Warning! Please review before continuing.
      </Alert>

      <Alert severity="info" variant="filled">
        Info! Here's some useful information.
      </Alert>
    </div>
  ),
};

// ============================================================================
// OUTLINED
// ============================================================================

export const Outlined: Story = {
  name: "Outlined",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
      <Alert severity="success" variant="outlined">
        Success! Your changes have been saved.
      </Alert>

      <Alert severity="error" variant="outlined">
        Error! Something went wrong.
      </Alert>

      <Alert severity="warning" variant="outlined">
        Warning! Please review before continuing.
      </Alert>

      <Alert severity="info" variant="outlined">
        Info! Here's some useful information.
      </Alert>
    </div>
  ),
};

// ============================================================================
// DESCRIPTION
// ============================================================================

export const Description: Story = {
  name: "Descriptions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
      <Alert severity="success" variant="filled" description="Your changes have been saved successfully and will be reflected shortly.">
        Changes saved
      </Alert>

      <Alert severity="error" variant="filled" description="We couldn't connect to the server. Please check your internet connection and try again.">
        Connection failed
      </Alert>

      <Alert severity="warning" variant="filled" description="This action cannot be undone. All data will be permanently deleted from our servers.">
        Delete account?
      </Alert>

      <Alert severity="info" variant="filled" description="We've sent a verification code to your email. Please enter it below to continue.">
        Verification required
      </Alert>
    </div>
  ),
};

// ============================================================================
// ACTION
// ============================================================================

export const Action: Story = {
  name: "Actions",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
      <Alert
        severity="success"
        variant="filled"
        description="Your changes have been saved."
        action={<Button size="small" variant="outlined">Undo</Button>}
      >
        Saved successfully
      </Alert>

      <Alert
        severity="error"
        variant="filled"
        description="Failed to save your changes."
        action={<Button size="small" variant="contained" color="error">Retry</Button>}
      >
        Save failed
      </Alert>

      <Alert
        severity="warning"
        variant="filled"
        description="This action cannot be undone."
        action={
          <>
            <Button size="small" variant="text">Cancel</Button>
            <Button size="small" variant="contained" color="warning">Confirm</Button>
          </>
        }
      >
        Delete item?
      </Alert>

      <Alert
        severity="info"
        variant="filled"
        description="A new version is available."
        action={
          <>
            <Button size="small" variant="text">Later</Button>
            <Button size="small" variant="contained">Update</Button>
          </>
        }
      >
        Update available
      </Alert>
    </div>
  ),
};

// ============================================================================
// DISMISSIBLE
// ============================================================================

export const Dismissible: Story = {
  name: "Dismissible",
  render: () => {
    const alerts = [
      { severity: "success", message: "Success! You can dismiss this." },
      { severity: "error", message: "Error! You can dismiss this." },
      { severity: "warning", message: "Warning! You can dismiss this." },
      { severity: "info", message: "Info! You can dismiss this." },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
        {alerts.map((alert, index) => (
          <DismissibleAlert
            key={index}
            severity={alert.severity as any}
            message={alert.message}
          />
        ))}
      </div>
    );
  },
};

const DismissibleAlert = ({ severity, message }: { severity: string; message: string }) => {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <Alert
      severity={severity as any}
      variant="filled"
      dismissible
      open={open}
      onDismiss={() => setOpen(false)}
    >
      {message}
    </Alert>
  );
};

// ============================================================================
// CUSTOM ICON
// ============================================================================

export const CustomIcon: Story = {
  name: "Custom Icons",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
      <Alert
        severity="success"
        variant="filled"
        icon={<CheckCircleOutlineRounded fontSize="inherit" />}
        description="Custom success icon"
      >
        Custom Icon
      </Alert>

      <Alert
        severity="error"
        variant="filled"
        icon={<ErrorOutlineRounded fontSize="inherit" />}
        description="Custom error icon"
      >
        Custom Icon
      </Alert>

      <Alert
        severity="warning"
        variant="filled"
        icon={<WarningAmberIcon fontSize="inherit" />}
        description="Custom warning icon"
      >
        Custom Icon
      </Alert>

      <Alert
        severity="info"
        variant="filled"
        icon={<InfoOutlinedIcon fontSize="inherit" />}
        description="Custom info icon"
      >
        Custom Icon
      </Alert>
    </div>
  ),
};

// ============================================================================
// NO ICON
// ============================================================================

export const NoIcon: Story = {
  name: "Without Icons",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
      <Alert severity="success" variant="filled" showIcon={false}>
        Success message without icon
      </Alert>

      <Alert severity="error" variant="filled" showIcon={false}>
        Error message without icon
      </Alert>

      <Alert severity="warning" variant="filled" showIcon={false}>
        Warning message without icon
      </Alert>

      <Alert severity="info" variant="filled" showIcon={false}>
        Info message without icon
      </Alert>
    </div>
  ),
};

// ============================================================================
// COMBINATIONS
// ============================================================================

/**
 * Filled with description and action.
 */
export const FilledComplete: Story = {
  name: "Filled Complete",
  render: () => (
    <Alert
      severity="info"
      variant="filled"
      description="A new version is available with improved performance and bug fixes."
      action={
        <>
          <Button size="small" variant="text">Later</Button>
          <Button size="small" variant="contained">Update</Button>
        </>
      }
    >
      Update available
    </Alert>
  ),
};

/**
 * Outlined with description and action.
 */
export const OutlinedComplete: Story = {
  name: "Outlined Complete",
  render: () => (
    <Alert
      severity="warning"
      variant="outlined"
      description="Your storage is almost full. Upgrade now to avoid interruption."
      action={
        <Button size="small" variant="contained" color="warning">
          Upgrade
        </Button>
      }
    >
      Storage almost full
    </Alert>
  ),
};

/**
 * Enterprise patterns.
 */
export const EnterprisePatterns: Story = {
  name: "Enterprise Patterns",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 600 }}>
      {/* Form success */}
      <Alert
        severity="success"
        variant="filled"
        description="Your profile has been updated successfully."
        action={<Button size="small" variant="outlined">View Profile</Button>}
      >
        Profile updated
      </Alert>

      {/* Validation error */}
      <Alert
        severity="error"
        variant="outlined"
        description="Please correct the errors in the form below."
      >
        Form validation failed
      </Alert>

      {/* System warning */}
      <Alert
        severity="warning"
        variant="filled"
        description="Scheduled maintenance on Dec 25, 2024 from 2-4 AM UTC."
        action={
          <>
            <Button size="small" variant="text">Learn More</Button>
            <Button size="small" variant="contained">Set Reminder</Button>
          </>
        }
      >
        Scheduled maintenance
      </Alert>

      {/* Info notification */}
      <Alert
        severity="info"
        variant="filled"
        description="We've sent a verification code to your email."
        action={<Button size="small" variant="contained">Resend Code</Button>}
      >
        Verification required
      </Alert>
    </div>
  ),
};
