import type { Meta, StoryObj } from "@storybook/react-vite";
import { fieldArgTypes } from "./field-demos";
import { ExtendedFieldStory, extendedFieldArgs } from "./extended-field-demos";
const meta = {
  title: "Input Fields/Date",
  component: ExtendedFieldStory,
  args: { ...extendedFieldArgs, kind: "date" },
  argTypes: fieldArgTypes,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ExtendedFieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { prefilled: true } };
export const CalendarOpen: Story = { args: { prefilled: true, initiallyOpen: true } };
export const RequiredError: Story = { args: { required: true, error: "Choose a from date." } };
export const Disabled: Story = { args: { prefilled: true, disabled: true } };
export const ReadOnly: Story = { args: { prefilled: true, readOnly: true } };
export const Filled: Story = { args: { variant: "filled" } };
export const Underline: Story = { args: { variant: "underline" } };
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const Dark: Story = { args: { prefilled: true, initiallyOpen: true }, globals: { theme: "dark" } };
export const Responsive: Story = {
  args: { initiallyOpen: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
