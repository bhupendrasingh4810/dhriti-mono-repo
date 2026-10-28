import { useRef } from "react";
import { Camera, LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import type { UserProfileResponse } from "@/types/response";
import { formatLabel } from "../profile-format";

export function ProfileOverview({
  profile,
  editing,
  busy,
  uploading,
  onChangePhoto,
}: {
  profile: UserProfileResponse;
  editing: boolean;
  busy: boolean;
  uploading: boolean;
  onChangePhoto: (file: File | undefined) => Promise<void>;
}) {
  const photoInput = useRef<HTMLInputElement>(null);
  return (
    <section aria-label="Profile overview" className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="h-20 border-b border-brand/10 bg-brand-muted sm:h-24" />
      <div className="px-5 pb-6 sm:px-7">
        <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
          <div className="relative">
            <div className="grid size-24 place-items-center overflow-hidden rounded-xl border-4 border-surface bg-brand text-3xl font-semibold text-text-inverse">
              {profile.avatarUrl ? (
                // Uploaded photos can be data URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.name}'s profile photo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                profile.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()
              )}
            </div>
            <button
              type="button"
              aria-label="Change profile photo"
              disabled={busy || editing}
              onClick={() => photoInput.current?.click()}
              className="absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Camera className="size-4" aria-hidden="true" />
              )}
            </button>
            <input
              ref={photoInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              aria-label="Profile photo"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                void onChangePhoto(file);
              }}
            />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1 text-xs font-medium text-text-secondary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {formatLabel(profile.role)}
          </span>
        </div>
        <div className="mt-5 space-y-2">
          <h2 className="break-words text-xl font-bold">{[profile.prefix, profile.name].filter(Boolean).join(" ")}</h2>
          <p className="flex min-w-0 items-start gap-2 text-sm text-text-secondary">
            <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="break-all">{profile.email}</span>
          </p>
          <p className="text-xs text-text-secondary">Your name and photo help teammates recognize you across Dhriti.</p>
        </div>
      </div>
    </section>
  );
}
