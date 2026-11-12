"use client";

import { useHrmsToast } from "../../layout";
import { OffboardingWorkflow } from "@/features/hrms/employees";

export default function Page() {
  return <OffboardingWorkflow onToast={useHrmsToast()} />;
}
