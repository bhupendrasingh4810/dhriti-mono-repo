import type { PersonalProfileDetails, UpdatePersonalProfileInput } from "@dhriti/types";
import type { UserProfileResponse } from "@/types/response";

const personalFields = [
  "prefix",
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "nationality",
  "workEmail",
  "alternateEmail",
  "isdCode",
  "mobileNumber",
] as const satisfies readonly (keyof PersonalProfileDetails)[];

export type ProfileDraft = { [Key in keyof PersonalProfileDetails]: string } & {
  name: string;
  timezone: string;
  locale: string;
};

export function draftFromProfile(profile: UserProfileResponse): ProfileDraft {
  return {
    name: profile.name,
    timezone: profile.timezone,
    locale: profile.locale,
    prefix: profile.prefix ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender ?? "",
    bloodGroup: profile.bloodGroup ?? "",
    nationality: profile.nationality ?? "",
    workEmail: profile.workEmail ?? "",
    alternateEmail: profile.alternateEmail ?? "",
    isdCode: profile.isdCode ?? "",
    mobileNumber: profile.mobileNumber ?? "",
  };
}

export function profileChanges(profile: UserProfileResponse, draft: ProfileDraft): UpdatePersonalProfileInput {
  const changes: UpdatePersonalProfileInput = {};
  if (draft.name.trim() !== profile.name) changes.name = draft.name.trim();
  if (draft.timezone !== profile.timezone) changes.timezone = draft.timezone;
  if (draft.locale !== profile.locale) changes.locale = draft.locale;
  for (const key of personalFields) {
    const value = draft[key].trim() || null;
    if (value !== (profile[key] ?? null)) changes[key] = value;
  }
  if ("isdCode" in changes || "mobileNumber" in changes) {
    changes.isdCode = draft.isdCode.trim() || null;
    changes.mobileNumber = draft.mobileNumber.trim() || null;
  }
  return changes;
}

export function validateProfileDraft(draft: ProfileDraft, profile?: UserProfileResponse): string | null {
  if (!draft.name.trim() || draft.name.trim().length > 120) return "Enter a name between 1 and 120 characters.";
  if (draft.dateOfBirth && draft.dateOfBirth > new Date().toISOString().slice(0, 10))
    return "Date of birth cannot be in the future.";
  const isdCode = draft.isdCode.trim();
  const mobile = draft.mobileNumber.trim();
  const phoneChanged =
    !profile || draft.isdCode !== (profile.isdCode ?? "") || draft.mobileNumber !== (profile.mobileNumber ?? "");
  if (phoneChanged && (isdCode || mobile)) {
    if (!/^\+[1-9]\d{0,3}$/.test(isdCode) || !/^\d{4,14}$/.test(mobile) || `${isdCode}${mobile}`.length > 16) {
      return "Enter an ISD code (for example, +91) and a mobile number with at most 15 digits in total.";
    }
  }
  return null;
}
