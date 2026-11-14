import type { Meta, StoryObj } from "@storybook/react-vite";
import { fieldArgTypes } from "./field-demos";
import { ExtendedFieldStory, extendedFieldArgs } from "./extended-field-demos";
const meta = {
  title: "Input Fields/Textarea",
  component: ExtendedFieldStory,
  args: { ...extendedFieldArgs, kind: "textarea" },
  argTypes: fieldArgTypes,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ExtendedFieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { variant: "filled", prefilled: true } };
export const Underline: Story = { args: { variant: "underline" } };
export const RequiredError: Story = { args: { required: true, error: "Add a reason for your request." } };
export const Success: Story = { args: { prefilled: true, success: true } };
export const LongText: Story = { args: { prefilled: true, longContent: true } };
export const Disabled: Story = { args: { prefilled: true, disabled: true } };
export const ReadOnly: Story = { args: { prefilled: true, readOnly: true } };
export const Dark: Story = { globals: { theme: "dark" } };
export const Responsive: Story = {
  args: { prefilled: true, longContent: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
