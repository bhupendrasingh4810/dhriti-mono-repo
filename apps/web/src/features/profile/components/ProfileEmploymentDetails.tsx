import { Building2 } from "lucide-react";
import type { UserProfileResponse } from "@/types/response";
import { formatDate, formatLabel } from "../profile-format";
import { ProfileDetail, ProfileSection } from "./ProfileSection";

export function ProfileEmploymentDetails({ profile }: { profile: UserProfileResponse }) {
  return (
    <ProfileSection
      id="employment-heading"
      icon={<Building2 className="size-5" />}
      title="Employment information"
      description="Managed by HR. Contact your administrator to update these details."
    >
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <ProfileDetail label="Employee code" value={profile.employeeCode ?? "Not provided"} />
        <ProfileDetail label="Biometric ID" value={profile.biometricId ?? "Not provided"} />
        <ProfileDetail
          label="Date of joining"
          value={profile.dateOfJoining ? formatDate(profile.dateOfJoining) : "Not provided"}
        />
        <ProfileDetail
          label="Retirement date"
          value={profile.retirementDate ? formatDate(profile.retirementDate) : "Not provided"}
        />
        <ProfileDetail
          label="Employment type"
          value={profile.employmentType ? formatLabel(profile.employmentType) : "Not provided"}
        />
        <ProfileDetail
          label="Employment status"
          value={profile.employmentStatus ? formatLabel(profile.employmentStatus) : "Not provided"}
        />
        <ProfileDetail
          label="Date of resignation"
          value={profile.dateOfResignation ? formatDate(profile.dateOfResignation) : "Not provided"}
        />
      </dl>
    </ProfileSection>
  );
}
