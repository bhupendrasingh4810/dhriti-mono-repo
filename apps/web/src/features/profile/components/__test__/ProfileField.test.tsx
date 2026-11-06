import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileField } from "../ProfileField";

describe("ProfileField", () => {
  it("shows a formatted read-only date and updates a selected option while editing", () => {
    const { rerender } = render(
      <ProfileField label="Date of birth" name="dateOfBirth" value="1990-05-12" editing={false} disabled={false} onChange={vi.fn()} type="date" />,
    );

    expect(screen.getByText(/12.*May.*1990/)).toBeInTheDocument();

    const onChange = vi.fn();
    rerender(
      <ProfileField
        label="Blood group"
        name="bloodGroup"
        value=""
        editing
        disabled={false}
        options={["A+", "O+"]}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Blood group"), { target: { value: "O+" } });

    expect(onChange).toHaveBeenCalledWith("O+");
  });
});
