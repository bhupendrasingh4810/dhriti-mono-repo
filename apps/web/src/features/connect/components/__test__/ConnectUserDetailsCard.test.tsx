import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ConnectUserDetailsCard from "../ConnectUserDetailsCard";

test("shows contact details and starts an audio call", () => {
  const call = vi.fn();
  render(<ConnectUserDetailsCard displayName="Asha Patel" jobTitle="Designer" email="asha@example.com" onStartCall={call} />);
  fireEvent.click(screen.getByLabelText("Audio"));
  expect(call).toHaveBeenCalledWith("audio");
  expect(screen.getByText("asha@example.com")).toBeInTheDocument();
});
