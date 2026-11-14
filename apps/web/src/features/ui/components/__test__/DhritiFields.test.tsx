import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DhritiComboboxFlat,
  DhritiComboboxGrouped,
  DhritiComboboxHierarchy,
  DhritiCountryField,
  DhritiEmailField,
  DhritiNumberField,
  DhritiPasswordField,
  DhritiPhoneField,
  DhritiSelectMenu,
  DhritiTextField,
  type FieldOptionGroup,
  type DhritiTextFieldProps,
} from "@dhriti/ui";

afterEach(cleanup);
const options = [
  { value: "connect", label: "Connect" },
  { value: "flow", label: "Flow" },
];
const countries = [
  { code: "IN", name: "India", flag: "IN", dialCode: "+91" },
  { code: "GB", name: "United Kingdom", flag: "GB", dialCode: "+44" },
];
const groups: FieldOptionGroup[] = [
  {
    value: "engineering",
    label: "Engineering",
    options: [
      { value: "frontend", label: "Frontend" },
      { value: "backend", label: "Backend" },
      { value: "locked", label: "Locked team", disabled: true },
    ],
  },
];

describe("controlled Dhriti fields", () => {
  it("emits text/clear callbacks without updating the supplied value", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DhritiTextField label="Name" value="Parent name" onChange={onChange} clearable />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New name" } });
    expect(onChange).toHaveBeenLastCalledWith("New name");
    expect(screen.getByLabelText("Name")).toHaveValue("Parent name");
    fireEvent.click(screen.getByRole("button", { name: "Clear Name" }));
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByLabelText("Name")).toHaveValue("Parent name");
    rerender(<DhritiTextField label="Name" value="Accepted name" onChange={onChange} />);
    expect(screen.getByLabelText("Name")).toHaveValue("Accepted name");
  });

  it("connects a required error to its input and displays it immediately below the field", () => {
    render(
      <DhritiTextField
        label="Name"
        required
        error="Name is required"
        helperText="A helper"
        value=""
        onChange={vi.fn()}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Name" });
    const error = screen.getByRole("alert");
    expect(input).toHaveAttribute("required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);
    expect(input.parentElement).toHaveClass("border-error");
    expect(input.parentElement?.nextElementSibling).toBe(error);
    expect(error).toHaveTextContent("Name is required");
    expect(screen.queryByText("A helper")).not.toBeInTheDocument();
  });

  it("provides hidden-label accessibility and unique identifiers", () => {
    render(
      <>
        <DhritiTextField label="First" showLabel={false} value="" onChange={vi.fn()} />
        <DhritiTextField label="Second" value="" onChange={vi.fn()} success />
      </>,
    );
    const first = screen.getByLabelText("First");
    const second = screen.getByLabelText("Second");
    expect(first.id).not.toBe(second.id);
    expect(second).toHaveAttribute("aria-describedby", screen.getByText("Looks good!").id);
  });

  it.each(["outlined", "filled", "underline"] as const)(
    "uses the %s visual variant and preserves error styling",
    (variant) => {
      render(<DhritiTextField label="Name" variant={variant} error="Required" value="" onChange={vi.fn()} />);
      expect(screen.getByLabelText("Name").parentElement).toHaveClass("border-error");
      expect(screen.getByLabelText("Name").parentElement).toHaveClass(
        variant === "underline" ? "border-b-2" : "rounded-md",
      );
    },
  );

  it.each(["disabled", "readOnly"] as const)("blocks text editing and clear when %s", (state) => {
    const onChange = vi.fn();
    render(<DhritiTextField label="Name" value="Parent" onChange={onChange} clearable {...{ [state]: true }} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Other" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear Name" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses parent-owned email validation rather than performing its own regex checks", () => {
    const onBlur = vi.fn();
    render(<DhritiEmailField label="Email" value="not-an-email" onChange={vi.fn()} onBlur={onBlur} />);
    fireEvent.blur(screen.getByLabelText("Email"));
    expect(onBlur).toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses native decimal stepping, restores controlled values and honors bounds", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DhritiNumberField label="Seats" value="0.2" step={0.1} min={0} max={1} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Increase Seats" }));
    expect(onChange).toHaveBeenLastCalledWith("0.3");
    expect(screen.getByRole("spinbutton")).toHaveValue(0.2);
    rerender(<DhritiNumberField label="Seats" value="1" max={1} onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Increase Seats" })).toBeDisabled();
  });

  it("supports empty number values and no implicit minimum", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DhritiNumberField label="Adjustment" value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Decrease Adjustment" }));
    expect(onChange).toHaveBeenLastCalledWith("-1");
    rerender(<DhritiNumberField label="Adjustment" value="5" onChange={onChange} readOnly />);
    expect(screen.queryByRole("button", { name: "Decrease Adjustment" })).not.toBeInTheDocument();
  });

  it("does not calculate password strength or change visibility internally", () => {
    const onVisibleChange = vi.fn();
    const { rerender } = render(
      <DhritiPasswordField
        label="Password"
        value="weak"
        onChange={vi.fn()}
        visible={false}
        onVisibleChange={onVisibleChange}
        strength={{ score: 4, label: "Parent rating", tone: "brand" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show Password" }));
    expect(onVisibleChange).toHaveBeenCalledWith(true);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "4");
    rerender(
      <DhritiPasswordField
        label="Password"
        value="weak"
        onChange={vi.fn()}
        visible
        onVisibleChange={onVisibleChange}
        readOnly
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Hide Password" }));
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  });

  it("shows password errors immediately below the input, before strength details", () => {
    render(
      <DhritiPasswordField
        label="Password"
        value="weak"
        onChange={vi.fn()}
        visible={false}
        onVisibleChange={vi.fn()}
        error="Password is too short"
        strength={{ score: 1, label: "Weak", tone: "error" }}
      />,
    );
    expect(screen.getByLabelText("Password").parentElement?.nextElementSibling).toBe(screen.getByRole("alert"));
    expect(screen.getByRole("alert").nextElementSibling).toBe(screen.getByRole("meter"));
  });

  it("emits unformatted phone input and controlled country/search changes", () => {
    const onChange = vi.fn(),
      onCountryCodeChange = vi.fn(),
      onSearchChange = vi.fn(),
      onOpenChange = vi.fn();
    render(
      <DhritiPhoneField
        label="Phone"
        value="+(123)"
        onChange={onChange}
        countries={countries}
        countryCode="IN"
        onCountryCodeChange={onCountryCodeChange}
        open
        onOpenChange={onOpenChange}
        search=""
        onSearchChange={onSearchChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "ext 42" } });
    expect(onChange).toHaveBeenCalledWith("ext 42");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "United" } });
    expect(onSearchChange).toHaveBeenCalledWith("United");
    expect(screen.getAllByRole("option")).toHaveLength(2);
    fireEvent.click(screen.getByRole("option", { name: /United Kingdom/ }));
    expect(onCountryCodeChange).toHaveBeenCalledWith("GB");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Country code for Phone" })).toHaveTextContent("+91");
  });

  it("filters country options and renders a sibling clear button, not a nested control", () => {
    const onChange = vi.fn();
    render(
      <DhritiCountryField
        label="Country"
        value="IN"
        onChange={onChange}
        countries={countries}
        open
        onOpenChange={vi.fn()}
        search="United"
        onSearchChange={vi.fn()}
        clearable
      />,
    );
    expect(screen.getAllByRole("option")).toHaveLength(1);
    const clear = screen.getByRole("button", { name: "Clear Country" });
    expect(clear.parentElement?.closest("button")).toBeNull();
    fireEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole("button", { name: "Country" })).toHaveTextContent("India");
  });

  it("does not open, select, or clear a read-only select", () => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn();
    render(
      <DhritiSelectMenu
        label="App"
        value="connect"
        onChange={onChange}
        options={options}
        open
        onOpenChange={onOpenChange}
        clearable
        readOnly
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "App" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear App" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("emits selection and dismissal without taking ownership of either value", () => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn();
    render(
      <DhritiSelectMenu
        label="App"
        value={null}
        onChange={onChange}
        options={options}
        open
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(screen.getByRole("option", { name: "Connect" }));
    expect(onChange).toHaveBeenCalledWith("connect");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("option", { name: "Connect" })).toHaveAttribute("aria-selected", "false");
    fireEvent.pointerDown(document.body);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("supports keyboard option navigation and Escape focus restoration", async () => {
    function Parent() {
      const [open, setOpen] = useState(false);
      const [value, setValue] = useState<string | null>(null);
      return (
        <DhritiSelectMenu
          label="App"
          value={value}
          onChange={setValue}
          options={options}
          open={open}
          onOpenChange={setOpen}
        />
      );
    }
    const user = userEvent.setup();
    render(<Parent />);
    const trigger = screen.getByRole("button", { name: "App" });
    await user.click(trigger);
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Connect" })).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(trigger).toHaveTextContent("Flow");
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders empty menus and handles long labels without data truncation", () => {
    const { rerender } = render(
      <DhritiSelectMenu label="App" value={null} onChange={vi.fn()} options={[]} open onOpenChange={vi.fn()} />,
    );
    expect(screen.getByText("No options found")).toBeInTheDocument();
    const label = "Connect ".repeat(25);
    rerender(
      <DhritiSelectMenu
        label="App"
        value="long"
        onChange={vi.fn()}
        options={[{ value: "long", label }]}
        open={false}
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "App" })).toHaveTextContent(label.trim());
  });

  it("keeps flat search, chips, selection and clearing parent-controlled", () => {
    const onChange = vi.fn(),
      onSearchChange = vi.fn();
    render(
      <DhritiComboboxFlat
        label="Apps"
        value={["connect"]}
        onChange={onChange}
        options={options}
        open
        onOpenChange={vi.fn()}
        search=""
        onSearchChange={onSearchChange}
        clearable
      />,
    );
    fireEvent.click(screen.getByRole("option", { name: "Flow" }));
    expect(onChange).toHaveBeenLastCalledWith(["connect", "flow"]);
    expect(screen.getByRole("option", { name: "Flow" })).toHaveAttribute("aria-selected", "false");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Flow" } });
    expect(onSearchChange).toHaveBeenCalledWith("Flow");
    expect(screen.getByRole("combobox")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Remove Connect" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("preserves disabled selections while clearing other chips", () => {
    const onChange = vi.fn();
    render(
      <DhritiComboboxFlat
        label="Apps"
        value={["connect", "flow"]}
        onChange={onChange}
        options={[{ ...options[0], disabled: true }, options[1]]}
        open
        onOpenChange={vi.fn()}
        search=""
        onSearchChange={vi.fn()}
        clearable
      />,
    );
    expect(screen.getByRole("button", { name: "Remove Connect" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Clear Apps" }));
    expect(onChange).toHaveBeenCalledWith(["connect"]);
  });

  it("emits group selection/expansion and renders mixed tree state without changing props", () => {
    const onChange = vi.fn(),
      onExpandedChange = vi.fn();
    render(
      <DhritiComboboxHierarchy
        label="Teams"
        value={["frontend"]}
        onChange={onChange}
        groups={groups}
        open
        onOpenChange={vi.fn()}
        expanded={["engineering"]}
        onExpandedChange={onExpandedChange}
      />,
    );
    expect(screen.getByRole("treeitem", { name: "Engineering" })).toHaveAttribute("aria-checked", "mixed");
    fireEvent.click(screen.getByRole("button", { name: "Select all Engineering" }));
    expect(onChange).toHaveBeenCalledWith(["frontend", "backend"]);
    expect(screen.getByRole("treeitem", { name: "Backend" })).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("button", { name: "Collapse Engineering" }));
    expect(onExpandedChange).toHaveBeenCalledWith([]);
    expect(screen.getByRole("treeitem", { name: "Frontend" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Locked team" })).toBeDisabled();
  });

  it("renders grouped member headings and emits leaf selection", () => {
    const onChange = vi.fn();
    render(
      <DhritiComboboxGrouped
        label="Members"
        value={[]}
        onChange={onChange}
        groups={groups}
        open
        onOpenChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("group", { name: "Engineering" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Frontend" }));
    expect(onChange).toHaveBeenCalledWith(["frontend"]);
  });

  it.each(["disabled", "readOnly"] as const)("blocks menu, chip and search changes when a combobox is %s", (state) => {
    const onChange = vi.fn(),
      onOpenChange = vi.fn(),
      onSearchChange = vi.fn();
    render(
      <DhritiComboboxFlat
        label="Apps"
        value={["connect"]}
        onChange={onChange}
        options={options}
        open
        onOpenChange={onOpenChange}
        search=""
        onSearchChange={onSearchChange}
        clearable
        {...{ [state]: true }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Connect" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear Apps" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Flow" } });
    fireEvent.focus(screen.getByRole("combobox"));
    expect(onChange).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onSearchChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps a parent-controlled combobox open after focusing and clicking it", async () => {
    function Parent(props: Pick<DhritiTextFieldProps, "label">) {
      const [open, setOpen] = useState(false),
        [value, setValue] = useState<string[]>([]),
        [search, setSearch] = useState("");
      return (
        <DhritiComboboxFlat
          {...props}
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
    render(<Parent label="Apps" />);
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });
});
