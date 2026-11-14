"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Button } from "./components/ui-primitives";

export const payrollSections = [
  { label: "Dashboard", path: "" },
  { label: "Configuration", path: "configuration" },
  { label: "Salary structures", path: "salary-structures" },
  { label: "Employee salary", path: "employee-salary" },
  { label: "Reimbursements", path: "reimbursements" },
  { label: "Run payroll", path: "run-payroll" },
  { label: "Payslips", path: "payslips" },
  { label: "Reports", path: "reports" },
] as const;

export type PayrollSection = (typeof payrollSections)[number]["label"];

type PayrollLayoutContextValue = {
  registerStart: (start: (() => void) | null) => void;
};

const PayrollLayoutContext = createContext<PayrollLayoutContextValue | null>(null);

export function usePayrollLayout() {
  const context = useContext(PayrollLayoutContext);
  if (!context) throw new Error("Payroll pages must be rendered inside the payroll layout");
  return context;
}

export function PayrollLayout({ children }: { children: ReactNode }) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const pathname = usePathname();
  const base = `/${organizationSlug}/hrms/payroll`;
  const [start, setStart] = useState<(() => void) | null>(null);
  const registerStart = useCallback((action: (() => void) | null) => setStart(() => action), []);

  return (
    <PayrollLayoutContext.Provider value={{ registerStart }}>
      <div className="sticky top-0 z-10 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background pb-3">
        <nav aria-label="Payroll sections" className="flex min-w-0 max-w-full flex-wrap gap-1">
          {payrollSections.map(({ label, path }) => {
            const href = path ? `${base}/${path}` : base;
            const active = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-semibold ${active ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-raised"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <Button icon="plus" disabled={!start} onClick={() => start?.()}>
          Start payroll run
        </Button>
      </div>
      {children}
    </PayrollLayoutContext.Provider>
  );
}
