"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

interface InvitationAcceptanceFormProps {
  token: string;
}

type InvitationState = "idle" | "accepting" | "accepted" | "declining" | "declined";

const FEATURES = [
  { label: "Team Channels", Icon: ForumOutlinedIcon },
  { label: "Project Boards", Icon: HubOutlinedIcon },
  { label: "Docs & Wikis", Icon: DescriptionOutlinedIcon },
  { label: "Nexus AI", Icon: AutoAwesomeOutlinedIcon },
  { label: "Calendar", Icon: CalendarMonthOutlinedIcon },
  { label: "Integrations", Icon: GroupsOutlinedIcon },
];

const DECLINE_REASONS = ["Wrong workspace", "Not interested", "Already have an account", "Other"];

export default function InvitationAcceptanceForm({ token }: InvitationAcceptanceFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<InvitationState>("idle");
  const [showDeclinePanel, setShowDeclinePanel] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const isSubmitting = state === "accepting";

  const handleAccept = async () => {
    setError(null);
    setState("accepting");

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/invitation/accept?token=${token}`)}`);
        return;
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error?.message ?? "Unable to accept this invitation.");
        return;
      }

      setState("accepted");
      router.refresh();
    } catch {
      setError("Unable to accept this invitation. Please try again.");
    } finally {
      setState((currentState) => (currentState === "accepting" ? "idle" : currentState));
    }
  };

  const handleDecline = () => {
    setState("declining");
    window.setTimeout(() => setState("declined"), 400);
  };

  if (state === "accepted") {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-text-primary">
        <section className="w-full max-w-md text-center">
          <div className="mx-auto grid size-28 place-items-center rounded-full bg-brand-muted">
            <div className="grid size-20 place-items-center rounded-full bg-brand text-white">
              <CheckRoundedIcon fontSize="large" />
            </div>
          </div>
          <p className="mt-8 inline-flex bg-brand-muted px-3 py-1 text-xs font-semibold text-brand">
            Invitation accepted
          </p>
          <h1 className="mt-4 font-display text-3xl font-black">Welcome to your workspace!</h1>
          <p className="mt-3 text-base leading-6 text-text-secondary">
            You have joined as a member. Your workspace is ready to use.
          </p>
          <div className="mt-8 flex items-center gap-4 border border-border bg-surface p-4 text-left">
            <div className="grid size-12 place-items-center bg-brand text-lg font-bold text-white">W</div>
            <div>
              <p className="text-sm font-bold">Your workspace</p>
              <p className="text-xs text-text-secondary">Workspace access enabled</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.replace("/onboarding")}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 bg-brand px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Open workspace
            <ArrowForwardRoundedIcon fontSize="small" />
          </button>
        </section>
      </main>
    );
  }

  if (state === "declined") {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-text-primary">
        <section className="w-full max-w-sm text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-surface-raised text-text-muted">
            <CloseRoundedIcon fontSize="large" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-bold">Invitation declined</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            No changes were made. You can return to this invitation link while it remains valid.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-secondary"
            >
              Back to login
            </button>
            <button
              type="button"
              onClick={() => {
                setState("idle");
                setShowDeclinePanel(false);
                setDeclineReason("");
              }}
              className="bg-brand px-5 py-2.5 text-sm font-semibold text-white"
            >
              Review invitation
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-background text-text-primary">
      <section className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4 lg:hidden">
          <span className="font-display text-sm font-bold">Dhriti OS</span>
          <span className="bg-brand-muted px-2.5 py-1 text-xs font-semibold text-brand">Invitation</span>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="flex gap-2">
              <span className="bg-brand-muted px-3 py-1.5 text-xs font-semibold text-brand">Team invitation</span>
              <span className="border border-border px-3 py-1.5 text-xs font-semibold text-warning">Secure link</span>
            </div>
            <div className="mt-8">
              <div className="mb-6 flex items-center">
                <div
                  className="grid size-14 place-items-center border-2 border-surface bg-brand text-lg font-bold text-white"
                  style={{ borderRadius: "30%" }}
                >
                  TM
                </div>
                <div
                  className="-ml-3 grid size-14 place-items-center border-2 border-surface bg-brand-dark text-lg font-bold text-white"
                  style={{ borderRadius: "30%" }}
                >
                  W
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold">Your teammate</p>
                  <p className="text-xs text-text-secondary">Workspace member</p>
                </div>
              </div>
              <h1 className="font-display text-3xl font-black leading-tight">
                You have been invited
                <br />
                to join
                <span className="text-brand">a workspace</span>
              </h1>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Your teammate is inviting you to collaborate in their Dhriti OS workspace as a member.
              </p>
            </div>
            {showDeclinePanel ? (
              <div className="mt-5 border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm font-semibold text-warning">Why are you declining? (optional)</p>
                <div className="mt-3 space-y-1.5">
                  {DECLINE_REASONS.map((reason) => (
                    <button
                      type="button"
                      key={reason}
                      onClick={() => setDeclineReason(reason)}
                      className={`flex w-full items-center gap-2 border px-3 py-2 text-left text-xs font-medium ${declineReason === reason ? "border-warning bg-warning/20 text-warning" : "border-warning/30 bg-surface text-text-secondary"}`}
                    >
                      <span
                        className={`size-3.5 rounded-full border ${declineReason === reason ? "border-warning bg-warning" : "border-warning/50"}`}
                      />
                      {reason}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeclinePanel(false);
                      setDeclineReason("");
                    }}
                    className="flex-1 border border-warning/30 bg-surface py-2 text-xs font-semibold text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
                    className="flex-1 bg-warning py-2 text-xs font-semibold text-white"
                  >
                    {state === "declining" ? "Declining..." : "Decline invite"}
                  </button>
                </div>
              </div>
            ) : null}
            {error ? (
              <p className="mt-5 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleAccept}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 bg-brand px-4 py-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-80"
                style={{ borderRadius: "20p/x" }}
              >
                {isSubmitting ? "Joining workspace..." : "Accept invitation"}
                <CheckRoundedIcon fontSize="small" />
              </button>
              {!showDeclinePanel ? (
                <button
                  type="button"
                  onClick={() => setShowDeclinePanel(true)}
                  disabled={isSubmitting}
                  className="w-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-secondary"
                  style={{ borderRadius: "20px" }}
                >
                  Decline
                </button>
              ) : null}
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-text-muted">
              By accepting, you agree to Dhriti OS&apos;s{" "}
              <a href="/terms-and-conditions" className="font-semibold text-brand">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" className="font-semibold text-brand">
                Privacy Policy
              </a>
              . Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-brand cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
