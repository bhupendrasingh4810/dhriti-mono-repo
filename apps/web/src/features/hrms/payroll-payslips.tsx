"use client";

import { PayrollResults } from "./payroll-results";
import type { PayrollSectionProps } from "./payroll-shared";

export function PayrollPayslips(props: Pick<PayrollSectionProps, "data" | "setSlip">) {
  return <PayrollResults {...props} tab="Payslips" />;
}
