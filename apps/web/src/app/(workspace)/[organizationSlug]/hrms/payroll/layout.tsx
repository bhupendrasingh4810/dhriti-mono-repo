"use client";

import type { ReactNode } from "react";
import { PayrollLayout } from "@/features/hrms/payroll-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <PayrollLayout>{children}</PayrollLayout>;
}
