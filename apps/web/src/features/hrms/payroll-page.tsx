"use client";

import { useHrmsToast } from "@/app/(workspace)/[organizationSlug]/hrms/layout";
import { HrmsPayroll } from "./payroll";
import type { PayrollSection } from "./payroll-layout";

export function PayrollPage({ section }: { section: PayrollSection }) {
  return <HrmsPayroll section={section} onToast={useHrmsToast()} />;
}
