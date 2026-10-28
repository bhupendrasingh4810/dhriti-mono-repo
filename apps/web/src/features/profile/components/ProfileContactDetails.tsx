import { Mail } from "lucide-react";
import type { ProfileEditorProps } from "./ProfilePersonalDetails";
import { ProfileField } from "./ProfileField";
import { ProfileSection } from "./ProfileSection";

export function ProfileContactDetails({
  draft,
  editing,
  busy,
  onChange,
  signInEmail,
}: ProfileEditorProps & { signInEmail: string }) {
  return (
    <ProfileSection
      id="contact-heading"
      icon={<Mail className="size-5" />}
      title="Contact information"
      description="Work and alternate contact details, separate from your sign-in email."
    >
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <ProfileField
          label="Work email"
          name="workEmail"
          type="email"
          value={draft.workEmail}
          editing={editing}
          disabled={busy}
          maxLength={254}
          onChange={(value) => onChange({ ...draft, workEmail: value })}
        />
        <ProfileField
          label="Alternate email address"
          name="alternateEmail"
          type="email"
          value={draft.alternateEmail}
          editing={editing}
          disabled={busy}
          maxLength={254}
          onChange={(value) => onChange({ ...draft, alternateEmail: value })}
        />
        <ProfileField
          label="ISD code"
          name="isdCode"
          type="tel"
          value={draft.isdCode}
          editing={editing}
          disabled={busy}
          maxLength={5}
          pattern={"\\+[1-9][0-9]{0,3}"}
          placeholder="+91"
          onChange={(value) => onChange({ ...draft, isdCode: value })}
        />
        <ProfileField
          label="Mobile number"
          name="mobileNumber"
          type="tel"
          value={draft.mobileNumber}
          editing={editing}
          disabled={busy}
          maxLength={14}
          onChange={(value) => onChange({ ...draft, mobileNumber: value })}
        />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-text-secondary">
        Enter both ISD code and mobile number, or leave both blank. Your sign-in email remains {signInEmail}.
      </p>
    </ProfileSection>
  );
}
