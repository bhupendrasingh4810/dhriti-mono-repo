import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DhritiDateField } from "@dhriti/ui";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("controlled month and year pickers", () => {
  it.each(["month", "year"] as const)("emits %s values without changing the parent's selection", async (mode) => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn();
    render(
      <DhritiDateField
        label="Period"
        mode={mode}
        value={mode === "month" ? "2026-11" : "2026"}
        onChange={onChange}
        month="2026-11"
        onMonthChange={vi.fn()}
        open
        onOpenChange={onOpenChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: mode === "month" ? "December 2026" : "2027" }));
    expect(onChange).toHaveBeenCalledWith(mode === "month" ? "2026-12" : "2027");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Period" })).toHaveTextContent(
      mode === "month" ? "November 2026" : "2026",
    );
  });

  it.each(["month", "year"] as const)("enforces %s bounds and disables navigation outside them", (mode) => {
    render(
      <DhritiDateField
        label="Period"
        mode={mode}
        value=""
        onChange={vi.fn()}
        month="2026-11"
        onMonthChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
        min={mode === "month" ? "2026-04" : "2023"}
        max={mode === "month" ? "2026-09" : "2026"}
      />,
    );
    expect(screen.getByRole("button", { name: mode === "month" ? "March 2026" : "2022" })).toBeDisabled();
    expect(screen.getByRole("button", { name: mode === "month" ? "April 2026" : "2026" })).toBeEnabled();
    expect(screen.getByRole("button", { name: mode === "month" ? "October 2026" : "2027" })).toBeDisabled();
    expect(screen.getByRole("button", { name: mode === "month" ? "Previous year" : "Previous years" })).toBeDisabled();
    expect(screen.getByRole("button", { name: mode === "month" ? "Next year" : "Next years" })).toBeDisabled();
  });

  it.each(["month", "year"] as const)("keeps %s keyboard navigation and clearing parent-controlled", async (mode) => {
    function Parent() {
      const [value, setValue] = useState(mode === "month" ? "2026-12" : "2027");
      const [month, setMonth] = useState("2026-12"),
        [open, setOpen] = useState(false);
      return (
        <DhritiDateField
          label="Period"
          mode={mode}
          value={value}
          onChange={setValue}
          month={month}
          onMonthChange={setMonth}
          open={open}
          onOpenChange={setOpen}
          clearable
        />
      );
    }
    render(<Parent />);
    await userEvent.click(screen.getByRole("button", { name: "Period" }));
    expect(screen.getByRole("button", { name: mode === "month" ? "December 2026" : "2027" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: mode === "month" ? "January 2027" : "2028" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Period" })).toHaveTextContent(
      mode === "month" ? "January 2027" : "2028",
    );
    await userEvent.click(screen.getByRole("button", { name: "Clear Period" }));
    expect(screen.getByRole("button", { name: "Period" })).toHaveTextContent(/^$/);
  });

  it("navigates year blocks without selecting a year and restores focus on Escape", async () => {
    function Parent() {
      const [month, setMonth] = useState("2026-11"),
        [open, setOpen] = useState(false);
      return (
        <DhritiDateField
          label="Year"
          mode="year"
          value="2026"
          onChange={vi.fn()}
          month={month}
          onMonthChange={setMonth}
          open={open}
          onOpenChange={setOpen}
        />
      );
    }
    render(<Parent />);
    await userEvent.click(screen.getByRole("button", { name: "Year" }));
    await userEvent.click(screen.getByRole("button", { name: "Next years" }));
    expect(screen.getByRole("button", { name: "2030" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Year" })).toHaveTextContent("2026");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Year" })).toHaveFocus();
  });

  it.each(["month", "year"] as const)("blocks disabled and read-only %s pickers", (mode) => {
    const props = {
      label: "Period",
      mode,
      value: "",
      onChange: vi.fn(),
      month: "2026-11",
      onMonthChange: vi.fn(),
      open: true,
      onOpenChange: vi.fn(),
    };
    const { rerender } = render(<DhritiDateField {...props} disabled />);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    rerender(<DhritiDateField {...props} readOnly />);
    fireEvent.click(screen.getByRole("button", { name: "Period" }));
    expect(props.onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it.each([
    { mode: "month" as const, value: "2026-13" },
    { mode: "year" as const, value: "26" },
    { mode: "month" as const, value: "2026-11-01" },
  ])("rejects invalid $mode selection contracts", ({ mode, value }) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <DhritiDateField
          label="Period"
          mode={mode}
          value={value}
          onChange={vi.fn()}
          month="2026-11"
          onMonthChange={vi.fn()}
          open={false}
          onOpenChange={vi.fn()}
        />,
      ),
    ).toThrow(RangeError);
  });
  it.each(["month", "year"] as const)("rejects reversed %s bounds", (mode) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <DhritiDateField
          label="Period"
          mode={mode}
          value=""
          onChange={vi.fn()}
          month="2026-11"
          onMonthChange={vi.fn()}
          open={false}
          onOpenChange={vi.fn()}
          min={mode === "month" ? "2027-01" : "2027"}
          max={mode === "month" ? "2026-12" : "2026"}
        />,
      ),
    ).toThrow(RangeError);
  });
  it("limits the last year block to the four-digit contract", () => {
    render(
      <DhritiDateField
        label="Year"
        mode="year"
        value="9999"
        onChange={vi.fn()}
        month="9999-01"
        onMonthChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "9999" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "10000" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next years" })).toBeDisabled();
  });
});
