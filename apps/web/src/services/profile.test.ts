import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from "./auth.service";
import { ApiRequestError } from "./http.service";
import type { UserProfileResponse } from "@/types/response";
import { draftFromProfile, profileChanges, validateProfileDraft } from "@/features/profile/profile-form";

const profile: UserProfileResponse = {
  id: "profile-test-user",
  name: "Aditi Sharma",
  email: "aditi@example.test",
  role: "MEMBER",
  avatarUrl: null,
  organization: { id: "profile-test-org", name: "Dhriti Studio", slug: "dhriti-studio" },
  isPlatformUser: false,
  timezone: "Asia/Kolkata",
  locale: "en",
  status: "ACTIVE",
  emailVerified: true,
  mfaEnabled: false,
  lastLoginAt: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  prefix: null,
  dateOfBirth: null,
  gender: null,
  bloodGroup: null,
  nationality: null,
  workEmail: null,
  alternateEmail: null,
  isdCode: null,
  mobileNumber: null,
  employeeCode: "EMP-42",
  biometricId: "BIO-42",
  dateOfJoining: "2026-10-01",
  retirementDate: null,
  employmentType: "FULL_TIME",
  employmentStatus: "ACTIVE",
  dateOfResignation: null,
};

afterEach(() => mock.restoreAll());

test("loads the full profile without caching and includes session cookies", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json(profile));

  assert.deepEqual(await getUserProfile(), profile);
  assert.deepEqual(fetchMock.mock.calls[0].arguments, [
    "/api/auth/profile",
    { credentials: "include", cache: "no-store" },
  ]);
});

test("saves editable fields with PATCH and returns the persisted profile", async () => {
  const input = { name: "Aditi S.", timezone: "UTC", locale: "hi" };
  const updated = { ...profile, ...input };
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json(updated));

  assert.deepEqual(await updateUserProfile(input), updated);
  assert.deepEqual(fetchMock.mock.calls[0].arguments, [
    "/api/auth/profile",
    {
      credentials: "include",
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  ]);
});

test("surfaces field validation failures instead of reporting a successful save", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json(
      { error: { message: "Invalid profile", details: { fields: ["timezone must be a valid time zone"] } } },
      { status: 422 },
    ),
  );

  await assert.rejects(
    updateUserProfile({ name: profile.name, timezone: "invalid", locale: "en" }),
    (error: unknown) =>
      error instanceof ApiRequestError &&
      error.status === 422 &&
      error.message === "timezone must be a valid time zone",
  );
});

test("surfaces unauthenticated profile loads", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ message: "Unauthenticated" }, { status: 401 }));

  await assert.rejects(getUserProfile(), (error: unknown) => error instanceof ApiRequestError && error.status === 401);
});

test("uploads the selected photo as multipart data to the existing avatar endpoint", async () => {
  const photo = new File(["profile image"], "avatar.png", { type: "image/png" });
  const updated = { ...profile, avatarUrl: "data:image/png;base64,cGhvdG8=" };
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json(updated));

  assert.deepEqual(await uploadProfilePhoto(photo), updated);
  const [url, options] = fetchMock.mock.calls[0].arguments as [string, RequestInit];
  assert.equal(url, "/api/auth/me/avatar");
  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "include");
  assert.ok(options.body instanceof FormData);
  const uploaded = options.body.get("file");
  assert.ok(uploaded instanceof File);
  assert.equal(uploaded.name, photo.name);
  assert.equal(uploaded.type, photo.type);
  assert.equal(await uploaded.text(), await photo.text());
});

test("represents missing optional details without fabricating profile data", () => {
  const draft = draftFromProfile(profile);
  assert.equal(draft.prefix, "");
  assert.equal(draft.dateOfBirth, "");
  assert.equal(draft.workEmail, "");
  assert.deepEqual(profileChanges(profile, draft), {});
});

test("saves all personal and contact fields without sending HR-managed employment fields", async () => {
  const draft = {
    ...draftFromProfile(profile),
    prefix: "Ms.",
    name: " Aditi S. ",
    dateOfBirth: "1995-06-15",
    gender: "Female",
    bloodGroup: "O+",
    nationality: "Indian",
    workEmail: "aditi@company.test",
    alternateEmail: "aditi.personal@example.test",
    isdCode: "+91",
    mobileNumber: "9876543210",
    timezone: "UTC",
    locale: "hi",
  };
  const input = profileChanges(profile, draft);
  assert.deepEqual(input, {
    name: "Aditi S.",
    prefix: "Ms.",
    dateOfBirth: "1995-06-15",
    gender: "Female",
    bloodGroup: "O+",
    nationality: "Indian",
    workEmail: "aditi@company.test",
    alternateEmail: "aditi.personal@example.test",
    isdCode: "+91",
    mobileNumber: "9876543210",
    timezone: "UTC",
    locale: "hi",
  });
  const updated = { ...profile, ...input };
  mock.method(globalThis, "fetch", async () => Response.json(updated));
  assert.deepEqual(await updateUserProfile(input), updated);
  assert.equal(validateProfileDraft(draft), null);
});

test("clears optional data with null and always sends the phone pair together", () => {
  const existing = { ...profile, prefix: "Mr.", isdCode: "+91", mobileNumber: "9876543210" };
  const draft = { ...draftFromProfile(existing), prefix: "", isdCode: "", mobileNumber: "" };
  assert.deepEqual(profileChanges(existing, draft), { prefix: null, isdCode: null, mobileNumber: null });
  assert.deepEqual(profileChanges(existing, { ...draftFromProfile(existing), mobileNumber: "9876543211" }), {
    isdCode: "+91",
    mobileNumber: "9876543211",
  });
});

test("validates paired phone values, total digit limits, future birthdays and whitespace-only names", () => {
  const draft = draftFromProfile(profile);
  assert.match(validateProfileDraft({ ...draft, isdCode: "+91" }) ?? "", /ISD/);
  assert.match(validateProfileDraft({ ...draft, isdCode: "+91", mobileNumber: "12345678901234" }) ?? "", /15 digits/);
  assert.match(validateProfileDraft({ ...draft, dateOfBirth: "2999-01-01" }) ?? "", /future/);
  assert.match(validateProfileDraft({ ...draft, name: "  " }) ?? "", /name/);
  assert.equal(validateProfileDraft({ ...draft, isdCode: "+91", mobileNumber: "9876543210" }), null);
});

test("preserves a legacy phone number without blocking unrelated profile edits", () => {
  const legacy = { ...profile, mobileNumber: "+919876543210", isdCode: null };
  const draft = { ...draftFromProfile(legacy), name: "Aditi S." };
  assert.equal(validateProfileDraft(draft, legacy), null);
  assert.deepEqual(profileChanges(legacy, draft), { name: "Aditi S." });
});
