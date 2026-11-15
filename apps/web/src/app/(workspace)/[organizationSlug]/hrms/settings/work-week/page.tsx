"use client";

import { useHrmsToast } from "../../layout";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";
import { HrmsWorkWeek } from "@/features/hrms/HrmsWorkWeek";

export default function HrmsWorkWeekSettingsPage() {
  const onToast = useHrmsToast();
  return (
    <HrmsSettingsPageLayout activeTab="Work Week">
      <HrmsWorkWeek onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
