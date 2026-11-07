"use client";

import { useHrmsToast } from "../layout";
import { HrmsDashboard } from "@/features/hrms/dashboard";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsDashboard role="HR Admin" onToast={onToast} />;
}