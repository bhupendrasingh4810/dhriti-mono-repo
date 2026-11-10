"use client";

import AppSettingsPage from "@/features/settings/AppSettingsPage";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function HrmsAppSettingsPage() {
  return (
    <HrmsSettingsPageLayout activeTab="App Settings">
      <AppSettingsPage app="hrms" showBreadcrumb={false} />
    </HrmsSettingsPageLayout>
  );
}
