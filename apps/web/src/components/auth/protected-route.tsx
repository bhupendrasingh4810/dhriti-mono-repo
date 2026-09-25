"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { OrgAccessDialog } from "./org-access-dialog";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrg?: boolean;
  allowedRoles?: Array<"owner" | "admin" | "member">;
}

export function ProtectedRoute({ children, requireOrg = true, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isMember, role, currentOrg } = useOrganization();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null; // Middleware will redirect to login
  }

  if (requireOrg && currentOrg && !isMember) {
    return <OrgAccessDialog orgName={currentOrg} />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
