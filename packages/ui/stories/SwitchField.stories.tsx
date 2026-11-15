import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { DhritiSwitchField, type DhritiChoiceFieldProps } from "../src/components/fields";

function SwitchDemo(args: DhritiChoiceFieldProps) {
  const [checked, setChecked] = useState(args.checked);
  return <DhritiSwitchField {...args} checked={checked} onChange={setChecked} />;
}

const meta = {
  title: "Input Fields/Switch",
  component: DhritiSwitchField,
  render: (args) => <SwitchDemo {...args} />,
  args: { label: "Require multi-factor authentication", checked: false, onChange: () => {} },
} satisfies Meta<typeof DhritiSwitchField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const On: Story = { args: { checked: true } };
export const Disabled: Story = { args: { checked: true, disabled: true } };
export const ReadOnly: Story = { args: { checked: true, readOnly: true } };
export const RequiredError: Story = { args: { required: true, error: "Enable multi-factor authentication." } };
export const HiddenLabel: Story = { args: { showLabel: false } };
export const ResponsiveLongLabel: Story = {
  args: { label: "Require multi-factor authentication for all members of this organization" },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole("switch");
    await userEvent.hover(control);
    await userEvent.tab();
    await expect(control).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(control).toBeChecked();
  },
};
