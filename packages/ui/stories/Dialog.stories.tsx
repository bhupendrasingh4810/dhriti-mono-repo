import type { Meta, StoryObj } from "@storybook/react-vite";

import { Dialog } from "../src/components/Dialog";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  args: {
    open: true,
    title: "Archive conversation?",
    children: "Archived conversations remain available in the archive.",
    onClose: () => undefined,
    primaryActionLabel: "Archive",
    secondaryActionLabel: "Cancel",
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const ErrorAction: Story = {
  args: {
    primaryButtonColor: "error",
    primaryActionLabel: "Delete",
    children: "This action permanently removes the conversation.",
  },
};

export const LongContent: Story = {
  args: {
    title: "Update workspace notification preferences",
    children:
      "Choose how workspace activity is delivered. Changes apply to all new activity, while existing notification settings remain available in each conversation.",
    primaryActionLabel: "Save preferences",
  },
};

export const DisabledAction: Story = {
  args: {
    primaryActionLabel: "Confirm",
    primaryActionDisabled: true,
  },
};

export const RetentionConfirmation: Story = {
  args: {
    title: "Confirm retention change",
    primaryButtonColor: "error",
    primaryActionLabel: "Confirm and save",
    children:
      "Shortening or enabling message or recording retention may permanently delete older data. Changes have a 24-hour grace period before they take effect. Retention cleanup runs only when the server-side feature flag is enabled.",
  },
};

export const NarrowViewport: Story = {
  args: {
    maxWidth: "xs",
    fullWidth: true,
  },
};

export const FullScreenOnMobile: Story = {
  args: {
    fullScreenOnMobile: true,
    title: "Create note",
    primaryActionLabel: "Save note",
    children: "Capture decisions and next steps for the team.",
  },
  globals: {
    viewport: { value: "mobile1", isRotated: false },
  },
};
