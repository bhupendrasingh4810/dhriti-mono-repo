import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProfileDraft } from "../../profile-form";
import { ProfileContactDetails } from "../ProfileContactDetails";

const draft: ProfileDraft = {
  prefix: "", name: "Asha Sharma", dateOfBirth: "", gender: "", bloodGroup: "", nationality: "",
  workEmail: "asha@work.test", alternateEmail: "", isdCode: "+91", mobileNumber: "9876543210", timezone: "UTC", locale: "en",
};

describe("ProfileContactDetails", () => {
  it("renders the sign-in email notice and reports changed work email", () => {
    const onChange = vi.fn();
    render(<ProfileContactDetails draft={draft} editing busy={false} onChange={onChange} signInEmail="asha@example.test" />);

    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "new@work.test" } });

    expect(screen.getByText(/sign-in email remains asha@example\.test/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({ ...draft, workEmail: "new@work.test" });
  });
});
