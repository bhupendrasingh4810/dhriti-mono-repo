import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { DhritiCheckboxField, DhritiRadioField, type DhritiCheckboxFieldProps } from "../src/components/fields";

function CheckboxDemo(args: DhritiCheckboxFieldProps) {
  const [checked, setChecked] = useState(args.checked);
  return (
    <div className="p-6">
      <DhritiCheckboxField {...args} checked={checked} onChange={setChecked} />
    </div>
  );
}
function RadioDemo() {
  const [selected, setSelected] = useState("office");
  return (
    <fieldset className="space-y-3 p-6">
      <legend className="text-sm font-semibold text-text-primary">Work arrangement</legend>
      {[
        ["office", "Office"],
        ["remote", "Remote"],
        ["hybrid", "Hybrid"],
      ].map(([value, label]) => (
        <DhritiRadioField
          key={value}
          name="work-arrangement"
          label={label}
          value={value}
          checked={selected === value}
          onChange={(checked) => {
            if (checked) setSelected(value);
          }}
        />
      ))}
    </fieldset>
  );
}
const meta = {
  title: "Input Fields/Checkbox and Radio",
  component: DhritiCheckboxField,
  render: (args) => <CheckboxDemo {...args} />,
  args: { label: "Include this component in payroll", checked: false, onChange: () => {} },
} satisfies Meta<typeof DhritiCheckboxField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Indeterminate: Story = { args: { indeterminate: true } };
export const Disabled: Story = { args: { checked: true, disabled: true } };
export const ReadOnly: Story = { args: { checked: true, readOnly: true } };
export const RequiredError: Story = { args: { required: true, error: "Confirm before submitting." } };
export const LongLabel: Story = {
  args: {
    label:
      "Apply this payroll component to all eligible employees across engineering, operations, design, and regional offices.",
  },
};
export const RadioGroup: Story = { render: () => <RadioDemo /> };
export const Responsive: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };
export const KeyboardSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await userEvent.hover(checkbox);
    checkbox.focus();
    await userEvent.keyboard(" ");
    await expect(checkbox).toBeChecked();
  },
};
