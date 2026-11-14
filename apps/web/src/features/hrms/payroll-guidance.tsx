"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import type { PayrollWorkspace } from "@/services/payroll.service";
import type { PayrollSection } from "./payroll-layout";
import { payrollGuideLinkClass } from "./payroll-shared";

export function PayrollStateGuide() {
  return (
    <details className="mt-4 rounded-lg border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-semibold">What do payroll statuses mean?</summary>
      <dl className="mt-3 grid gap-3 text-sm md:grid-cols-3">
        <div>
          <dt className="font-semibold">Draft</dt>
          <dd className="mt-1 text-text-secondary">
            Saved for review, not finalized. Review inputs and exceptions before requesting approval.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Approved</dt>
          <dd className="mt-1 text-text-secondary">
            The reviewed payroll snapshot is locked. Reopen it to confirm processing.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Processed</dt>
          <dd className="mt-1 text-text-secondary">
            Payroll is finalized and payslips are available. This is not proof of bank payment.
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-text-secondary">
        A different user must approve a draft. Cancelled or rejected drafts remain in history; correct the inputs and
        create a replacement run.
      </p>
      <p className="mt-3 text-sm text-warning">
        Processing payroll does not transfer money. Sandbox payments are simulations and move no real funds.
      </p>
    </details>
  );
}

export function PayrollGuidance({
  section,
  data,
}: {
  section: Exclude<PayrollSection, "Dashboard">;
  data: PayrollWorkspace;
}) {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const { can } = usePermissions();
  const base = `/${organizationSlug}/hrms/payroll`;
  const hasProcessed = data.runs.some((run) => run.status === "PROCESSED");
  const guides = {
    Configuration: {
      description: "Payroll profiles define the country, currency, pay frequency and calendar for each pay group.",
      prerequisite:
        "Before running payroll, configure a profile and independently verify its local rules. Selecting a country does not load tax laws.",
      empty: !data.profiles.length,
      title: "No payroll profiles yet",
      next: "Use Add payroll profile to create your first pay group, then create its salary structures.",
      path: "salary-structures",
      action: "Next: salary structures",
    },
    "Salary structures": {
      description: "Salary structures define how earnings, deductions and employer contributions are calculated.",
      prerequisite: "Create a payroll profile first, then add components and formulas for that pay group.",
      empty: !data.structures.length,
      title: "No salary structures yet",
      next: data.profiles.length
        ? "Use Add salary structure to define the components of employee pay."
        : "Create a payroll profile before adding a salary structure.",
      path: "configuration",
      action: "Review payroll profiles",
    },
    "Employee salary": {
      description:
        "Assign salary structures and effective-dated pay to employees. Review and approve variable inputs separately.",
      prerequisite:
        "Add employees in Workforce and create salary structures first. New salary assignments preserve prior revisions.",
      empty: !data.assignments.length,
      title: "No employee salaries assigned",
      next: !data.employees.length
        ? "Add employees in Workforce before assigning salaries."
        : !data.structures.length
          ? "Create a salary structure before assigning employee pay."
          : "Use Assign / revise salary to choose an employee, structure, monthly gross and effective date.",
      path: "salary-structures",
      action: "Review salary structures",
    },
    Reimbursements: {
      description: "Record employee expenses with their currency, expense date and receipt reference.",
      prerequisite: "Add employees first. Claims need approval before they can be included in an eligible payroll run.",
      empty: !data.claims.length,
      title: "No reimbursements yet",
      next: "Reimbursements are optional. If an employee has an expense, use Add reimbursement and obtain approval before payroll.",
      path: "run-payroll",
      action: "Continue to payroll runs",
    },
    "Run payroll": {
      description: "Run payroll through preview, input validation, salary review, exceptions, approval and processing.",
      prerequisite:
        "Configure verified payroll rules, salary structures and employee salaries. Review attendance, unpaid leave, variable pay and claims for the selected period.",
      empty: !data.runs.length,
      title: "No payroll runs yet",
      next: !data.assignments.length
        ? "Complete setup and assign employee salaries before starting your first run."
        : "Use Start payroll run above to choose a pay group, period and pay date, then review the calculation.",
      path: "",
      action: "Open setup checklist",
    },
    Payslips: {
      description: "View finalized employee pay and download payslip data for a processed payroll period.",
      prerequisite:
        "A draft or approved run must be processed before its payslips appear. Payslips do not confirm bank payment.",
      empty: !hasProcessed,
      title: "No finalized payslips yet",
      next: "Open a payroll run, complete the review and independent approval, then process it to generate payslips.",
      path: "run-payroll",
      action: "Open payroll runs",
    },
    Reports: {
      description: "Review processed payroll registers, employee totals and available prior-period variances.",
      prerequisite:
        "Process a payroll run, then select its period to inspect or export the register. Exports are not statutory filings.",
      empty: !hasProcessed,
      title: "No processed payroll reports yet",
      next: "Reports become available after payroll is processed. Draft and approved runs are still in Run payroll.",
      path: "run-payroll",
      action: "Review payroll runs",
    },
  } satisfies Record<
    Exclude<PayrollSection, "Dashboard">,
    {
      description: string;
      prerequisite: string;
      empty: boolean;
      title: string;
      next: string;
      path: string;
      action: string;
    }
  >;
  const guide = guides[section];

  return (
    <section aria-label={`${section} guide`} className="mt-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-base font-semibold">
        {section === "Run payroll" ? "How to run payroll" : `About ${section.toLowerCase()}`}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">{guide.description}</p>
      <p className="mt-2 text-sm text-text-secondary">{guide.prerequisite}</p>
      {guide.empty && (
        <div className="mt-3 border-t border-border pt-3">
          <h3 className="text-sm font-semibold">{guide.title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{guide.next}</p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        <Link className={payrollGuideLinkClass} href={guide.path ? `${base}/${guide.path}` : base}>
          {guide.action}
        </Link>
        {section === "Employee salary" && (
          <Link className={payrollGuideLinkClass} href={`/${organizationSlug}/hrms/employees/directory`}>
            Open employee directory
          </Link>
        )}
      </div>
      {!can("hrms.payroll.manage") && (
        <p className="mt-3 text-xs text-text-muted">
          Ask a payroll administrator to make setup changes or start a run. Approval requires payroll approval
          permission.
        </p>
      )}
      {section === "Run payroll" && <PayrollStateGuide />}
    </section>
  );
}
