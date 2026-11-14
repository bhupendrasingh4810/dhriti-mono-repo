"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Badge, Button, Card, CardTitle } from "./components/ui-primitives";
import { usePermissions } from "@/hooks/use-permissions";

export function OffboardingWorkflow({ onToast }: { onToast: (message: string) => void }) {
  const [checks, setChecks] = useState([true, true, false, false, false]);
  const steps = [
    "Manager handover completed",
    "Resignation document verified",
    "Assets returned and inspected",
    "System access scheduled for removal",
    "Final settlement approved",
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardTitle
          title="Offboarding · Siddharth Menon"
          subtitle="Last working day · 31 October 2026"
          action={<Badge tone="warning">In progress</Badge>}
        />
        <div className="space-y-3 p-5">
          {steps.map((step, index) => (
            <label
              key={step}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-4 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={checks[index]}
                onChange={() =>
                  setChecks((current) => current.map((value, itemIndex) => (itemIndex === index ? !value : value)))
                }
              />
              <div className="flex-1">
                <p className="text-sm font-semibold">{step}</p>
                <p className="text-xs text-text-muted">
                  Owner: {["Rohan Kapoor", "People Ops", "IT Operations", "Identity Admin", "Finance"][index]}
                </p>
              </div>
              <Badge tone={checks[index] ? "success" : "neutral"}>{checks[index] ? "Complete" : "Pending"}</Badge>
            </label>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle title="Exit details" />
        <div className="space-y-4 p-5 text-sm">
          <div>
            <p className="text-xs text-text-muted">Reason</p>
            <p className="font-semibold">Career opportunity</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Notice period</p>
            <p className="font-semibold">60 days · Served</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Exit interview</p>
            <p className="font-semibold">Oct 28 · 3:00 PM</p>
          </div>
          <Button onClick={() => onToast("Offboarding changes saved")}>Save progress</Button>
          <Button variant="danger" disabled={checks.some((item) => !item)}>
            Complete offboarding
          </Button>
        </div>
      </Card>
    </div>
  );
}

const tabs = [
  { label: "Directory", href: "directory" },
  { label: "Import", href: "import" },
  { label: "Organization chart", href: "organization-hierarchy" },
  { label: "Offboarding", href: "offboarding" },
] as const;

/**
 * Workforce shell shared by the /hrms/employees/* routes (one route per tab).
 * Restricted to admins and members holding `hrms.employee.manage`.
 */
export function HrmsWorkforceShell({ children }: { children: ReactNode }) {
  const { can, loading } = usePermissions();
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const pathname = usePathname();
  const base = `/${organizationSlug}/hrms/employees`;

  if (loading) {
    return (
      <p role="status" className="py-16 text-center text-sm text-text-muted">
        Checking access…
      </p>
    );
  }
  if (!can("hrms.employee.manage")) {
    return (
      <Card className="mx-auto mt-10 max-w-xl p-8 text-center">
        <h2 className="font-display text-lg font-bold text-text-primary">Workforce is restricted</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You need to be an administrator or have the workforce management permission to view this page.
        </p>
      </Card>
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Workforce sections" className="mb-5 flex shrink-0 gap-1 overflow-x-auto border-b border-border pb-3">
        {tabs.map((item) => {
          const active = pathname === `${base}/${item.href}`;
          return (
            <Link
              key={item.href}
              href={`${base}/${item.href}`}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 cursor-pointer rounded-md px-3.5 py-2 text-sm font-semibold ${active ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-raised"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
