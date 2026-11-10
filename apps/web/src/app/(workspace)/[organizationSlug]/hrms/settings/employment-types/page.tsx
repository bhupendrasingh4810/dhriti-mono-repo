"use client";

import { useHrmsToast } from "../../layout";
import { HrmsEmploymentTypes } from "@/features/hrms/HrmsEmploymentTypes";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function HrmsEmploymentTypesSettingsPage() {
  const onToast = useHrmsToast();

  return (
    <HrmsSettingsPageLayout activeTab="Employment Types">
      <HrmsEmploymentTypes onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
