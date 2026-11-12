"use client";

import { useParams, useRouter } from "next/navigation";

import { useHrmsToast } from "../../layout";
import { EmployeeImportFlow } from "@/features/hrms/workforce/employee-import";

export default function Page() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const router = useRouter();
  return (
    <EmployeeImportFlow
      onToast={useHrmsToast()}
      onDone={() => router.push(`/${organizationSlug}/hrms/employees/directory`)}
    />
  );
}
