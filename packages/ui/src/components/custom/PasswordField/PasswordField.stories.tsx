import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PasswordField } from "./PasswordField";

const meta = {
  title: "Forms/PasswordField",
  component: PasswordField,
  parameters: { layout: "centered" },
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledPasswordField() {
  const [value, setValue] = useState("");
  return <PasswordField label="Account password" value={value} onChange={(event) => setValue(event.target.value)} />;
}

export const Default: Story = {
  render: () => <ControlledPasswordField />,
};

export const WithError: Story = {
  render: () => (
    <PasswordField
      error
      helperText="Password does not meet the requirements."
      label="Account password"
      onChange={() => undefined}
      value="short"
    />
  ),
};

export const Disabled: Story = {
  render: () => <PasswordField disabled label="Account password" onChange={() => undefined} value="password" />,
};
