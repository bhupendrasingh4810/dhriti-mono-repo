import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DhritiDateField, DhritiFileInput, DhritiTextareaField, DhritiTimeField } from "@dhriti/ui";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.documentElement.style.removeProperty("--field-picker-gutter");
  document.documentElement.style.removeProperty("--field-picker-gap");
});

describe("Dhriti textarea", () => {
  it("emits without changing parent value and renders native textarea features", () => {
    const onChange = vi.fn();
    render(
      <DhritiTextareaField
        label="Reason"
        value="Parent"
        onChange={onChange}
        rows={4}
        maxLength={100}
        showCharacterCount
      />,
    );
    const input = screen.getByRole("textbox", { name: "Reason" });
    fireEvent.change(input, { target: { value: "New reason" } });
    expect(onChange).toHaveBeenCalledWith("New reason");
    expect(input).toHaveValue("Parent");
    expect(input).toHaveAttribute("rows", "4");
    expect(input).toHaveAttribute("maxlength", "100");
    expect(screen.getByLabelText("Character count")).toHaveTextContent("6 / 100");
  });

  it("places required errors before character counts", () => {
    render(
      <DhritiTextareaField
        label="Reason"
        required
        error="Add a reason"
        value=""
        onChange={vi.fn()}
        showCharacterCount
      />,
    );
    const input = screen.getByRole("textbox", { name: "Reason" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-error");
    expect(input.nextElementSibling).toBe(screen.getByRole("alert"));
    expect(input).toHaveAttribute("aria-describedby", screen.getByRole("alert").id);
  });

  it.each(["disabled", "readOnly"] as const)("blocks textarea editing when %s", (state) => {
    const onChange = vi.fn();
    render(<DhritiTextareaField label="Reason" value="" onChange={onChange} {...{ [state]: true }} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Other" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Dhriti file input", () => {
  const file = new File(["PDF"], "leave.pdf", { type: "application/pdf" });
  it("emits files without owning selection and allows repeated chooser selections", () => {
    const onChange = vi.fn();
    render(<DhritiFileInput label="Attachment" value={[]} onChange={onChange} accept=".pdf" />);
    const input = screen.getByLabelText("Attachment");
    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", ".pdf");
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith([file]);
    expect(input).toHaveValue("");
    expect(screen.queryByText("leave.pdf")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { files: [] } });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("routes chooser activation and drop selection to the parent without imposing validation", () => {
    const onChange = vi.fn();
    render(<DhritiFileInput label="Attachment" value={[]} onChange={onChange} accept=".pdf" />);
    const input = screen.getByLabelText("Attachment");
    const click = vi.spyOn(input, "click");
    fireEvent.click(screen.getByRole("button", { name: "Choose Attachment" }));
    expect(click).toHaveBeenCalled();
    const invalid = new File(["unaccepted"], "script.txt", { type: "text/plain" });
    fireEvent.drop(input.parentElement!, { dataTransfer: { files: [invalid, file] } });
    expect(onChange).toHaveBeenCalledWith([invalid]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("supports multiple files, parent-owned removal and error/progress display", () => {
    const onChange = vi.fn();
    const second = new File(["image"], "photo.png", { type: "image/png" });
    const { rerender } = render(
      <DhritiFileInput
        label="Attachment"
        multiple
        value={[file, second]}
        onChange={onChange}
        error="File is too large"
      />,
    );
    expect(screen.getByLabelText("Attachment")).toHaveAttribute("multiple");
    expect(screen.getByRole("alert")).toHaveTextContent("File is too large");
    fireEvent.click(screen.getByRole("button", { name: "Remove leave.pdf" }));
    expect(onChange).toHaveBeenCalledWith([second]);
    expect(screen.getByText("leave.pdf")).toBeInTheDocument();
    rerender(<DhritiFileInput label="Attachment" value={[file]} onChange={onChange} uploading progress={50} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "50");
    expect(screen.getByRole("button", { name: "Remove leave.pdf" })).toBeDisabled();
    expect(screen.getByLabelText("Attachment")).toBeDisabled();
  });

  it.each(["disabled", "readOnly", "uploading"] as const)("blocks file chooser, drops and removal when %s", (state) => {
    const onChange = vi.fn();
    render(<DhritiFileInput label="Attachment" value={[file]} onChange={onChange} {...{ [state]: true }} />);
    const input = screen.getByLabelText("Attachment");
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.drop(input.parentElement!, { dataTransfer: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Remove leave.pdf" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Dhriti date field", () => {
  const props = {
    label: "From date",
    value: "2026-11-14",
    onChange: vi.fn(),
    month: "2026-11",
    onMonthChange: vi.fn(),
    open: true,
    onOpenChange: vi.fn(),
  };
  it("formats dates, focuses selection, emits changes and does not mutate month or value", () => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn(),
      onMonthChange = vi.fn();
    render(
      <DhritiDateField {...props} onChange={onChange} onOpenChange={onOpenChange} onMonthChange={onMonthChange} />,
    );
    expect(screen.getByRole("button", { name: "From date" })).toHaveTextContent("14 Nov 2026");
    expect(screen.getByRole("button", { name: "Saturday, 14 November 2026" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Sunday, 15 November 2026" }));
    expect(onChange).toHaveBeenCalledWith("2026-11-15");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "From date" })).toHaveTextContent("14 Nov 2026");
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenCalledWith("2026-12");
    expect(screen.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
  });

  it("enforces calendar bounds and leaves disallowed days unselectable", () => {
    render(<DhritiDateField {...props} min="2026-11-14" max="2026-11-16" />);
    expect(screen.getByRole("button", { name: "Friday, 13 November 2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tuesday, 17 November 2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  it("supports leap days, Monday-first calendars and explicit invalid-date errors", () => {
    const { unmount } = render(<DhritiDateField {...props} value="2028-02-29" month="2028-02" weekStartsOn={1} />);
    expect(screen.getByRole("button", { name: "Tuesday, 29 February 2028" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("aria-label", "Monday");
    unmount();
    expect(() => render(<DhritiDateField {...props} value="2026-02-29" />)).toThrow(RangeError);
  });

  it("moves focus across month boundaries without selecting and restores focus on Escape", async () => {
    function Parent() {
      const [month, setMonth] = useState("2026-11"),
        [open, setOpen] = useState(true);
      return (
        <DhritiDateField
          {...props}
          value="2026-11-30"
          month={month}
          onMonthChange={setMonth}
          open={open}
          onOpenChange={setOpen}
        />
      );
    }
    render(<Parent />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Tuesday, 1 December 2026" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "From date" })).toHaveTextContent("30 Nov 2026");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "From date" })).toHaveFocus();
  });

  it.each(["disabled", "readOnly"] as const)("blocks date opening and clearing when %s", (state) => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn();
    render(
      <DhritiDateField {...props} clearable onChange={onChange} onOpenChange={onOpenChange} {...{ [state]: true }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "From date" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear From date" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("Dhriti time field", () => {
  const props = { label: "Clock in", value: "09:00", onChange: vi.fn(), open: true, onOpenChange: vi.fn() };
  it("portals out of clipping containers and clamps/flips within the viewport", () => {
    document.documentElement.style.setProperty("--field-picker-gutter", "16px");
    document.documentElement.style.setProperty("--field-picker-gap", "6px");
    const width = window.innerWidth,
      height = window.innerHeight;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const rect =
        this.getAttribute("role") === "dialog"
          ? { x: 0, y: 0, top: 0, left: 0, right: 288, bottom: 360, width: 288, height: 360 }
          : {
              x: width - 100,
              y: height - 50,
              top: height - 50,
              left: width - 100,
              right: width,
              bottom: height - 10,
              width: 100,
              height: 40,
            };
      return { ...rect, toJSON: () => rect };
    });
    const { container } = render(
      <div style={{ overflow: "hidden" }}>
        <DhritiTimeField {...props} />
      </div>,
    );
    const popup = screen.getByRole("dialog");
    expect(container.contains(popup)).toBe(false);
    expect(popup.parentElement).toBe(document.body);
    expect(popup.style.left).toBe(`${width - 16 - 288}px`);
    expect(popup.style.top).toBe(`${height - 50 - 6 - 360}px`);
  });
  it("uses labeled columns, emits immediately, and Done only requests dismissal", () => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn();
    render(<DhritiTimeField {...props} onChange={onChange} onOpenChange={onOpenChange} />);
    const hours = within(screen.getByRole("listbox", { name: "Clock in Hours" }));
    const minutes = within(screen.getByRole("listbox", { name: "Clock in Minutes" }));
    expect(hours.getByRole("option", { name: "09" })).toHaveFocus();
    fireEvent.click(hours.getByRole("option", { name: "10" }));
    expect(onChange).toHaveBeenLastCalledWith("10:00");
    fireEvent.click(minutes.getByRole("option", { name: "30" }));
    expect(onChange).toHaveBeenLastCalledWith("09:30");
    expect(screen.getByRole("button", { name: "Clock in" })).toHaveTextContent("09:00");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("preserves off-step minutes and clamps hour changes to the allowed interval", () => {
    const onChange = vi.fn();
    render(<DhritiTimeField {...props} value="09:47" onChange={onChange} min="09:07" max="10:12" minuteStep={15} />);
    const hours = within(screen.getByRole("listbox", { name: "Clock in Hours" }));
    const minutes = within(screen.getByRole("listbox", { name: "Clock in Minutes" }));
    expect(minutes.getByRole("option", { name: "47" })).toHaveAttribute("aria-selected", "true");
    expect(hours.getByRole("option", { name: "08" })).toBeDisabled();
    expect(minutes.getByRole("option", { name: "00" })).toBeDisabled();
    fireEvent.click(hours.getByRole("option", { name: "10" }));
    expect(onChange).toHaveBeenCalledWith("10:12");
  });

  it("supports empty times without inventing a displayed selection", () => {
    const onChange = vi.fn();
    render(<DhritiTimeField {...props} value="" onChange={onChange} placeholder="Choose time" />);
    expect(screen.getByRole("button", { name: "Clock in" })).toHaveTextContent("Choose time");
    expect(screen.queryByRole("option", { selected: true })).not.toBeInTheDocument();
    const hours = within(screen.getByRole("listbox", { name: "Clock in Hours" }));
    fireEvent.click(hours.getByRole("option", { name: "09" }));
    expect(onChange).toHaveBeenCalledWith("09:00");
  });

  it("supports keyboard navigation, parent updates, Done focus and outside dismissal", async () => {
    function Parent() {
      const [value, setValue] = useState("09:00"),
        [open, setOpen] = useState(true);
      return <DhritiTimeField {...props} value={value} onChange={setValue} open={open} onOpenChange={setOpen} />;
    }
    render(<Parent />);
    const user = userEvent.setup();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("button", { name: "Clock in" })).toHaveTextContent("10:00");
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("button", { name: "Clock in" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Clock in" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(["disabled", "readOnly"] as const)("blocks time controls when %s", (state) => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn();
    render(
      <DhritiTimeField {...props} clearable onChange={onChange} onOpenChange={onOpenChange} {...{ [state]: true }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear Clock in" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it.each([{ value: "24:00" }, { value: "09:00", minuteStep: 7 }, { value: "09:00", min: "11:00", max: "10:00" }])(
    "reports invalid time contracts explicitly: %j",
    (invalid) => {
      expect(() => render(<DhritiTimeField {...props} {...invalid} />)).toThrow(RangeError);
    },
  );
});
