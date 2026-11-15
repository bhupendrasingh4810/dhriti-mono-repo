import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { DhritiButton } from "../src/components/buttons-and-actions/button";

const meta = {
  title: "Buttons/Configurable Button",
  component: DhritiButton,
  args: { children: "Add designation", startIcon: <Plus className="size-4" /> },
} satisfies Meta<typeof DhritiButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Add designation" });
    await userEvent.hover(button);
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};
export const Secondary: Story = { args: { variant: "secondary", children: "Request comp off", startIcon: undefined } };
export const Danger: Story = { args: { variant: "danger", children: "Delete organization", startIcon: undefined } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, children: "Saving" } };
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const IconOnly: Story = { args: { children: undefined, "aria-label": "Add designation" } };
export const LongText: Story = {
  args: { children: "Add an organization-wide designation and employee classification" },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };
