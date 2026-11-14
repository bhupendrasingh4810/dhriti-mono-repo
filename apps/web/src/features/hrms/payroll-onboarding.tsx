"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { PayrollWorkspace } from "@/services/payroll.service";
import { Card, Icon } from "./components/ui-primitives";
import { payrollGuideLinkClass } from "./payroll-shared";

export function PayrollOnboarding({ data }: { data: PayrollWorkspace }) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const base = `/${organizationSlug}/hrms/payroll`;
  const approved = data.runs.some((run) => run.status === "APPROVED" || run.status === "PROCESSED");
  const processed = data.runs.some((run) => run.status === "PROCESSED");
  // These are organization milestones, not per-period readiness or automatic attendance verification.
  const steps = [
    {
      title: "Configure a payroll profile",
      description: "Choose the country, currency, pay frequency and calendar. Independently verify the local rules.",
      complete: data.profiles.some((profile) => profile.rulesVerified),
      pending: data.profiles.length ? "Rules verification needed" : "Not started",
      path: "configuration",
      action: "Set up payroll profiles",
    },
    {
      title: "Create salary structures",
      description: "Define earnings, deductions and employer contributions for a payroll profile.",
      complete: data.structures.length > 0,
      pending: "Not started",
      path: "salary-structures",
      action: "Set up salary structures",
    },
    {
      title: "Assign employee salaries",
      description: "Choose a salary structure, monthly gross and effective date for each employee in scope.",
      complete: data.assignments.length > 0,
      pending: "Not started",
      path: "employee-salary",
      action: "Set up employee salaries",
    },
    {
      title: "Review payroll inputs",
      description:
        "Check attendance, unpaid leave, variable pay and reimbursements every period. Approval records a review; it does not automatically verify attendance.",
      complete: approved,
      pending: "Manual review required",
      path: "employee-salary",
      action: "Review variable pay inputs",
    },
    {
      title: "Run payroll",
      description: "Preview, validate inputs, review salaries and exceptions, obtain approval, then process payroll.",
      complete: processed,
      pending: approved ? "Approved payroll awaits processing" : "Not processed yet",
      path: "run-payroll",
      action: "Review payroll runs",
    },
    {
      title: "View payslips and reports",
      description: "Processed payroll makes payslips and payroll register exports available.",
      complete: data.runs.some((run) => run.status === "PROCESSED" && run.snapshot.items.length > 0),
      pending: "Process payroll first",
      path: "payslips",
      action: "Open finalized payslips",
    },
  ];
  const completed = steps.filter((step) => step.complete).length;

  return (
    <Card className="mt-5 p-4">
      <section aria-labelledby="payroll-setup-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="payroll-setup-title" className="text-base font-semibold">
            Set up payroll
          </h2>
          <p className="text-sm text-text-secondary">
            {completed} of {steps.length} milestones complete
          </p>
        </div>
        <p className="mt-2 text-sm text-text-secondary">
          Start here for your first payroll. Progress reflects organization-wide milestones, not readiness for every
          employee, pay group or period. Repeat the input review for every run.
        </p>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step.title} className="flex min-w-0 gap-3 rounded-md border border-border p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-semibold text-brand">
                {step.complete ? <Icon name="check" size={16} /> : index + 1}
              </span>
              <div className="min-w-0 space-y-2">
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-xs text-text-secondary">{step.description}</p>
                <p className={`text-xs font-medium ${step.complete ? "text-brand" : "text-text-muted"}`}>
                  {step.complete ? "Complete" : step.pending}
                </p>
                <Link className={payrollGuideLinkClass} href={`${base}/${step.path}`}>
                  {step.action}
                </Link>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-text-secondary">
          For the input review, also check{" "}
          <Link className={payrollGuideLinkClass} href={`/${organizationSlug}/hrms/attendance`}>
            attendance
          </Link>
          ,{" "}
          <Link className={payrollGuideLinkClass} href={`/${organizationSlug}/hrms/leave`}>
            leave
          </Link>{" "}
          and{" "}
          <Link className={payrollGuideLinkClass} href={`${base}/reimbursements`}>
            expense claims
          </Link>
          . Finalized payroll is available in{" "}
          <Link className={payrollGuideLinkClass} href={`${base}/reports`}>
            payroll reports
          </Link>
          .
        </p>
      </section>
    </Card>
  );
}
