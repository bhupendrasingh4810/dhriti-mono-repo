"use client";

import { WorkflowSetting } from "@/features/hrms/workflows/WorkflowSetting";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function WorkflowSettingsPage() {
  return (
    <HrmsSettingsPageLayout activeTab="Workflows">
      <WorkflowSetting />
    </HrmsSettingsPageLayout>
  );
}
