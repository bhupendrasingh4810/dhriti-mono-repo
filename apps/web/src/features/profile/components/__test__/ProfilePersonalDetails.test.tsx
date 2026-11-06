import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProfileDraft } from "../../profile-form";
import { ProfilePersonalDetails } from "../ProfilePersonalDetails";

const draft: ProfileDraft = {
  prefix: "Dr.", name: "Asha Sharma", dateOfBirth: "1990-05-12", gender: "Female", bloodGroup: "O+",
  nationality: "Indian", workEmail: "", alternateEmail: "", isdCode: "", mobileNumber: "", timezone: "UTC", locale: "en",
};

describe("ProfilePersonalDetails", () => {
  it("renders editable personal inputs and reports name changes", () => {
    const onChange = vi.fn();
    render(<ProfilePersonalDetails draft={draft} editing busy={false} onChange={onChange} nameInputRef={null} />);

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Asha Patel" } });

    expect(screen.getByRole("region", { name: "Personal information" })).toBeInTheDocument();
    expect(screen.getByLabelText("Prefix")).toHaveValue("Dr.");
    expect(onChange).toHaveBeenCalledWith({ ...draft, name: "Asha Patel" });
  });
});
