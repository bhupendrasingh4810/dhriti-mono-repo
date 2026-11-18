import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, FileText } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";
import { DhritiButton } from "../src/components/buttons-and-actions/button";
import { DhritiCard, DhritiEmptyCard } from "../src/components/cards/card";

const meta = {
  title: "Surfaces/Cards",
  component: DhritiCard,
  parameters: { layout: "padded" },
  args: {
    children: (
      <>
        <h3 className="font-semibold text-text-primary">Enterprise Plan</h3>
        <p className="mt-1 text-sm text-text-secondary">420 / 500 seats used · $8,400/mo</p>
      </>
    ),
  },
} satisfies Meta<typeof DhritiCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Success: Story = { args: { variant: "success" } };
export const Warning: Story = {
  args: { variant: "warning", children: "Approaching seat limit. Consider upgrading your plan." },
};
export const Danger: Story = { args: { variant: "danger", children: "Delete Organization — this cannot be undone." } };
export const Info: Story = {
  args: { variant: "info", children: "No bank provider connected. Manual review is required." },
};
export const Compact: Story = { args: { padding: "sm" } };
export const ResponsiveLongContent: Story = {
  args: {
    children:
      "A particularly long card description demonstrates how content wraps on smaller screens without overflowing.",
  },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };

export const PlanWithAction: Story = {
  args: {
    variant: "success",
    children: (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary">Enterprise Plan</h3>
            <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand">Active</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">420 / 500 seats used · $8,400/mo</p>
        </div>
        <DhritiButton size="sm">Manage Billing</DhritiButton>
      </div>
    ),
  },
};

export const Empty: Story = {
  render: () => (
    <DhritiEmptyCard
      title="No documents yet"
      description="Uploaded documents will appear here."
      icon={<FileText className="size-6" />}
    />
  ),
};

export const EmptyWithAction: Story = {
  render: () => (
    <DhritiEmptyCard
      title="No upcoming holidays"
      description="Add a holiday calendar to see upcoming days off."
      icon={<CalendarDays className="size-6" />}
      action={<DhritiButton startIcon={<CalendarDays className="size-4" />}>Add holiday</DhritiButton>}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Add holiday" });
    await userEvent.hover(button);
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};

export const EmptyResponsive: Story = {
  render: () => (
    <DhritiEmptyCard
      title="No matching candidates"
      description="Try adjusting the filters or search terms to find candidates for this opening."
      icon={<FileText className="size-6" />}
      className="w-full"
    />
  ),
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

export const EmptyDark: Story = {
  render: () => (
    <DhritiEmptyCard
      title="No upcoming holidays"
      description="Your upcoming holidays will appear here."
      icon={<CalendarDays className="size-6" />}
    />
  ),
  globals: { theme: "dark" },
};
