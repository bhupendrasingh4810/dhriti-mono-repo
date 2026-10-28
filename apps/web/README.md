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
