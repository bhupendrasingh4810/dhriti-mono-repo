"use client";

import { HrmsProfileFields } from "@/features/hrms/HrmsProfileFields";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function HrmsProfileFieldsPage() {
  return (
    <HrmsSettingsPageLayout activeTab="Profile Fields">
      <HrmsProfileFields />
    </HrmsSettingsPageLayout>
  );
}
