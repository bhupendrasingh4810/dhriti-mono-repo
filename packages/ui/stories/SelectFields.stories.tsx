import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { FieldStory, fieldArgTypes, fieldDemoArgs } from "./field-demos";
const meta = {
  title: "Input Fields/Selection",
  component: FieldStory,
  args: { ...fieldDemoArgs, kind: "select" },
  argTypes: fieldArgTypes,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { prefilled: true } };
export const Empty: Story = { args: { emptyOptions: true } };
export const LongOptions: Story = { args: { longContent: true, prefilled: true } };
export const Disabled: Story = { args: { disabled: true, prefilled: true } };
export const ReadOnly: Story = { args: { readOnly: true, prefilled: true } };
export const Error: Story = { args: { required: true, error: "Select a job title" } };
export const OpenAndSelect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Job title" }));
    await userEvent.click(canvas.getByRole("option", { name: "Software Engineer" }));
    await expect(canvas.getByRole("button", { name: "Job title" })).toHaveTextContent("Software Engineer");
  },
};
export const Responsive: Story = {
  args: { longContent: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
