import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CallAction, DeviceSelect, ParticipantAvatar } from "../CallUi";

test("renders selectable devices and invokes an action", () => {
  const change = vi.fn();
  const action = vi.fn();
  render(<><DeviceSelect label="Microphone" devices={[{ deviceId: "mic", kind: "audioinput", label: "Desk mic" } as MediaDeviceInfo]} value="" onChange={change} /><ParticipantAvatar userId="unknown" /><CallAction label="Mute" active={false} icon={<span />} onClick={action} /></>);
  fireEvent.change(screen.getByLabelText("Microphone"), { target: { value: "mic" } });
  fireEvent.click(screen.getByRole("button", { name: "Mute" }));
  expect(change).toHaveBeenCalledWith("mic");
  expect(action).toHaveBeenCalledOnce();
  expect(screen.getByText("G")).toBeInTheDocument();
});
