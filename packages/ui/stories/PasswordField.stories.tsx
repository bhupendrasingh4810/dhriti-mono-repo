import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { FieldStory, fieldArgTypes, fieldDemoArgs } from "./field-demos";
const meta = {
  title: "Input Fields/Security",
  component: FieldStory,
  args: { ...fieldDemoArgs, kind: "password" },
  argTypes: fieldArgTypes,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Strong: Story = { args: { prefilled: true } };
export const Error: Story = { args: { required: true, error: "Password must be at least 8 characters" } };
export const Disabled: Story = { args: { disabled: true, prefilled: true } };
export const ReadOnly: Story = { args: { readOnly: true, prefilled: true } };
export const VisibleAndWeak: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show Password" }));
    await userEvent.type(canvas.getByLabelText("Password"), "demo");
    await expect(canvas.getByRole("textbox", { name: "Password" })).toHaveValue("demo");
    await expect(canvas.getByRole("meter")).toHaveAttribute("aria-valuetext", "Weak");
  },
};
export const Responsive: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
