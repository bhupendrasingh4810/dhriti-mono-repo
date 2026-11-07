"use client";

import { useHrmsToast } from "../layout";
import { HrmsReports } from "@/features/hrms/reports";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsReports onToast={onToast} />;
}
