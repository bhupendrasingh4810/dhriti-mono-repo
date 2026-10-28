"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Check, ChevronRight, LoaderCircle, Pencil, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from "@/services/auth.service";
import type { UserProfileResponse } from "@/types/response";
import { draftFromProfile, profileChanges, validateProfileDraft, type ProfileDraft } from "./profile-form";
import { ProfileAccountDetails } from "./components/ProfileAccountDetails";
import { ProfileContactDetails } from "./components/ProfileContactDetails";
import { ProfileEmploymentDetails } from "./components/ProfileEmploymentDetails";
import { ProfileOverview } from "./components/ProfileOverview";
import { ProfilePersonalDetails } from "./components/ProfilePersonalDetails";
import { ProfilePreferences } from "./components/ProfilePreferences";
import { profileButtonClass } from "./components/ProfileSection";
import { ProfileSkeleton } from "./components/ProfileSkeleton";

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const nameInput = useRef<HTMLInputElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const operationInProgress = useRef(false);

  useEffect(() => {
    let active = true;
    getUserProfile()
      .then((result) => {
        if (!active) return;
        setProfile(result);
        setDraft(draftFromProfile(result));
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Unable to load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (editing) nameInput.current?.focus();
  }, [editing]);

  const busy = saving || uploading;
  const dirty = Boolean(profile && draft && Object.keys(profileChanges(profile, draft)).length);

  function cancelEditing() {
    if (!profile) return;
    setDraft(draftFromProfile(profile));
    setEditing(false);
    setError("");
    editButton.current?.focus();
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !profile || operationInProgress.current) return;
    const validationError = validateProfileDraft(draft, profile);
    if (validationError) {
      setError(validationError);
      return;
    }
    operationInProgress.current = true;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateUserProfile(profileChanges(profile, draft));
      setProfile(updated);
      setDraft(draftFromProfile(updated));
      setEditing(false);
      await refreshUser();
      setSuccess("Your profile has been updated.");
      editButton.current?.focus();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save your profile.");
    } finally {
      operationInProgress.current = false;
      setSaving(false);
    }
  }

  async function changePhoto(file: File | undefined) {
    if (!file || operationInProgress.current) return;
    setError("");
    setSuccess("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    operationInProgress.current = true;
    setUploading(true);
    try {
      const updated = await uploadProfilePhoto(file);
      setProfile((current) => (current ? { ...current, avatarUrl: updated.avatarUrl } : current));
      await refreshUser();
      setSuccess("Your profile photo has been updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upload your profile photo.");
    } finally {
      operationInProgress.current = false;
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 text-text-primary sm:p-6 lg:p-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-secondary">
        <UserRound className="size-4" aria-hidden="true" />
        <span>Personal account</span>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span aria-current="page" className="text-text-primary">
          My profile
        </span>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My profile</h1>
          <p className="mt-2 text-sm text-text-secondary">
            A little about you. One profile across your Dhriti workspace.
          </p>
        </div>
        {profile ? (
          <button
            ref={editButton}
            type="button"
            disabled={editing || busy}
            onClick={() => {
              setEditing(true);
              setError("");
              setSuccess("");
            }}
            className={`${profileButtonClass} bg-brand text-text-inverse hover:bg-brand-dark`}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit profile
          </button>
        ) : null}
      </div>
      {loading ? (
        <ProfileSkeleton />
      ) : loadError ? (
        <div role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <p className="flex items-center gap-2 text-sm text-error">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {loadError}
          </p>
          <button
            type="button"
            className={`${profileButtonClass} bg-brand text-text-inverse hover:bg-brand-dark`}
            onClick={() => {
              setLoadError("");
              setLoading(true);
              setLoadAttempt((attempt) => attempt + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : profile && draft ? (
        <>
          <div aria-live="polite" aria-atomic="true">
            {success ? (
              <p
                role="status"
                className="flex items-center gap-2 rounded-md border border-brand/20 bg-brand-muted p-3 text-sm text-brand-dark"
              >
                <Check className="size-4 shrink-0" aria-hidden="true" />
                {success}
              </p>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-md border border-error/20 bg-surface p-3 text-sm text-error"
              >
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}
          </div>
          <ProfileOverview
            profile={profile}
            editing={editing}
            busy={busy}
            uploading={uploading}
            onChangePhoto={changePhoto}
          />
          <div className="grid items-start gap-6 lg:grid-cols-3">
            <form
              onSubmit={saveProfile}
              className="min-w-0 space-y-6 lg:col-span-2"
              aria-label="Edit personal information"
              aria-busy={saving}
            >
              <ProfilePersonalDetails
                draft={draft}
                editing={editing}
                busy={busy}
                onChange={setDraft}
                nameInputRef={nameInput}
              />
              <ProfileContactDetails
                draft={draft}
                editing={editing}
                busy={busy}
                onChange={setDraft}
                signInEmail={profile.email}
              />
              <ProfileEmploymentDetails profile={profile} />
              <ProfilePreferences draft={draft} editing={editing} busy={busy} onChange={setDraft} />
              {editing ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-secondary">
                    {dirty ? "You have unsaved changes." : "Your profile is up to date."}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={cancelEditing}
                      className={`${profileButtonClass} border border-border text-text-secondary hover:bg-surface-raised`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy || !dirty}
                      className={`${profileButtonClass} bg-brand text-text-inverse hover:bg-brand-dark`}
                    >
                      {saving ? (
                        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      ) : (
                        <Check className="size-4" aria-hidden="true" />
                      )}
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              ) : null}
            </form>
            <ProfileAccountDetails profile={profile} />
          </div>
        </>
      ) : null}
    </div>
  );
}
