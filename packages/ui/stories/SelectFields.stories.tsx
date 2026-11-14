import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useEffect, useRef, type ReactNode } from "react";
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
function NativeModal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label="Payroll form"
      className="w-full max-w-lg rounded-lg border border-border bg-surface p-4 text-text-primary backdrop:bg-text-primary/40"
    >
      {children}
    </dialog>
  );
}
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
    await userEvent.click(within(document.body).getByRole("option", { name: "Software Engineer" }));
    await expect(canvas.getByRole("button", { name: "Job title" })).toHaveTextContent("Software Engineer");
  },
};
export const Responsive: Story = {
  args: { longContent: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const BottomEdgePopover: Story = {
  decorators: [
    (Story) => (
      <div className="flex h-screen items-end overflow-hidden pb-6">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Job title" });
    await userEvent.click(within(canvasElement).getByText("Job title"));
    await expect(within(document.body).queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(trigger);
    const menu = within(document.body).getByRole("listbox");
    await expect(menu).toBeVisible();
    await expect(menu.getBoundingClientRect().bottom).toBeLessThanOrEqual(trigger.getBoundingClientRect().top);
  },
};
export const NativePayrollModal: Story = {
  decorators: [
    (Story) => (
      <NativeModal>
        <Story />
      </NativeModal>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Job title" }));
    const dialog = canvas.getByRole("dialog", { name: "Payroll form" });
    await userEvent.click(within(dialog).getByRole("option", { name: "Software Engineer" }));
    await expect(canvas.getByRole("button", { name: "Job title" })).toHaveTextContent("Software Engineer");
  },
};
