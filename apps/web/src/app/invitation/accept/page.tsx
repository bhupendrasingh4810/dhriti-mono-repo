import type { Metadata } from "next";

import InvitationAcceptanceForm from "@/components/invitation/invitation-acceptance-form";

export const metadata: Metadata = {
  title: "Accept invitation | Dhriti OS",
};

interface InvitationAcceptPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function InvitationAcceptPage({ searchParams }: InvitationAcceptPageProps) {
  const { token: tokenParameter } = await searchParams;
  const token = typeof tokenParameter === "string" ? tokenParameter.trim() : "";

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-text-primary">
        <section className="w-full max-w-md border border-border bg-surface p-8 shadow-sm">
          <p className="font-display text-lg font-bold">Dhriti OS</p>
          <h1 className="mt-8 font-display text-2xl font-bold">Invitation link is invalid</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            This invitation link does not include a token. Ask your organization administrator to send a new invitation.
          </p>
        </section>
      </main>
    );
  }

  return <InvitationAcceptanceForm token={token} />;
}
