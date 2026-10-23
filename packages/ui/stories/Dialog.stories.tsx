import type { Meta, StoryObj } from "@storybook/react-vite";

import { Dialog } from "../src/components/Dialog";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  args: {
    open: true,
    title: "Archive conversation?",
    children: "Archived conversations remain available in the archive.",
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
