"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { useHrmsToast } from "../../layout";
import { EmployeeDirectory } from "@/features/hrms/workforce/employee-directory";

/** `?profile=<employeeId>` opens that employee's profile drawer (used by the organization chart). */
function DirectoryContent() {
  const profileId = useSearchParams().get("profile");
  return <EmployeeDirectory onToast={useHrmsToast()} openProfileId={profileId} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DirectoryContent />
    </Suspense>
  );
}
