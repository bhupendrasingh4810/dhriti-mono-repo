"use client";

import { useHrmsToast } from "../../layout";
import { HrmsDesignations } from "@/features/hrms/HrmsDesignations";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function HrmsDesignationsSettingsPage() {
  const onToast = useHrmsToast();

  return (
    <HrmsSettingsPageLayout activeTab="Designations">
      <HrmsDesignations onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
