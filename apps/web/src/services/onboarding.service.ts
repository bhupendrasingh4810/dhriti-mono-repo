import { apiRequest } from "@/services/http.service";

export interface OnboardingProfile {
  isOrgAdded: boolean;
  isOnBoarded: boolean;
  usageType: string;
  experience: string;
  isProfilePhotoSkipped: boolean;
  acceptedAt: string;
  privacyPolicyAccepted: boolean;
  privacyPolicyVersion: string;
  termsAccepted: boolean;
  termsVersion: string;
}

export async function getOnboardingProfile(): Promise<OnboardingProfile> {
  return apiRequest<OnboardingProfile>(`/api/onboarding`, { method: "GET" }, "Unable to load your onboarding details.");
}

export async function updateOnboardingProfile(profile: OnboardingProfile): Promise<void> {
  await apiRequest<void>(
    `/api/onboarding`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    },
    "Unable to save your onboarding details.",
  );
}
