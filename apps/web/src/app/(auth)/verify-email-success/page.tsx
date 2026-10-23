"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function MailIllustration() {
  return (
    <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-brand-muted">
      <div className="absolute inset-3 rounded-full border border-brand/10" />
      <svg className="relative h-11 w-11 text-brand" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="5" y="10" width="38" height="28" rx="5" fill="white" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="m8 14 16 13 16-13"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="m8 35 11-10M40 35 29 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      </svg>
      <span className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-sm">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="m5 10 3.2 3.2L15 6.7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationEmail = searchParams.get("email") ?? "";
  const [resent, setResent] = useState(false);

  const resend = () => {
    setResent(true);
    window.setTimeout(() => setResent(false), 4000);
  };

  return (
    <div className="min-h-screen text-text-primary">
      {/* <header className="flex h-20 items-center justify-between border-b border-black/5 px-4 sm:px-10">
                <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">D</span>
                    <span className="font-display text-lg font-bold tracking-tight">Dhriti OS</span>
                </button>
                <button
                    type="button"
                    onClick={() => router.push("login")}
                    className="text-sm font-medium text-text-secondary transition-colors hover:text-brand"
                >
                    Sign in
                </button>
            </header> */}

      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col px-6 py-16 sm:justify-center sm:py-20">
        <section className="text-center">
          <MailIllustration />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand">One last step</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
            Verify your email to
            <span className="block">complete signup</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-text-secondary">
            We sent a verification link to{" "}
            <strong className="font-semibold text-text-primary">{verificationEmail || " "}</strong>. Open the message
            and click the link to activate your Dhriti OS workspace.
          </p>

          <div className="mx-auto mt-9 max-w-md rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3 text-left">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-muted text-brand">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 5v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-text-primary">The link expires in 24 hours</p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Check your spam folder if the email does not arrive within a few minutes.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-md border-t border-border pt-6">
            <p className="text-sm text-text-secondary">
              Not your email?{" "}
              <button
                type="button"
                onClick={() => router.push("get-started")}
                className="font-semibold text-brand hover:underline cursor-pointer"
              >
                Sign up with another email
              </button>
            </p>
          </div>
        </section>

        <section className="mt-20 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Data and privacy</h2>
              <p className="mt-1 text-sm text-text-secondary">Your account information is protected and never sold.</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("privacy-and-policy")}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-brand hover:border-brand/30 cursor-pointer"
            >
              Learn more
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
