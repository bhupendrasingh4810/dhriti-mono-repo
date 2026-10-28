import { Building2, ShieldCheck } from "lucide-react";
import type { UserProfileResponse } from "@/types/response";
import { formatDate, formatLabel } from "../profile-format";
import { ProfileDetail, ProfileSection } from "./ProfileSection";

export function ProfileAccountDetails({ profile }: { profile: UserProfileResponse }) {
  return (
    <aside className="min-w-0 space-y-6" aria-label="Workspace and account details">
      <ProfileSection id="workspace-heading" icon={<Building2 className="size-5" />} title="Your workspace">
        <dl className="mt-5 space-y-4">
          <ProfileDetail label="Organization" value={profile.organization?.name ?? "No organization assigned"} />
          <ProfileDetail label="Account role" value={formatLabel(profile.role)} />
          <ProfileDetail label="Member since" value={formatDate(profile.createdAt)} />
        </dl>
        <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-text-secondary">
          Workspace access and permissions are managed by your administrator.
        </p>
      </ProfileSection>
      <ProfileSection id="account-heading" icon={<ShieldCheck className="size-5" />} title="Account overview">
        <dl className="mt-5 space-y-4">
          <ProfileDetail label="Account status" value={formatLabel(profile.status)} />
          <ProfileDetail label="Email verification" value={profile.emailVerified ? "Verified" : "Not verified"} />
          <ProfileDetail label="Two-factor authentication" value={profile.mfaEnabled ? "Enabled" : "Not enabled"} />
          <ProfileDetail label="Last sign-in" value={formatDate(profile.lastLoginAt)} />
        </dl>
      </ProfileSection>
    </aside>
  );
}
