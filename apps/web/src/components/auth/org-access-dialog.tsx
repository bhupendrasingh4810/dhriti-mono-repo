// apps/web/src/components/auth/org-access-dialog.tsx
"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { LogOut, Shield, Users } from "lucide-react";

interface OrgAccessDialogProps {
  orgName: string;
}

export function OrgAccessDialog({ orgName }: OrgAccessDialogProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleSwitchOrg = () => {
    if (user && user?.organization) {
      router.push(`/${user?.organization.name}/home`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/35 p-4">
      <section
        ref={dialogRef}
        aria-labelledby="org-access-dialog-title"
        aria-modal="true"
        role="dialog"
        tabIndex={-1}
        className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised">
          <Shield className="h-8 w-8 text-text-secondary" aria-hidden="true" />
        </div>
        <h2 id="org-access-dialog-title" className="text-center text-lg font-semibold text-text-primary">
          Access Restricted
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          You are not a member of <strong>{orgName}</strong>.
        </p>

        <div className="mt-6 space-y-3">
          {user && user.organization && (
            <>
              <div className="rounded-lg bg-surface-raised p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Your Organization</p>
                    <p className="text-xs text-text-secondary">{user.organization.name}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                onClick={handleSwitchOrg}
              >
                Go to Your Workspace
              </button>
            </>
          )}

          <button
            type="button"
            className="flex w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-raised"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}
