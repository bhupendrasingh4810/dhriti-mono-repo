import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { FieldStory, fieldArgTypes, fieldDemoArgs } from "./field-demos";

const meta = {
  title: "Input Fields/Basic",
  component: FieldStory,
  args: { ...fieldDemoArgs, kind: "text" },
  argTypes: { ...fieldArgTypes, kind: { control: "select", options: ["text", "number"] } },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Number: Story = { args: { kind: "number" } };
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const Filled: Story = { args: { variant: "filled" } };
export const Underline: Story = { args: { variant: "underline" } };
export const Disabled: Story = { args: { disabled: true, prefilled: true } };
export const ReadOnly: Story = { args: { readOnly: true, prefilled: true } };
export const Error: Story = { args: { required: true, error: "Full name is required" } };
export const Success: Story = { args: { success: true, prefilled: true } };
export const FocusHoverAndActive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Full name" });
    await userEvent.hover(input);
    await userEvent.click(input);
    await userEvent.type(input, "Alex Morgan");
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("Alex Morgan");
    await userEvent.click(canvas.getByRole("button", { name: "Clear Full name" }));
    await expect(input).toHaveValue("");
  },
};
export const Responsive: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
