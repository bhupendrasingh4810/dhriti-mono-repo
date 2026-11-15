import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DhritiButton, DhritiSwitchField } from "@dhriti/ui";

afterEach(cleanup);

describe("shared controls", () => {
  it("provides an accessible controlled switch with keyboard and form behavior", async () => {
    function Demo() {
      const [checked, setChecked] = useState(false);
      return <form data-testid="form"><DhritiSwitchField label="Require MFA" name="mfa" value="enabled" checked={checked} onChange={setChecked} /></form>;
    }
    render(<Demo />);
    const control = screen.getByRole("switch", { name: "Require MFA" });
    expect(control).not.toBeChecked();
    control.focus();
    await userEvent.keyboard(" ");
    expect(control).toBeChecked();
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("mfa")).toBe("enabled");
  });

  it("blocks read-only and disabled switches and shows required errors", () => {
    const onChange = vi.fn();
    render(<>
      <form data-testid="form"><DhritiSwitchField label="Read only" name="readOnly" checked onChange={onChange} readOnly /></form>
      <DhritiSwitchField label="Disabled" checked={false} onChange={onChange} disabled />
      <DhritiSwitchField label="Confirm" checked={false} onChange={onChange} required error="Confirmation is required." showLabel={false} />
    </>);
    const readOnly = screen.getByRole("switch", { name: "Read only" });
    expect(readOnly).toHaveAttribute("aria-readonly", "true");
    fireEvent.click(readOnly);
    expect(readOnly).toBeChecked();
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("readOnly")).toBe("on");
    expect(screen.getByRole("switch", { name: "Disabled" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("switch", { name: "Confirm" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Confirmation is required.");
  });

  it("supports button variants, native attributes and loading state", () => {
    const onClick = vi.fn();
    const { rerender } = render(<DhritiButton type="submit" variant="danger" onClick={onClick}>Delete organization</DhritiButton>);
    const button = screen.getByRole("button", { name: "Delete organization" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveClass("border-error");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<DhritiButton loading onClick={onClick}>Saving</DhritiButton>);
    const loading = screen.getByRole("button", { name: "Saving" });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading).toHaveAttribute("type", "button");
    fireEvent.click(loading);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
