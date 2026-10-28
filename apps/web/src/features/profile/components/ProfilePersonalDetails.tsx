import type { Ref } from "react";
import { UserRound } from "lucide-react";
import type { ProfileDraft } from "../profile-form";
import { ProfileField } from "./ProfileField";
import { profileInputClass, ProfileSection } from "./ProfileSection";

export interface ProfileEditorProps {
  draft: ProfileDraft;
  editing: boolean;
  busy: boolean;
  onChange: (draft: ProfileDraft) => void;
}

export function ProfilePersonalDetails({
  draft,
  editing,
  busy,
  onChange,
  nameInputRef,
}: ProfileEditorProps & { nameInputRef: Ref<HTMLInputElement> }) {
  return (
    <ProfileSection
      id="personal-heading"
      icon={<UserRound className="size-5" />}
      title="Personal information"
      description="Your identity and personal details. Optional fields can be left blank."
    >
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <ProfileField
          label="Prefix"
          name="prefix"
          value={draft.prefix}
          editing={editing}
          disabled={busy}
          options={["Mr.", "Mrs.", "Ms.", "Miss", "Mx.", "Dr.", "Prof."]}
          maxLength={20}
          onChange={(value) => onChange({ ...draft, prefix: value })}
        />
        <label className="space-y-2 text-sm font-medium">
          <span className="block">Full name</span>
          <input
            ref={nameInputRef}
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            value={draft.name}
            disabled={!editing || busy}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            className={profileInputClass}
          />
        </label>
        <ProfileField
          label="Date of birth"
          name="dateOfBirth"
          type="date"
          value={draft.dateOfBirth}
          editing={editing}
          disabled={busy}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(value) => onChange({ ...draft, dateOfBirth: value })}
        />
        <ProfileField
          label="Gender"
          name="gender"
          value={draft.gender}
          editing={editing}
          disabled={busy}
          maxLength={64}
          onChange={(value) => onChange({ ...draft, gender: value })}
        />
        <ProfileField
          label="Blood group"
          name="bloodGroup"
          value={draft.bloodGroup}
          editing={editing}
          disabled={busy}
          options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
          onChange={(value) => onChange({ ...draft, bloodGroup: value })}
        />
        <ProfileField
          label="Nationality"
          name="nationality"
          value={draft.nationality}
          editing={editing}
          disabled={busy}
          maxLength={80}
          onChange={(value) => onChange({ ...draft, nationality: value })}
        />
      </div>
    </ProfileSection>
  );
}
