import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UserProfileResponse } from "@/types/response";
import { ProfileEmploymentDetails } from "../ProfileEmploymentDetails";

const profile: UserProfileResponse = {
  id: "user-1", email: "asha@example.test", name: "Asha Sharma", role: "member", avatarUrl: null,
  organization: null, isPlatformUser: false, prefix: null, dateOfBirth: null, gender: null, bloodGroup: null,
  nationality: null, workEmail: null, alternateEmail: null, isdCode: null, mobileNumber: null, employeeCode: "E-42",
  biometricId: null, dateOfJoining: "2020-01-01", retirementDate: null, employmentType: "full_time",
  employmentStatus: "active", dateOfResignation: null, timezone: "UTC", locale: "en", status: "active",
  emailVerified: true, mfaEnabled: false, lastLoginAt: null, createdAt: "2020-01-01",
};

describe("ProfileEmploymentDetails", () => {
  it("renders supplied employment values and fallback values for missing records", () => {
    render(<ProfileEmploymentDetails profile={profile} />);

    expect(screen.getByRole("region", { name: "Employment information" })).toHaveTextContent("E-42");
    expect(screen.getByText("Full Time")).toBeInTheDocument();
    expect(screen.getAllByText("Not provided")).not.toHaveLength(0);
  });
});
