import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
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
export const MonthPicker: Story = { args: { dateMode: "month", initiallyOpen: true } };
export const SelectedMonth: Story = { args: { dateMode: "month", prefilled: true } };
export const MonthError: Story = { args: { dateMode: "month", required: true, error: "Choose a payroll month." } };
export const DisabledMonth: Story = { args: { dateMode: "month", prefilled: true, disabled: true } };
export const ResponsiveMonth: Story = {
  args: { dateMode: "month", initiallyOpen: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const YearPicker: Story = { args: { dateMode: "year", initiallyOpen: true } };
export const SelectedYear: Story = { args: { dateMode: "year", prefilled: true } };
export const YearError: Story = { args: { dateMode: "year", required: true, error: "Choose a reporting year." } };
export const DisabledYear: Story = { args: { dateMode: "year", prefilled: true, disabled: true } };
export const ResponsiveYear: Story = {
  args: { dateMode: "year", initiallyOpen: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const MonthSelection: Story = {
  args: { dateMode: "month" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "From date" }));
    await userEvent.click(within(document.body).getByRole("button", { name: "November 2026" }));
    await expect(canvas.getByRole("button", { name: "From date" })).toHaveTextContent("November 2026");
  },
};
export const YearSelection: Story = {
  args: { dateMode: "year" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "From date" }));
    await userEvent.click(within(document.body).getByRole("button", { name: "2026" }));
    await expect(canvas.getByRole("button", { name: "From date" })).toHaveTextContent("2026");
  },
};
export const DarkYear: Story = {
  args: { dateMode: "year", prefilled: true, initiallyOpen: true },
  globals: { theme: "dark" },
};
