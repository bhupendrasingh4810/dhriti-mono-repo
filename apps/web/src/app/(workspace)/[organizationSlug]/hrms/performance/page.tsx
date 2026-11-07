"use client";

import { useHrmsToast } from "../layout";
import { HrmsPerformance } from "@/features/hrms/performance";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsPerformance onToast={onToast} />;
}
