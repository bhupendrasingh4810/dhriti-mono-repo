"use client";

import { useHrmsToast } from "../layout";
import { HrmsTraining } from "@/features/hrms/training";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsTraining onToast={onToast} />;
}
