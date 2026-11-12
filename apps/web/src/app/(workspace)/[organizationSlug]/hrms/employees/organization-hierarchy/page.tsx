"use client";

import { useParams, useRouter } from "next/navigation";

import { useHrmsToast } from "../../layout";
import { OrganizationChart } from "@/features/hrms/workforce/organization-chart";

export default function Page() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const router = useRouter();
  return (
    <OrganizationChart
      onToast={useHrmsToast()}
      onOpenProfile={(id) =>
        router.push(`/${organizationSlug}/hrms/employees/directory?profile=${encodeURIComponent(id)}`)
      }
    />
  );
}
