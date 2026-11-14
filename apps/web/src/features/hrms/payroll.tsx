"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { payrollService, type PayrollWorkspace, type PayrollRun, type PayrollItem } from "@/services/payroll.service";
import { Button, Card, Icon } from "./components/ui-primitives";
import { PayrollForm, PayrollRunDecisionForm } from "./payroll-forms";
import { usePayrollLayout, type PayrollSection } from "./payroll-layout";
import { PayrollDrawer } from "./payroll-drawer";
import { PayrollDashboard } from "./payroll-dashboard";
import { PayrollConfiguration } from "./payroll-configuration";
import { PayrollSalaryStructures } from "./payroll-salary-structures";
import { PayrollEmployeeSalary } from "./payroll-employee-salary";
import { PayrollReimbursements } from "./payroll-reimbursements";
import { PayrollRunPage } from "./payroll-run-page";
import { PayrollPayslips } from "./payroll-payslips";
import { PayrollReports } from "./payroll-reports";
import { PayrollPayslipDialog } from "./payroll-payslip-dialog";
import { money } from "./payroll-shared";

export function HrmsPayroll({ onToast, section }: { onToast: (message: string) => void; section: PayrollSection }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  if (!organizationId)
    return (
      <p role="status" className="text-sm text-text-secondary">
        Select an organization to access payroll.
      </p>
    );
  // Remount tenant-local drafts and financial data on organization changes.
  return <PayrollWorkspaceView key={organizationId} organizationId={organizationId} onToast={onToast} tab={section} />;
}

function PayrollWorkspaceView({
  organizationId,
  onToast,
  tab,
}: {
  organizationId: string;
  onToast: (message: string) => void;
  tab: PayrollSection;
}) {
  const { can } = usePermissions();
  const { registerStart } = usePayrollLayout();
  const [data, setData] = useState<PayrollWorkspace | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState<{ run?: PayrollRun } | null>(null);
  const [form, setForm] = useState<"profile" | "structure" | "assignment" | "claim" | "variable" | null>(null);
  const [slip, setSlip] = useState<{ run: PayrollRun; item: PayrollItem } | null>(null);
  const [decision, setDecision] = useState<{ runId: string; action: "cancel" | "reject" } | null>(null);
  const load = useCallback(
    () =>
      payrollService
        .workspace(organizationId)
        .then((result) => {
          setData(result);
          setError("");
        })
        .catch((failure: unknown) => {
          setError(failure instanceof Error ? failure.message : "Unable to load payroll");
        }),
    [organizationId],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const canStart = Boolean(data) && can("hrms.payroll.manage");
  useEffect(() => {
    registerStart(canStart ? () => setDrawer({}) : null);
    return () => registerStart(null);
  }, [canStart, registerStart]);
  async function action(work: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      await work();
      onToast(message);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Payroll action failed");
    } finally {
      setBusy(false);
    }
  }
  const processed = data?.runs.filter((run) => run.status === "PROCESSED") ?? [];
  const latest = data?.runs.find((run) => run.status !== "CANCELLED" && run.status !== "REJECTED");
  const currency = latest?.profile.currency;
  const stats = [
    [
      "Total payout",
      latest && currency ? money(latest.totalNet, currency) : "Not calculated",
      `${latest?.employeeCount ?? 0} employees`,
    ],
    [
      "Payroll status",
      latest?.status ?? "Not started",
      `${data?.runs.filter((run) => run.status === "DRAFT").length ?? 0} approvals pending`,
    ],
    [
      "Payslips",
      String(processed.reduce((sum, run) => sum + run.employeeCount, 0)),
      `${processed.length} processed runs`,
    ],
    [
      "Reimbursements",
      String(data?.claims.filter((claim) => claim.status === "PENDING").length ?? 0),
      "Pending claims · totals shown per currency in reports",
    ],
  ];
  return (
    <div className="w-full min-w-0 text-text-primary">
      <div role="region" id="payroll-panel" aria-label={tab} className="w-full min-w-0">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-md border border-error/30 p-3 text-sm text-error"
          >
            {error}
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        )}
        {!data && !error && (
          <p role="status" className="py-6 text-sm text-text-secondary">
            Loading payroll...
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, meta], index) => (
            <Card key={label} className="min-w-0 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-secondary">{label}</p>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand">
                  <Icon name="wallet" size={14} />
                </span>
              </div>
              <p className="mt-2 break-words text-xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-text-muted">{meta}</p>
              {index === 0 && (
                <div className="mt-2 h-1 rounded-full bg-surface-raised">
                  <div className={`h-1 rounded-full bg-brand ${latest?.status === "PROCESSED" ? "w-full" : "w-0"}`} />
                </div>
              )}
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Payout and payroll status reflect the most recently created pay-group run; currencies are never combined.
        </p>
        {tab === "Dashboard" && <PayrollDashboard data={data} latest={latest} setDrawer={setDrawer} />}
        {data && (
          <>
            {tab === "Configuration" && (
              <PayrollConfiguration
                data={data}
                organizationId={organizationId}
                can={can}
                busy={busy}
                action={action}
                setForm={setForm}
              />
            )}
            {tab === "Salary structures" && <PayrollSalaryStructures data={data} can={can} setForm={setForm} />}
            {tab === "Employee salary" && (
              <PayrollEmployeeSalary
                data={data}
                organizationId={organizationId}
                can={can}
                busy={busy}
                action={action}
                setForm={setForm}
              />
            )}
            {tab === "Reimbursements" && (
              <PayrollReimbursements
                data={data}
                organizationId={organizationId}
                can={can}
                busy={busy}
                action={action}
                setForm={setForm}
              />
            )}
            {tab === "Run payroll" && (
              <PayrollRunPage
                data={data}
                organizationId={organizationId}
                can={can}
                busy={busy}
                action={action}
                setDrawer={setDrawer}
                setDecision={setDecision}
              />
            )}
            {tab === "Payslips" && <PayrollPayslips data={data} setSlip={setSlip} />}
            {tab === "Reports" && <PayrollReports data={data} setSlip={setSlip} />}
            {decision && (
              <PayrollRunDecisionForm
                organizationId={organizationId}
                runId={decision.runId}
                action={decision.action}
                close={() => setDecision(null)}
                complete={() => {
                  setDecision(null);
                  onToast("Payroll draft closed; its history is preserved.");
                  void load();
                }}
              />
            )}
            {form && (
              <PayrollForm
                kind={form}
                data={data}
                organizationId={organizationId}
                close={() => setForm(null)}
                complete={() => {
                  setForm(null);
                  onToast("Payroll configuration saved");
                  void load();
                }}
              />
            )}
            {drawer && (
              <PayrollDrawer
                organizationId={organizationId}
                data={data}
                initialRun={drawer.run}
                close={() => setDrawer(null)}
                complete={(message) => {
                  setDrawer(null);
                  onToast(message);
                  void load();
                }}
              />
            )}
          </>
        )}
        {slip && <PayrollPayslipDialog slip={slip} close={() => setSlip(null)} />}
      </div>
    </div>
  );
}
