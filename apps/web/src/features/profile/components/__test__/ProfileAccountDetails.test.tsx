import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UserProfileResponse } from "@/types/response";
import { ProfileAccountDetails } from "../ProfileAccountDetails";

const profile: UserProfileResponse = {
  id: "user-1", email: "asha@example.test", name: "Asha Sharma", role: "workspace_admin", avatarUrl: null,
  organization: { id: "org-1", name: "Dhriti", slug: "dhriti" }, isPlatformUser: false, prefix: null, dateOfBirth: null,
  gender: null, bloodGroup: null, nationality: null, workEmail: null, alternateEmail: null, isdCode: null, mobileNumber: null,
  employeeCode: null, biometricId: null, dateOfJoining: null, retirementDate: null, employmentType: null, employmentStatus: null,
  dateOfResignation: null, timezone: "UTC", locale: "en", status: "active", emailVerified: true, mfaEnabled: true,
  lastLoginAt: "2024-01-02T10:00:00Z", createdAt: "2020-01-01",
};

describe("ProfileAccountDetails", () => {
  it("shows workspace, verification, and security account details", () => {
    render(<ProfileAccountDetails profile={profile} />);

    expect(screen.getByRole("complementary", { name: "Workspace and account details" })).toHaveTextContent("Dhriti");
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });
});
