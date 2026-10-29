This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Personal profile

Open the avatar menu in the workspace header and select **Profile** to visit
`/[organizationSlug]/user/profile`. The page uses the shared semantic theme tokens
and supports light and dark modes.
While loading, a responsive skeleton mirrors the profile cards and respects
reduced-motion preferences.

The feature entry point is `src/features/profile/ProfilePage.tsx`; its controlled
detail sections, fields, overview, account cards, and skeleton live in the
feature's `components` directory. Draft handling and formatting stay in
feature-level helpers.

The profile groups its data into:

- **Personal information:** prefix, name, date of birth, gender, blood group, nationality.
- **Contact information:** separate work and alternate email addresses, ISD code, mobile number.
- **Employment information (HR-managed):** employee code, biometric ID, date of joining,
  retirement date, employment type, employment status, date of resignation.
- **Regional preferences:** time zone and preferred language.

Missing optional data displays as **Not provided**. Users can update personal,
contact, and regional fields and their photo. Work email is separate from the
read-only sign-in email. Employment fields are read-only on My Profile and are
recorded through the permission-protected HRMS employee API.
Language preference is stored on the profile; it does not translate the workspace.
Account role, organization, and security details are also read-only.
Changes are persisted through the existing authenticated `/auth/me` and
`/auth/me/avatar` backend endpoints. Failed loads can be retried, and failed saves
preserve the current edits.

Run the profile service regression tests with
`pnpm --dir apps/web exec tsx --test src/services/profile.test.ts`.

## Notes access

Note owners always retain read, edit, share, and delete access, independently of
recipient permissions. Opening an owned note from its card keeps the editor
enabled; view-only mode applies only to non-owners. Shared recipients retain their
assigned permissions, enforced by the Notes API.
The note action menu follows those permissions: Edit requires `canEdit`, Delete
requires `canDelete`, and only owners can Share. Original owners and co-owners always see all actions.
The Share dialog lists existing recipients and lets owners change Edit/Delete
permissions independently or revoke access. New recipients start with view-only
access. **Save changes** persists the full recipient list, including an empty
list when all access is revoked; Cancel leaves existing permissions unchanged.
The owner is shown separately with fixed full access and cannot be revoked.
If saving an existing note is rejected with forbidden/not-found access, the
editor closes and removes the note from the current list and sidebar data,
without a page refresh. A message explains that changes were not saved. Other
save failures keep the editor and draft open.

Drag a card onto another card to change its position, or use its earlier/later
buttons for keyboard and touch access. The order is personal to the signed-in
user, persisted on the API, and stored separately for **All notes** and each
folder. It does not change note ownership, content or other users' ordering.
Newly accessible notes absent from a saved order are appended in updated-date
order. Dropping cards onto sidebar folders still moves them between folders.
Failed order saves roll back the displayed change and show an error.

**All notes** includes owned, shared and organization-public notes from every folder. Selecting a
folder filters that list without granting access to other notes in the folder.
Shared notes display a **Shared** badge on both the card and the detail dialog,
for owners and recipients. Unshared notes do not show the badge.

On mobile (below the `sm` breakpoint), the create/edit note dialog fills the
viewport, with scrollable content and the header and save action kept visible.
Desktop dialog sizing is unchanged.

Notes default to **Private**. Below the content field, the editor offers a
**Public** / **Private** visibility toggle during creation and owner/co-owner updates, with the current
visibility also shown on each card. Public notes are readable by authenticated
members of the same organization; visibility alone does not grant edit/delete
rights. Other members can request **Edit** or **Co-owner** access from the detail
dialog or choose **Request edit access** / **Request co-owner access** from the
public note's card menu to open the detail with that role preselected.
Existing editors can request co-ownership. Pending requests disable
duplicate submissions, including after reopening the detail.

The sidebar **Requests** view separates incoming requests from **Your requests**,
in equal-width columns on desktop (stacked on smaller screens), each with its own
empty placeholder. The sidebar badge counts pending incoming requests, excluding
outgoing and reviewed requests, and updates on loading, refresh and decisions.
The view shows pending/approved/rejected status and an icon-only, labeled refresh action (Notes remains
REST-only). Owners can approve or reject incoming requests. The permission
selector defaults to the requested role and can be changed before approval.
Co-ownership adds full control without removing the original owner. The Share
dialog preserves and labels co-owners; revoking their entry removes that role.
Making a note private rejects pending requests without removing explicit shares.

Run the access and badge regression tests with
`pnpm --dir apps/web exec tsx --test src/features/notes/note-access.test.ts src/features/notes/components/NotesSharedBadge.test.tsx`.
Ordering and rejected-save classification tests:
`pnpm --dir apps/web exec tsx --test src/features/notes/note-order.test.ts`.
Request approval rendering regressions:
`pnpm --dir apps/web exec tsx --test src/features/notes/components/NotesRequestsPanel.test.tsx`.

## Settings

Personal settings live under the avatar menu:

- `/[organizationSlug]/settings/general`: Connect status, message send shortcut,
  sounds, ringtone, preferred devices and call background.
- `/[organizationSlug]/settings/notifications`: per-type in-app/email toggles
  grouped by Connect, Notes, Pulse, Flow, Atlas, Cadence, HRMS and Control, plus
  legacy Other activity preferences and Connect email quiet hours. Each event
  saves independently through the notification preference API. New event
  preferences do not add automatic notification triggers: only Connect direct
  messages, mentions and missed calls currently emit through this service.
  The page explicitly marks unsupported automatic events; their settings persist
  and apply when notifications are submitted through the API. Existing saved
  preferences remain unchanged. Push delivery is not offered.

Run notification catalog coverage and default tests:
`pnpm --dir apps/web exec tsx --test src/features/settings/notification-settings-schema.test.ts`.

Each app has an organization settings page at `/[organizationSlug]/<app>/settings`
(`connect`, `flow`, `atlas`, `nexus`, `cadence`, `pulse`, `notes`, `hrms`). The pages
are generated from `src/features/settings/settings-schema.ts`; write access comes
from the API's organization-settings capability endpoint rather than inferred role
or user fields. Capability and settings load failures are shown with retry controls.
Feature code reads settings with `useAppSettings(app)` and
`useConnectUserSettings()` from `src/features/settings/use-app-settings.ts`. Cache
keys include the organization, and personal preferences additionally include the
user. Mounted consumers refresh after the 60-second TTL; successful saves prime
the matching key, and in-flight stale reads cannot replace a saved value.

Connect message and recording retention changes that enable a non-null period or
shorten an existing period require explicit confirmation. The dialog explains the
24-hour grace period and server-side feature flag. `retentionEnabledAt` is a
read-only server response field and is excluded from PATCH requests.

Settings fields remain feature-owned controls: their enum options, dynamic channel
choices, validation, dependencies, and responsive row layout are specific to these
settings forms, and the shared UI package does not currently provide equivalent
input primitives. The destructive retention confirmation reuses the shared
`@dhriti/ui` Dialog and its Storybook coverage instead of introducing a duplicate
dialog implementation.

Run the focused settings cache and retention policy tests with
`pnpm --dir apps/web exec tsx --test src/features/settings/app-settings-cache.test.ts`.

## Connect Calls

Connect audio and video calls use Agora. Configure these values in the web app environment before joining a call:

```bash
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate
```

`AGORA_APP_CERTIFICATE` is used only by the server token endpoint and must never be exposed through a `NEXT_PUBLIC_` variable.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
