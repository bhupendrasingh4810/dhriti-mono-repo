"use client";

import { HrmsPermissions } from "@/features/hrms/settings";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function HrmsPermissionsSettingsPage() {
  return (
    <HrmsSettingsPageLayout activeTab="Roles & Permissions">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage HRMS permissions for your organization.</p>
      </header>
      <HrmsPermissions />
    </HrmsSettingsPageLayout>
  );
}
