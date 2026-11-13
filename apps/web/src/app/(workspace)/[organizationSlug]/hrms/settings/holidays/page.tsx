"use client";

import { useHrmsToast } from "../../layout";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";
import { HrmsHolidays } from "@/features/hrms/HrmsHolidays";

export default function HrmsHolidaysSettingsPage() {
  const onToast = useHrmsToast();

  return (
    <HrmsSettingsPageLayout activeTab="Holidays">
      <HrmsHolidays onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
