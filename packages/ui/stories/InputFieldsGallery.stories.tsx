import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldGallery, fieldArgTypes, fieldDemoArgs } from "./field-demos";
import { ExtendedFieldDemo, extendedFieldArgs } from "./extended-field-demos";
import { DhritiFieldGroup } from "../src/components/fields";
const meta = {
  title: "Input Fields/All Fields",
  component: FieldGallery,
  args: fieldDemoArgs,
  render: (args) => (
    <>
      <FieldGallery {...args} />
      <div className="grid gap-6 bg-background p-6 md:grid-cols-2">
        {(["date", "textarea", "file", "time"] as const).map((kind) => (
          <DhritiFieldGroup
            key={kind}
            title={{ date: "Date", textarea: "Textarea", file: "File input", time: "Time" }[kind]}
            wide
          >
            <ExtendedFieldDemo key={`${kind}-${args.prefilled}`} {...extendedFieldArgs} {...args} kind={kind} />
          </DhritiFieldGroup>
        ))}
      </div>
    </>
  ),
  argTypes: fieldArgTypes,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FieldGallery>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { variant: "filled" } };
export const Underline: Story = { args: { variant: "underline" } };
export const RequiredErrors: Story = { args: { required: true, error: "This field is required" } };
export const Disabled: Story = { args: { disabled: true, prefilled: true } };
export const ReadOnly: Story = { args: { readOnly: true, prefilled: true } };
export const Success: Story = { args: { success: true, prefilled: true } };
export const DarkTheme: Story = { args: { prefilled: true }, globals: { theme: "dark" } };
export const Responsive: Story = { globals: { viewport: { value: "mobile1", isRotated: false } } };
