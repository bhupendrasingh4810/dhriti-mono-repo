"use client";

import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold text-teal-700">Dhriti</p>
        <h1 className="mt-3 text-3xl font-bold">Set up your workspace</h1>
        <p className="mt-3 text-slate-600">
          Create or join an organization to access your workspace.
        </p>
        <button
          type="button"
          onClick={() => router.push("/organizations/new")}
          className="mt-8 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Create organization
        </button>
      </div>
    </main>
  );
}