"use client";

import { useHrmsToast } from "../../layout";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";
import { HrmsLeaveTypes } from "@/features/hrms/HrmsLeaveTypes";

export default function HrmsLeaveTypesSettingsPage() {
  const onToast = useHrmsToast();

  return (
    <HrmsSettingsPageLayout activeTab="Leave Types">
      <HrmsLeaveTypes onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
