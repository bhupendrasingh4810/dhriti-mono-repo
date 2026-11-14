import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldStory, fieldArgTypes, fieldDemoArgs } from "./field-demos";
const meta = {
  title: "Input Fields/Contact",
  component: FieldStory,
  args: { ...fieldDemoArgs, kind: "phone" },
  argTypes: { ...fieldArgTypes, kind: { control: "select", options: ["phone", "country", "email"] } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Country: Story = { args: { kind: "country" } };
export const Email: Story = { args: { kind: "email" } };
export const InvalidEmail: Story = { args: { kind: "email", required: true, error: "Enter a valid email address" } };
export const Disabled: Story = { args: { disabled: true, prefilled: true } };
export const ReadOnly: Story = { args: { readOnly: true, prefilled: true } };
export const EmptyCountries: Story = { args: { kind: "country", emptyOptions: true } };
export const Success: Story = { args: { kind: "email", success: true, prefilled: true } };
export const Responsive: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
