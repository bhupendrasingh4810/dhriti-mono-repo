import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { SettingsFieldConfig } from "../../settings-schema";
import { SettingsField } from "../SettingsField";

test("renders config-driven controls and sends normalized values", () => {
  const onChange = vi.fn();
  const field: SettingsFieldConfig = {
    key: "channelPrefix",
    kind: "text",
    label: "Channel prefix",
    description: "Used for new channels",
    maxLength: 10,
    uppercase: true,
  };
  const { rerender } = render(<SettingsField field={field} value="team" disabled={false} onChange={onChange} />);

  fireEvent.change(screen.getByLabelText("Channel prefix"), { target: { value: "eng" } });
  expect(onChange).toHaveBeenCalledWith("ENG");

  const selectField: SettingsFieldConfig = {
    key: "visibility",
    kind: "select",
    label: "Visibility",
    options: [{ value: "private", label: "Private" }],
    nullLabel: "Choose visibility",
  };
  rerender(
    <SettingsField
      field={selectField}
      value={null}
      disabled={false}
      dynamicOptions={[{ value: "public", label: "Public" }]}
      onChange={onChange}
    />,
  );
  fireEvent.change(screen.getByLabelText("Visibility"), { target: { value: "public" } });
  expect(onChange).toHaveBeenLastCalledWith("public");
});
