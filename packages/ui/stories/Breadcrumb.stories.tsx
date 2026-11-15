import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { DhritiBreadcrumb } from "../src/components/navigation/breadcrumb";

const meta = {
  title: "Navigation/Breadcrumb",
  component: DhritiBreadcrumb,
  parameters: { layout: "padded" },
  args: {
    items: [
      { label: "Admin", href: "/admin" },
      { label: "Platform", href: "/admin/platform" },
      { label: "Entitlements" },
    ],
  },
} satisfies Meta<typeof DhritiBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Admin" });
    await userEvent.hover(link);
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(canvas.getByText("Entitlements")).toHaveAttribute("aria-current", "page");
  },
};
export const ChevronAndPlain: Story = { args: { separator: "chevron", variant: "plain", size: "sm" } };
export const NonInteractiveAncestors: Story = {
  args: { items: [{ label: "HRMS" }, { label: "Workforce" }, { label: "Employees" }] },
};
export const SinglePage: Story = { args: { items: [{ label: "Connect" }] } };
export const Empty: Story = { args: { items: [] } };
export const ResponsiveLongLabels: Story = {
  args: {
    items: [
      { label: "Human resources and workforce management", href: "/hrms" },
      { label: "Organization-wide onboarding and employee administration", href: "/hrms/onboarding" },
      { label: "A particularly long employee onboarding workflow configuration" },
    ],
  },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
