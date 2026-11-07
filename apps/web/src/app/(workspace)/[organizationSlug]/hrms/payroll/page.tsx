"use client";

import { useHrmsToast } from "../layout";
import { HrmsPayroll } from "@/features/hrms/payroll";

export default function Page() {
  const onToast = useHrmsToast();

  return <HrmsPayroll onToast={onToast} />;
}
