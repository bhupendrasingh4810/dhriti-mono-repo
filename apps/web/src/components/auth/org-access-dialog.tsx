// apps/web/src/components/auth/org-access-dialog.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  // DialogHeader,
  DialogTitle,
  // DialogDescription,
  Button,
} from "@mui/material";
import { ShieldRounded, PeopleRounded, LogoutRounded } from "@mui/icons-material";

interface OrgAccessDialogProps {
  orgName: string;
}

export function OrgAccessDialog({ orgName }: OrgAccessDialogProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSwitchOrg = () => {
    if (user && user?.organization) {
      router.push(`/${user?.organization.name}/home`);
    }
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-md">
        {/* <DialogHeader> */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShieldRounded className="h-8 w-8 text-muted-foreground" />
        </div>
        <DialogTitle className="text-center">Access Restricted</DialogTitle>
        {/* <DialogDescription className="text-center">
                        You are not a member of <strong>{orgName}</strong>
                    </DialogDescription>
                {/* </DialogHeader> */}

        <div className="mt-6 space-y-3">
          {user && user.organization && (
            <>
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-3">
                  <PeopleRounded className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Your Organization</p>
                    <p className="text-xs text-muted-foreground">{user.organization.name}</p>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleSwitchOrg}>
                Go to Your Workspace
              </Button>
            </>
          )}

          <Button className="w-full" onClick={logout}>
            <LogoutRounded className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
