import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { fieldArgTypes } from "./field-demos";
import { ExtendedFieldStory, extendedFieldArgs } from "./extended-field-demos";
const meta = {
  title: "Input Fields/Time",
  component: ExtendedFieldStory,
  args: { ...extendedFieldArgs, kind: "time" },
  argTypes: fieldArgTypes,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ExtendedFieldStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { prefilled: true } };
export const PickerOpen: Story = { args: { prefilled: true, initiallyOpen: true } };
export const EveryMinute: Story = { args: { minuteStep: 1, initiallyOpen: true } };
export const QuarterHour: Story = { args: { minuteStep: 15, initiallyOpen: true } };
export const RequiredError: Story = { args: { required: true, error: "Choose a clock-in time." } };
export const Disabled: Story = { args: { prefilled: true, disabled: true } };
export const ReadOnly: Story = { args: { prefilled: true, readOnly: true } };
export const Filled: Story = { args: { variant: "filled" } };
export const Dark: Story = { args: { prefilled: true, initiallyOpen: true }, globals: { theme: "dark" } };
export const Responsive: Story = {
  args: { initiallyOpen: true },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const FocusHoverAndSelect: Story = {
  play: async () => {
    const canvas = within(document.body);
    await userEvent.click(canvas.getByRole("button", { name: "Clock in" }));
    await userEvent.click(
      within(canvas.getByRole("listbox", { name: "Clock in Hours" })).getByRole("option", { name: "09" }),
    );
    await userEvent.click(
      within(canvas.getByRole("listbox", { name: "Clock in Minutes" })).getByRole("option", { name: "30" }),
    );
    await expect(canvas.getByRole("button", { name: "Clock in" })).toHaveTextContent("09:30");
    await userEvent.hover(canvas.getByRole("button", { name: "Done" }));
    await userEvent.click(canvas.getByRole("button", { name: "Done" }));
    await expect(canvas.queryByRole("dialog")).not.toBeInTheDocument();
  },
};
