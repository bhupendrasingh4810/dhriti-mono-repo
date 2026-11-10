"use client";

import { useHrmsToast } from "../../layout";
import { HrmsDepartments } from "@/features/hrms/HrmsDepartments";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function HrmsDepartmentsSettingsPage() {
  const onToast = useHrmsToast();

  return (
    <HrmsSettingsPageLayout activeTab="Departments">
      <HrmsDepartments onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
