"use client";

import { useHrmsToast } from "../../layout";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";
import { HrmsShifts } from "@/features/hrms/HrmsShifts";

export default function HrmsShiftsSettingsPage() {
  const onToast = useHrmsToast();

  return (
    <HrmsSettingsPageLayout activeTab="Shifts">
      <HrmsShifts onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
