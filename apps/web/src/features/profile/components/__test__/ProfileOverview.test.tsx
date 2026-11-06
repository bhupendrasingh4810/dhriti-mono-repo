import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { UserProfileResponse } from "@/types/response";
import { ProfileOverview } from "../ProfileOverview";

const profile: UserProfileResponse = {
  id: "user-1", email: "asha@example.test", name: "Asha Sharma", role: "workspace_admin", avatarUrl: null,
  organization: null, isPlatformUser: false, prefix: "Dr.", dateOfBirth: null, gender: null, bloodGroup: null,
  nationality: null, workEmail: null, alternateEmail: null, isdCode: null, mobileNumber: null, employeeCode: null,
  biometricId: null, dateOfJoining: null, retirementDate: null, employmentType: null, employmentStatus: null,
  dateOfResignation: null, timezone: "UTC", locale: "en", status: "active", emailVerified: true, mfaEnabled: false,
  lastLoginAt: null, createdAt: "2020-01-01",
};

describe("ProfileOverview", () => {
  it("displays identity details and sends a selected profile photo to its callback", async () => {
    const user = userEvent.setup();
    const onChangePhoto = vi.fn().mockResolvedValue(undefined);
    render(<ProfileOverview profile={profile} editing={false} busy={false} uploading={false} onChangePhoto={onChangePhoto} />);

    const file = new File(["photo"], "portrait.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Profile photo"), file);

    expect(screen.getByRole("heading", { name: "Dr. Asha Sharma" })).toBeInTheDocument();
    expect(screen.getByText("Workspace Admin")).toBeInTheDocument();
    expect(onChangePhoto).toHaveBeenCalledWith(file);
  });
});
