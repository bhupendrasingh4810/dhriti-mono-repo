"use client";

import { useHrmsToast } from "../../layout";
import { HrmsLocations } from "@/features/hrms/HrmsLocations";
import { HrmsSettingsPageLayout } from "@/features/hrms/hrms-settings-page-layout";

export default function HrmsLocationsSettingsPage() {
  const onToast = useHrmsToast();

  return (
    <HrmsSettingsPageLayout activeTab="Locations">
      <HrmsLocations onToast={onToast} />
    </HrmsSettingsPageLayout>
  );
}
