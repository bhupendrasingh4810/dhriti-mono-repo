import type { Meta, StoryObj } from "@storybook/react-vite";
import { fieldArgTypes } from "./field-demos";
import { ExtendedFieldStory, extendedFieldArgs } from "./extended-field-demos";
const meta = {
  title: "Input Fields/File Input",
  component: ExtendedFieldStory,
  args: { ...extendedFieldArgs, kind: "file" },
  argTypes: fieldArgTypes,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ExtendedFieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { prefilled: true } };
export const MultipleFiles: Story = { args: { multiple: true } };
export const LongFilename: Story = { args: { prefilled: true, longContent: true } };
export const Uploading: Story = { args: { prefilled: true, uploading: true } };
export const RequiredError: Story = { args: { required: true, error: "Attach a supporting document." } };
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { prefilled: true, readOnly: true } };
export const Dark: Story = { args: { prefilled: true }, globals: { theme: "dark" } };
export const Responsive: Story = {
  args: { prefilled: true, longContent: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
