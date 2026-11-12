"use client";

import type { ReactNode } from "react";

import { HrmsWorkforceShell } from "@/features/hrms/employees";

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  return <HrmsWorkforceShell>{children}</HrmsWorkforceShell>;
}
