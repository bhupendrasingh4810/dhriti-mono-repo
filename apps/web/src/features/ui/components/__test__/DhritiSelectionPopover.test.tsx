import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DhritiComboboxFlat, DhritiDateField, DhritiSelectMenu } from "@dhriti/ui";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const options = [
  { value: "alex", label: "Alex Morgan" },
  { value: "sam", label: "Sam Taylor" },
];

function SelectParent() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  return (
    <DhritiSelectMenu
      label="Reporting manager"
      placeholder="No manager"
      value={value}
      onChange={setValue}
      options={options}
      open={open}
      onOpenChange={setOpen}
    />
  );
}

function mockGeometry({ top, bottom, popupHeight = 230 }: { top: number; bottom: number; popupHeight?: number }) {
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
    const style = original(element);
    style.setProperty("--field-picker-gutter", "16px");
    style.setProperty("--field-picker-gap", "6px");
    return style;
  });
  return vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const popup = this.parentElement === document.body && this.classList.contains("fixed");
    const rect = popup
      ? { x: 0, y: 0, left: 0, top: 0, right: 300, bottom: popupHeight, width: 300, height: popupHeight }
      : { x: 40, y: top, left: 40, top, right: 340, bottom, width: 300, height: bottom - top };
    return { ...rect, toJSON: () => rect };
  });
}

describe("selection floating popovers", () => {
  it("keeps a native modal's menu in its top layer and accepts selection without closing the dialog", async () => {
    const close = vi.fn();
    render(
      <dialog
        open
        aria-label="Payroll form"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="overflow-y-auto">
          <SelectParent />
        </div>
      </dialog>,
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Reporting manager" }));
    const popup = screen.getByRole("listbox").parentElement!;
    expect(popup.parentElement).toBe(dialog);
    expect(popup).toHaveClass("fixed");
    await userEvent.click(within(dialog).getByRole("option", { name: "Sam Taylor" }));
    expect(screen.getByRole("button", { name: "Reporting manager" })).toHaveTextContent("Sam Taylor");
    expect(close).not.toHaveBeenCalled();
  });

  it("keeps calendar controls within the native dialog and updates the parent date", async () => {
    function Parent() {
      const [value, setValue] = useState("");
      const [open, setOpen] = useState(false);
      const [month, setMonth] = useState("2026-11");
      return (
        <dialog open aria-label="Payroll">
          <DhritiDateField
            label="Pay date"
            value={value}
            onChange={setValue}
            month={month}
            onMonthChange={setMonth}
            open={open}
            onOpenChange={setOpen}
          />
          <output aria-label="Selected date">{value}</output>
        </dialog>
      );
    }
    render(<Parent />);
    await userEvent.click(screen.getByRole("button", { name: "Pay date" }));
    const calendar = screen.getByRole("dialog", { name: "Pay date calendar" });
    expect(screen.getByRole("dialog", { name: "Payroll" }).contains(calendar)).toBe(true);
    await userEvent.click(within(calendar).getByRole("button", { name: /15 November 2026/ }));
    expect(screen.getByLabelText("Selected date")).toHaveTextContent("2026-11-15");
  });

  it("does not open when clicking the label or surrounding space; the padded control opens it", async () => {
    const { container } = render(<SelectParent />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Reporting manager"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(container.firstElementChild!);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Reporting manager" });
    await user.click(trigger.parentElement!);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Alex Morgan" }));
    expect(trigger).toHaveTextContent("Alex Morgan");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens above a bottom-edge field without putting the dropdown into the form scroll area", () => {
    const top = window.innerHeight - 100,
      bottom = top + 42;
    mockGeometry({ top, bottom });
    const { container } = render(
      <div className="overflow-y-auto">
        <SelectParent />
      </div>,
    );
    const before = container.innerHTML;
    fireEvent.click(screen.getByRole("button", { name: "Reporting manager" }));
    const popup = screen.getByRole("listbox").parentElement!;
    expect(popup.parentElement).toBe(document.body);
    expect(container.contains(popup)).toBe(false);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(before).not.toContain('role="listbox"');
    expect(popup.style.top).toBe(`${top - 6 - 230}px`);
    expect(popup.style.left).toBe("40px");
    expect(popup.style.width).toBe("300px");
    expect(popup.style.maxHeight).toBe(`${top - 16 - 6}px`);
  });

  it("opens below when space exists and repositions on scrolling", () => {
    const geometry = mockGeometry({ top: 100, bottom: 142 });
    render(<SelectParent />);
    fireEvent.click(screen.getByRole("button", { name: "Reporting manager" }));
    const popup = screen.getByRole("listbox").parentElement!;
    expect(popup.style.top).toBe("148px");
    geometry.mockRestore();
    mockGeometry({ top: 120, bottom: 162 });
    fireEvent.scroll(window);
    expect(popup.style.top).toBe("168px");
  });

  it("limits tall dropdowns to available space and keeps them scrollable", () => {
    const top = Math.floor(window.innerHeight / 2),
      bottom = top + 42;
    mockGeometry({ top, bottom, popupHeight: window.innerHeight * 2 });
    render(<SelectParent />);
    fireEvent.click(screen.getByRole("button", { name: "Reporting manager" }));
    const popup = screen.getByRole("listbox").parentElement!;
    expect(popup.style.maxHeight).toBe(`${top - 16 - 6}px`);
    expect(popup.style.top).toBe("16px");
    expect(popup).toHaveClass("overflow-y-auto");
  });

  it("treats clicks inside a portalled menu as inside, and keeps keyboard and outside dismissal working", async () => {
    const onOpenChange = vi.fn(),
      onChange = vi.fn();
    render(
      <DhritiSelectMenu
        label="Manager"
        value={null}
        onChange={onChange}
        options={options}
        open
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.pointerDown(screen.getByRole("option", { name: "Sam Taylor" }));
    expect(onOpenChange).not.toHaveBeenCalled();
    const trigger = screen.getByRole("button", { name: "Manager" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Alex Morgan" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger).toHaveFocus();
    onOpenChange.mockClear();
    fireEvent.pointerDown(document.body);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not open a combobox from its label or focus and does not reopen after Escape", async () => {
    function Parent() {
      const [open, setOpen] = useState(false),
        [value, setValue] = useState<string[]>([]),
        [search, setSearch] = useState("");
      return (
        <DhritiComboboxFlat
          label="Members"
          value={value}
          onChange={setValue}
          options={options}
          open={open}
          onOpenChange={setOpen}
          search={search}
          onSearchChange={setSearch}
        />
      );
    }
    const { container } = render(<Parent />);
    await userEvent.click(screen.getByText("Members"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await userEvent.click(input);
    expect(container.contains(screen.getByRole("listbox"))).toBe(false);
    await userEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Alex Morgan" }));
    expect(screen.getByRole("button", { name: "Remove Alex Morgan" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });
});
