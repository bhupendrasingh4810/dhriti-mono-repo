import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProfileDraft } from "../../profile-form";
import { ProfilePreferences } from "../ProfilePreferences";

const draft: ProfileDraft = {
  prefix: "", name: "Asha Sharma", dateOfBirth: "", gender: "", bloodGroup: "", nationality: "",
  workEmail: "", alternateEmail: "", isdCode: "", mobileNumber: "", timezone: "Asia/Kolkata", locale: "hi",
};

describe("ProfilePreferences", () => {
  it("allows updating the preferred language when editing", () => {
    const onChange = vi.fn();
    render(<ProfilePreferences draft={draft} editing busy={false} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Preferred language"), { target: { value: "en-GB" } });

    expect(screen.getByText(/workspace interface is currently in English/i)).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({ ...draft, locale: "en-GB" });
  });
});
