"use client";

import { PayrollResults } from "./payroll-results";
import type { PayrollSectionProps } from "./payroll-shared";

export function PayrollReports(props: Pick<PayrollSectionProps, "data" | "setSlip">) {
  return <PayrollResults {...props} tab="Reports" />;
}
