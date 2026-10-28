import { useState } from "react";
import { Globe2 } from "lucide-react";
import type { ProfileEditorProps } from "./ProfilePersonalDetails";
import { profileInputClass, ProfileSection } from "./ProfileSection";

const languages = [
  { value: "en", label: "English" },
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "hi", label: "Hindi" },
];

export function ProfilePreferences({ draft, editing, busy, onChange }: ProfileEditorProps) {
  const [timezones] = useState(() => ["UTC", ...Intl.supportedValuesOf("timeZone")]);
  return (
    <ProfileSection
      id="preferences-heading"
      icon={<Globe2 className="size-5" />}
      title="Regional preferences"
      description="Keep your personal preferences up to date."
    >
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span className="block">Time zone</span>
          <select
            name="timezone"
            value={draft.timezone}
            disabled={!editing || busy}
            onChange={(event) => onChange({ ...draft, timezone: event.target.value })}
            className={profileInputClass}
          >
            {!timezones.includes(draft.timezone) ? (
              <option value={draft.timezone}>{draft.timezone.replaceAll("_", " ")}</option>
            ) : null}
            {timezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="block">Preferred language</span>
          <select
            name="locale"
            value={draft.locale}
            disabled={!editing || busy}
            onChange={(event) => onChange({ ...draft, locale: event.target.value })}
            className={profileInputClass}
            aria-describedby="language-note"
          >
            {!languages.some((language) => language.value === draft.locale) ? (
              <option value={draft.locale}>{draft.locale}</option>
            ) : null}
            {languages.map((language) => (
              <option key={language.value} value={language.value}>
                {language.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p id="language-note" className="mt-4 text-xs leading-relaxed text-text-secondary">
        This saves your language preference. The workspace interface is currently in English.
      </p>
    </ProfileSection>
  );
}
