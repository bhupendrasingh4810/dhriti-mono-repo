import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldStory, fieldArgTypes, fieldDemoArgs } from "./field-demos";
const meta = {
  title: "Input Fields/Combobox",
  component: FieldStory,
  args: { ...fieldDemoArgs, kind: "flat" },
  argTypes: { ...fieldArgTypes, kind: { control: "select", options: ["flat", "hierarchy", "grouped"] } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Hierarchy: Story = { args: { kind: "hierarchy" } };
export const Grouped: Story = { args: { kind: "grouped" } };
export const Selected: Story = { args: { prefilled: true } };
export const SelectedHierarchy: Story = { args: { kind: "hierarchy", prefilled: true } };
export const SelectedMembers: Story = { args: { kind: "grouped", prefilled: true } };
export const Empty: Story = { args: { emptyOptions: true } };
export const LongOptionsAndChips: Story = { args: { longContent: true, prefilled: true } };
export const Disabled: Story = { args: { disabled: true, prefilled: true } };
export const ReadOnly: Story = { args: { readOnly: true, prefilled: true } };
export const Error: Story = { args: { required: true, error: "Select at least one application" } };
export const Responsive: Story = {
  args: { kind: "grouped", longContent: true, prefilled: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
