"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { EmployeeDocuments } from "./workforce/employee-documents";

/** Live employee library replaces the demo policy/request/verification screens; those workflows remain pending. */
export function HrmsDocuments() {
  const { user } = useAuth();
  const { can, loading } = usePermissions();
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  if (loading)
    return (
      <p role="status" className="text-sm text-text-secondary">
        Checking document access...
      </p>
    );
  if (!can("hrms.workforce.manage"))
    return (
      <p role="alert" className="text-sm text-error">
        Workforce management permission is required to view employee documents.
      </p>
    );
  const organizationId = user?.organization?.id;
  if (!organizationId)
    return (
      <p role="status" className="text-sm text-text-secondary">
        Loading organization...
      </p>
    );
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        To upload, open an employee profile&apos;s Documents tab in the{" "}
        <Link
          href={`/${organizationSlug}/hrms/employees/directory`}
          className="cursor-pointer font-semibold text-brand"
        >
          employee directory
        </Link>
        . Policy distribution, document requests, letter generation and e-signatures are not yet available.
      </p>
      <EmployeeDocuments key={organizationId} organizationId={organizationId} />
    </div>
  );
}
