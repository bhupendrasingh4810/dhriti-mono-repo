// app/auth/oauth/callback/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/services/auth.service";

interface CurrentUserResponse {
  user: {
    id: string;
    organization?: {
      slug: string;
    } | null;
  };
}

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeOAuth() {
      const oauthError = searchParams.get("error");

      if (oauthError) {
        setError("OAuth authentication failed.");
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("Unable to load the authenticated user.");
        }

        if (cancelled) return;

        const organization = user.organization;

        if (organization?.slug) {
          router.replace(`/${encodeURIComponent(organization.slug)}/home`);
        } else {
          router.replace("/onboarding");
        }
      } catch (cause) {
        console.error("OAuth callback error:", cause);

        if (!cancelled) {
          setError("Unable to complete authentication.");
        }
      }
    }

    void completeOAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Authentication Failed</h1>

        <p className="mb-4 text-gray-600">{error}</p>

        <button
          type="button"
          onClick={() => router.replace("/auth/login")}
          className="rounded bg-primary px-4 py-2 text-white"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      <p className="text-gray-600">Completing sign in...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Completing sign in...</div>}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
