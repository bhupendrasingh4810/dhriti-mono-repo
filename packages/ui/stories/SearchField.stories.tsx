import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DhritiSearchField, type DhritiSearchFieldProps } from "../src/components/fields";

function Demo(args: DhritiSearchFieldProps) {
  const [value, setValue] = useState(args.value);
  const [query, setQuery] = useState(args.value);
  return (
    <div className="w-full max-w-2xl space-y-3 p-6">
      <DhritiSearchField {...args} value={value} onChange={setValue} onSearch={setQuery} />
      <p role="status" className="text-xs text-text-secondary">
        Debounced query: {query || "None"}
      </p>
    </div>
  );
}
const meta = {
  title: "Input Fields/Search",
  component: DhritiSearchField,
  render: (args) => <Demo {...args} />,
  args: {
    label: "Search employees",
    showLabel: false,
    placeholder: "Search by name, email, number, department...",
    value: "",
    onChange: () => {},
    onSearch: () => {},
    debounceMs: 300,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhritiSearchField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true, value: "Alex Morgan" } };
export const ReadOnly: Story = { args: { readOnly: true, value: "Alex Morgan" } };
export const Error: Story = { args: { error: "Search is temporarily unavailable" } };
export const LongText: Story = {
  args: { value: "Connect workspace employees across global engineering and product operations".repeat(3) },
};
export const Responsive: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };
export const TypingAndDebounce: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Search employees" });
    await userEvent.hover(input);
    await userEvent.type(input, "Alex");
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("Alex");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Debounced query: Alex"));
    await userEvent.click(canvas.getByRole("button", { name: "Clear Search employees" }));
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Debounced query: None"));
  },
};
