import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DhritiCheckboxField, DhritiRadioField, DhritiSearchField } from "@dhriti/ui";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("Dhriti search field", () => {
  it("updates the controlled draft immediately and debounces only the final query", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    function Parent() {
      const [value, setValue] = useState("");
      return (
        <DhritiSearchField label="Search" value={value} onChange={setValue} onSearch={onSearch} debounceMs={300} />
      );
    }
    render(<Parent />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "A" } });
    act(() => vi.advanceTimersByTime(200));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Alex" } });
    expect(screen.getByRole("textbox")).toHaveValue("Alex");
    act(() => vi.advanceTimersByTime(299));
    expect(onSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("Alex");
    fireEvent.click(screen.getByRole("button", { name: "Clear Search" }));
    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenLastCalledWith("");
  });
  it("does not emit on mount, without a parent value change, or after unmount", () => {
    vi.useFakeTimers();
    const onChange = vi.fn(),
      onSearch = vi.fn();
    const { rerender, unmount } = render(
      <DhritiSearchField label="Search" value="" onChange={onChange} onSearch={onSearch} />,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Other" } });
    act(() => vi.advanceTimersByTime(500));
    expect(onChange).toHaveBeenCalledWith("Other");
    expect(onSearch).not.toHaveBeenCalled();
    rerender(<DhritiSearchField label="Search" value="Alex" onChange={onChange} onSearch={onSearch} />);
    unmount();
    act(() => vi.advanceTimersByTime(500));
    expect(onSearch).not.toHaveBeenCalled();
  });
  it("uses the latest callback and cancels pending emissions while disabled", () => {
    vi.useFakeTimers();
    const first = vi.fn(),
      latest = vi.fn();
    const { rerender } = render(<DhritiSearchField label="Search" value="" onChange={vi.fn()} onSearch={first} />);
    rerender(<DhritiSearchField label="Search" value="Alex" onChange={vi.fn()} onSearch={first} />);
    rerender(<DhritiSearchField label="Search" value="Alex" onChange={vi.fn()} onSearch={latest} />);
    act(() => vi.advanceTimersByTime(300));
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith("Alex");
    rerender(<DhritiSearchField label="Search" value="Sam" onChange={vi.fn()} onSearch={latest} disabled />);
    act(() => vi.advanceTimersByTime(300));
    expect(latest).toHaveBeenCalledTimes(1);
  });
  it("cancels a query if the controlled draft returns to the last emitted value", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(<DhritiSearchField label="Search" value="" onChange={vi.fn()} onSearch={onSearch} />);
    rerender(<DhritiSearchField label="Search" value="Alex" onChange={vi.fn()} onSearch={onSearch} />);
    act(() => vi.advanceTimersByTime(200));
    rerender(<DhritiSearchField label="Search" value="" onChange={vi.fn()} onSearch={onSearch} />);
    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
describe("Dhriti checkbox and radio", () => {
  it("keeps checked state controlled and supports mixed state", () => {
    const onChange = vi.fn();
    render(<DhritiCheckboxField label="Employees" checked={false} indeterminate onChange={onChange} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(true);
    expect(checkbox).not.toBeChecked();
  });
  it("exposes required errors below the checkbox", () => {
    render(
      <DhritiCheckboxField label="Confirm" checked={false} onChange={vi.fn()} required error="Confirm selection" />,
    );
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-describedby", screen.getByRole("alert").id);
  });
  it("preserves native radio group names and controlled callbacks", () => {
    const onChange = vi.fn();
    render(
      <>
        <DhritiRadioField name="location" label="Office" value="office" checked onChange={vi.fn()} />
        <DhritiRadioField name="location" label="Remote" value="remote" checked={false} onChange={onChange} />
      </>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Remote" }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("radio", { name: "Office" })).toHaveAttribute("name", "location");
  });
  it.each(["disabled", "readOnly"] as const)("blocks both choices when %s", (state) => {
    const onChange = vi.fn();
    render(
      <>
        <DhritiCheckboxField label="Confirm" checked={false} onChange={onChange} {...{ [state]: true }} />
        <DhritiRadioField label="Office" checked={false} onChange={onChange} {...{ [state]: true }} />
      </>,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("radio"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
