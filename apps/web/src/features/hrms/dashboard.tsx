"use client";

import { useMemo, useState } from "react";

import { HrmsStatCard, type HrmsStat } from "./components/hrms-stat-card";
import { TeamLeaveCalendar } from "./components/team-leave-calendar";
import { Avatar, Badge, Button, Card, CardTitle, Icon, type IconName, type Role } from "./components/ui-primitives";

const roleStats: Record<Role, HrmsStat[]> = {
  Employee: [
    {
      label: "Profile completion",
      value: "86%",
      meta: "Add bank details",
      icon: "users",
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Today’s attendance",
      value: "08:42",
      meta: "Clocked in · On time",
      icon: "clock",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Leave balance",
      value: "18.5 days",
      meta: "Across 4 leave types",
      icon: "calendar",
      tone: "bg-violet-50 text-violet-700",
    },
    { label: "Pending tasks", value: "4", meta: "2 due this week", icon: "check", tone: "bg-amber-50 text-amber-700" },
  ],
  Manager: [
    {
      label: "Team present",
      value: "21 / 24",
      meta: "87.5% attendance",
      icon: "users",
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Pending approvals",
      value: "8",
      meta: "3 require attention",
      icon: "check",
      tone: "bg-amber-50 text-amber-700",
    },
    { label: "Team headcount", value: "24", meta: "+2 this quarter", icon: "trend", tone: "bg-blue-50 text-blue-700" },
    {
      label: "Review progress",
      value: "76%",
      meta: "18 of 24 completed",
      icon: "target",
      tone: "bg-violet-50 text-violet-700",
    },
  ],
  "HR Admin": [
    { label: "Total employees", value: "486", meta: "+12 this month", icon: "users", tone: "bg-teal-50 text-teal-700" },
    {
      label: "Attendance rate",
      value: "94.8%",
      meta: "+1.6% vs last month",
      icon: "clock",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "New joiners",
      value: "18",
      meta: "6 onboarding today",
      icon: "trend",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Attrition",
      value: "1.8%",
      meta: "Below 2.4% benchmark",
      icon: "chart",
      tone: "bg-amber-50 text-amber-700",
    },
  ],
  "Platform Admin": [
    {
      label: "Active HRMS tenants",
      value: "416",
      meta: "+18 this quarter",
      icon: "briefcase",
      tone: "bg-teal-50 text-teal-700",
    },
    {
      label: "Employees managed",
      value: "48.6K",
      meta: "Across 12 countries",
      icon: "users",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "HR leave approvals",
      value: "14",
      meta: "6 require attention",
      icon: "check",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Failed integrations",
      value: "3",
      meta: "2 payroll providers",
      icon: "alert",
      tone: "bg-red-50 text-red-700",
    },
  ],
};

function SkeletonDashboard() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-20 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-40 rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-80 rounded-lg bg-slate-200" />
        <div className="h-80 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

function StateMessage({ type, retry }: { type: "Empty" | "Error"; retry: () => void }) {
  const error = type === "Error";
  return (
    <Card className="flex min-h-96 flex-col items-center justify-center p-10 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${error ? "bg-red-50 text-error" : "bg-brand-muted text-brand"}`}
      >
        <Icon name={error ? "alert" : "file"} size={26} />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-text-primary">
        {error ? "We couldn’t load workforce data" : "Nothing to show yet"}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
        {error
          ? "There was a problem connecting to the HRMS service. Your data is safe—try refreshing the view."
          : "Data matching this view will appear here. Adjust your filters or add your first record."}
      </p>
      <div className="mt-5">
        <Button onClick={retry} variant={error ? "primary" : "secondary"}>
          {error ? "Try again" : "Clear filters"}
        </Button>
      </div>
    </Card>
  );
}

function WorkforceChart() {
  const values = [318, 336, 351, 369, 394, 421, 438, 452, 467, 486];
  return (
    <Card className="overflow-hidden">
      <CardTitle
        title="Workforce growth"
        subtitle="Active employee headcount · Jan–Oct 2026"
        action={
          <select className="rounded-md border border-border bg-white px-3 py-1.5 text-xs text-text-secondary">
            <option>Last 10 months</option>
            <option>This year</option>
          </select>
        }
      />
      <div className="p-5">
        <div className="flex h-56 items-end gap-3 border-b border-l border-border px-4 pt-4">
          {values.map((value, index) => (
            <div key={value} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className="relative w-full rounded-t bg-brand/15 transition group-hover:bg-brand/25"
                style={{ height: `${(value / 500) * 100}%` }}
              >
                <div className="absolute inset-x-0 top-0 h-1 rounded bg-brand" />
              </div>
              <span className="text-[10px] font-medium text-text-muted">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"][index]}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-text-primary">+53.0%</span>
            <span className="ml-2 text-xs text-text-muted">growth since January</span>
          </div>
          <Badge tone="brand">486 active</Badge>
        </div>
      </div>
    </Card>
  );
}

function AttendanceBreakdown() {
  const data = [
    { label: "Present", value: 432, percent: 89, color: "bg-brand" },
    { label: "On leave", value: 28, percent: 6, color: "bg-blue-500" },
    { label: "Remote", value: 18, percent: 4, color: "bg-violet-500" },
    { label: "Absent", value: 8, percent: 1, color: "bg-rose-500" },
  ];
  return (
    <Card>
      <CardTitle
        title="Today’s attendance"
        subtitle="Live as of 10:42 AM"
        action={<Badge tone="success">94.8% rate</Badge>}
      />
      <div className="space-y-5 p-5">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-text-secondary">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                {item.label}
              </span>
              <span className="font-semibold text-text-primary">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const approvals = [
  {
    name: "Priya Verma",
    initials: "PV",
    request: "Annual leave · 3 days",
    date: "Oct 14–16",
    tone: "warning" as const,
  },
  { name: "Rohan Kapoor", initials: "RK", request: "Attendance regularization", date: "Oct 8", tone: "info" as const },
  { name: "Ishita Khanna", initials: "IK", request: "WFH request · 1 day", date: "Oct 11", tone: "brand" as const },
];

function ApprovalsCard({ onToast }: { onToast: (message: string) => void }) {
  return (
    <Card>
      <CardTitle
        title="Pending approvals"
        subtitle="8 requests need your review"
        action={<button className="text-xs font-semibold text-brand">View all</button>}
      />
      <div className="divide-y divide-border">
        {approvals.map((item, index) => (
          <div key={item.name} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50">
            <Avatar initials={item.initials} index={index + 2} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{item.name}</p>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {item.request} · {item.date}
              </p>
            </div>
            <button
              onClick={() => onToast(`${item.name}’s request was approved`)}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-muted text-brand hover:bg-teal-100"
              aria-label={`Approve ${item.name}`}
            >
              <Icon name="check" size={16} />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-red-50 hover:text-error"
              aria-label={`Reject ${item.name}`}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MomentsCard() {
  return (
    <Card>
      <CardTitle title="People moments" subtitle="Celebrate your team this week" />
      <div className="space-y-3 p-5">
        {[
          { title: "3 birthdays", detail: "Ananya, Dev and Mohit", label: "Today" },
          { title: "5 work anniversaries", detail: "Including Neha · 5 years", label: "This week" },
          { title: "6 new joiners", detail: "Starting across 4 teams", label: "Monday" },
        ].map((item, index) => (
          <div key={item.title} className="flex items-center gap-3 rounded-md border border-border p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-muted text-brand">
              <Icon name={index === 2 ? "users" : "cake"} size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">{item.title}</p>
              <p className="truncate text-xs text-text-muted">{item.detail}</p>
            </div>
            <Badge>{item.label}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TeamAttendanceCard() {
  const members = [
    { name: "Ananya Sharma", initials: "AS", status: "Present", time: "08:42 AM" },
    { name: "Rohan Kapoor", initials: "RK", status: "Remote", time: "09:06 AM" },
    { name: "Neha Mehta", initials: "NM", status: "On leave", time: "Annual leave" },
    { name: "Priya Verma", initials: "PV", status: "Present", time: "08:51 AM" },
    { name: "Ishita Khanna", initials: "IK", status: "Late", time: "09:28 AM" },
  ];
  return (
    <Card className="overflow-hidden">
      <CardTitle
        title="Team attendance"
        subtitle="21 of 24 team members are available"
        action={<button className="text-xs font-semibold text-brand">Open team view</button>}
      />
      <div className="divide-y divide-border">
        {members.map((member, index) => (
          <div key={member.name} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
            <Avatar initials={member.initials} index={index} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{member.name}</p>
              <p className="text-xs text-text-muted">{member.time}</p>
            </div>
            <Badge
              tone={
                member.status === "Present"
                  ? "success"
                  : member.status === "Remote"
                    ? "info"
                    : member.status === "Late"
                      ? "danger"
                      : "warning"
              }
            >
              {member.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReviewProgressCard() {
  const teams = [
    { name: "Product Design", value: 92, total: "11 / 12" },
    { name: "Product Management", value: 78, total: "7 / 9" },
    { name: "Research", value: 66, total: "2 / 3" },
  ];
  return (
    <Card>
      <CardTitle title="Performance review status" subtitle="Q3 review cycle closes in 6 days" />
      <div className="space-y-5 p-5">
        {teams.map((team) => (
          <div key={team.name}>
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-semibold text-text-primary">{team.name}</span>
              <span className="text-text-muted">
                {team.total} · {team.value}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand" style={{ width: `${team.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ManagerDashboard({ onToast }: { onToast: (message: string) => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <TeamAttendanceCard />
      </div>
      <ApprovalsCard onToast={onToast} />
      <div className="xl:col-span-2">
        <TeamLeaveCalendar />
      </div>
      <ReviewProgressCard />
    </div>
  );
}

function RecruitmentFunnel() {
  const stages = [
    { label: "Applied", value: 184, width: "w-full", color: "bg-brand" },
    { label: "Screening", value: 96, width: "w-4/5", color: "bg-teal-600" },
    { label: "Interview", value: 42, width: "w-3/5", color: "bg-teal-700" },
    { label: "Offer", value: 12, width: "w-2/5", color: "bg-teal-800" },
    { label: "Hired", value: 8, width: "w-1/4", color: "bg-teal-900" },
  ];
  return (
    <Card>
      <CardTitle
        title="Recruitment funnel"
        subtitle="26 open roles · October 2026"
        action={<Badge tone="brand">32 days to hire</Badge>}
      />
      <div className="space-y-2 p-5">
        {stages.map((stage) => (
          <div
            key={stage.label}
            className={`mx-auto flex h-9 items-center justify-between rounded-md px-3 text-xs font-semibold text-white ${stage.width} ${stage.color}`}
          >
            <span>{stage.label}</span>
            <span>{stage.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PayrollStatusCard() {
  const steps = [
    { label: "Attendance validation", status: "Complete", date: "Oct 24" },
    { label: "Variable pay review", status: "In progress", date: "Oct 27" },
    { label: "Leadership approval", status: "Pending", date: "Oct 28" },
    { label: "Bank processing", status: "Upcoming", date: "Oct 30" },
  ];
  return (
    <Card>
      <CardTitle
        title="October payroll"
        subtitle="₹4.82 Cr estimated payout"
        action={<Badge tone="warning">In review</Badge>}
      />
      <div className="p-5">
        {steps.map((step, index) => (
          <div key={step.label} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 && <span className="absolute left-3 top-6 h-full w-px bg-border" />}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${step.status === "Complete" ? "bg-brand text-white" : "border border-border bg-white text-text-muted"}`}
            >
              {step.status === "Complete" ? (
                <Icon name="check" size={13} />
              ) : (
                <span className="text-[10px] font-bold">{index + 1}</span>
              )}
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">{step.label}</p>
                <p className="text-xs text-text-muted">{step.status}</p>
              </div>
              <span className="text-xs font-medium text-text-muted">{step.date}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ComplianceCard() {
  const alerts = [
    { title: "POSH training expires", detail: "12 employees · Due Oct 18", tone: "danger" as const },
    { title: "Provident Fund filing", detail: "Due in 6 days", tone: "warning" as const },
    { title: "Probation reviews pending", detail: "8 employees · 3 overdue", tone: "info" as const },
  ];
  return (
    <Card>
      <CardTitle
        title="Compliance alerts"
        subtitle="Items requiring HR attention"
        action={<button className="text-xs font-semibold text-brand">Audit log</button>}
      />
      <div className="space-y-3 p-5">
        {alerts.map((alert) => (
          <div key={alert.title} className="flex items-center gap-3 rounded-md border border-border p-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${alert.tone === "danger" ? "bg-red-50 text-error" : alert.tone === "warning" ? "bg-amber-50 text-warning" : "bg-blue-50 text-info"}`}
            >
              <Icon name="alert" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
              <p className="text-xs text-text-muted">{alert.detail}</p>
            </div>
            <Icon name="chevron" size={14} className="text-text-muted" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminDashboard({ onToast }: { onToast: (message: string) => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <WorkforceChart />
      </div>
      <AttendanceBreakdown />
      <PayrollStatusCard />
      <RecruitmentFunnel />
      <ComplianceCard />
      <div className="xl:col-span-2">
        <ApprovalsCard onToast={onToast} />
      </div>
      <MomentsCard />
    </div>
  );
}

function PlatformAdminDashboard({ onToast }: { onToast: (message: string) => void }) {
  const requests = [
    {
      name: "Neha Mehta",
      org: "Acme Technologies",
      leave: "Earned leave · 5 days",
      dates: "Oct 21–25",
      status: "Manager approved",
    },
    {
      name: "Aditi Bose",
      org: "Northstar Labs",
      leave: "Sabbatical · 20 days",
      dates: "Nov 4–29",
      status: "HR submitted",
    },
    {
      name: "Kunal Shah",
      org: "Orbit Commerce",
      leave: "Paternity leave · 10 days",
      dates: "Oct 14–25",
      status: "Manager approved",
    },
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="overflow-hidden xl:col-span-2">
        <CardTitle
          title="HR leave approval queue"
          subtitle="Requests from organization HR users cannot be self-approved"
          action={<Badge tone="warning">14 pending</Badge>}
        />
        <div className="divide-y divide-border">
          {requests.map((request, index) => (
            <div key={request.name} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50">
              <Avatar
                initials={request.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
                index={index + 2}
              />
              <div className="min-w-48 flex-1">
                <p className="text-sm font-semibold text-text-primary">{request.name}</p>
                <p className="text-xs text-text-muted">{request.org}</p>
              </div>
              <div className="min-w-44">
                <p className="text-sm font-medium text-text-primary">{request.leave}</p>
                <p className="text-xs text-text-muted">
                  {request.dates} · {request.status}
                </p>
              </div>
              <Button variant="secondary" onClick={() => onToast(`Reviewing ${request.name}’s approval trail`)}>
                Review
              </Button>
              <Button onClick={() => onToast(`${request.name}’s leave was approved`)}>Approve</Button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle title="Platform alerts" subtitle="Cross-tenant operations" />
        <div className="space-y-3 p-5">
          {[
            ["Payroll connector failed", "Orbit Commerce · 12 min ago"],
            ["Tax pack expires soon", "Singapore · 9 organizations"],
            ["Missing compliance setup", "4 trial organizations"],
            ["Security event", "Unusual export volume"],
          ].map(([title, detail], index) => (
            <div key={title} className="flex gap-3 rounded-md border border-border p-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${index === 3 ? "bg-red-50 text-error" : "bg-amber-50 text-warning"}`}
              >
                <Icon name="alert" size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-text-muted">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle title="Country tax packs" subtitle="Configuration health by jurisdiction" />
        <div className="space-y-4 p-5">
          {[
            ["India", "142 tenants", "Current"],
            ["Singapore", "38 tenants", "Update due"],
            ["United Kingdom", "26 tenants", "Current"],
            ["United States", "84 tenants", "Current"],
          ].map(([country, tenants, status]) => (
            <div key={country} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{country}</p>
                <p className="text-xs text-text-muted">{tenants}</p>
              </div>
              <Badge tone={status === "Current" ? "success" : "warning"}>{status}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card className="xl:col-span-2">
        <CardTitle
          title="Tenant operations"
          subtitle="Strictly permission-gated cross-organization view"
          action={
            <Button variant="secondary" icon="download">
              Export report
            </Button>
          }
        />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {[
            ["Payroll runs", "1,284", "98.7% successful"],
            ["Compliance packs", "392", "94.2% coverage"],
            ["Integration health", "99.3%", "7-day uptime"],
          ].map(([label, value, meta]) => (
            <div key={label} className="rounded-md bg-slate-50 p-4">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="mt-2 font-display text-xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-success">{meta}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmployeeDashboard({ onToast }: { onToast: (message: string) => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardTitle
          title="Today’s attendance"
          subtitle="Wednesday, 9 October"
          action={<Badge tone="success">Clocked in</Badge>}
        />
        <div className="grid gap-5 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-text-muted">CLOCK IN</p>
            <p className="mt-2 font-display text-xl font-bold text-text-primary">08:42 AM</p>
            <p className="mt-1 text-xs text-success">18 minutes early</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">WORK HOURS</p>
            <p className="mt-2 font-display text-xl font-bold text-text-primary">02h 18m</p>
            <p className="mt-1 text-xs text-text-muted">of 8h 30m</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">BREAK</p>
            <p className="mt-2 font-display text-xl font-bold text-text-primary">24 min</p>
            <p className="mt-1 text-xs text-text-muted">1 break taken</p>
          </div>
          <div className="md:col-span-3">
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 w-1/4 rounded-full bg-brand" />
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => onToast("You clocked out at 11:00 AM")}>Clock out</Button>
              <Button variant="secondary">Take a break</Button>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle title="Quick actions" />
        <div className="grid grid-cols-2 gap-3 p-5">
          {["Apply leave", "View payslip", "My documents", "Raise request"].map((action, index) => (
            <button
              key={action}
              onClick={() => onToast(`${action} opened`)}
              className="flex flex-col items-start rounded-md border border-border p-3 text-left hover:border-brand/30 hover:bg-brand-muted/40"
            >
              <Icon name={["calendar", "file", "file", "plus"][index] as IconName} className="text-brand" />
              <span className="mt-3 text-xs font-semibold text-text-primary">{action}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card className="xl:col-span-2">
        <CardTitle title="My leave balance" subtitle="Current leave year · Jan–Dec 2026" />
        <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          {[
            { t: "Privilege", v: "10.5", c: "bg-teal-500" },
            { t: "Sick", v: "4.0", c: "bg-blue-500" },
            { t: "Casual", v: "3.0", c: "bg-violet-500" },
            { t: "Wellness", v: "1.0", c: "bg-amber-500" },
          ].map((item) => (
            <div key={item.t} className="rounded-md bg-slate-50 p-4">
              <span className={`block h-1.5 w-8 rounded-full ${item.c}`} />
              <p className="mt-4 font-display text-2xl font-bold text-text-primary">{item.v}</p>
              <p className="mt-1 text-xs text-text-muted">{item.t} days</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardTitle title="Upcoming" />
        <div className="space-y-4 p-5">
          <div className="flex gap-3">
            <div className="rounded-md bg-brand-muted px-3 py-2 text-center text-brand">
              <p className="text-[10px] font-bold">OCT</p>
              <p className="text-lg font-bold">12</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Dussehra</p>
              <p className="text-xs text-text-muted">Company holiday · Friday</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-md bg-blue-50 px-3 py-2 text-center text-blue-700">
              <p className="text-[10px] font-bold">OCT</p>
              <p className="text-lg font-bold">15</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Q4 Town hall</p>
              <p className="text-xs text-text-muted">4:00 PM · Auditorium</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LegacyDashboardContent({ role, onToast }: { role: Role; onToast: (message: string) => void }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roleStats[role].map((item) => (
          <HrmsStatCard key={item.label} item={item} />
        ))}
      </div>
      <div className="mt-5">
        {role === "Employee" ? (
          <EmployeeDashboard onToast={onToast} />
        ) : (
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <WorkforceChart />
            </div>
            <AttendanceBreakdown />
            <ApprovalsCard onToast={onToast} />
            <MomentsCard />
            <Card>
              <CardTitle
                title={role === "Manager" ? "Team milestones" : "Compliance alerts"}
                subtitle="Items requiring attention"
              />
              <div className="space-y-3 p-5">
                {[
                  "POSH training expires for 12 employees",
                  "PF filing due in 6 days",
                  "8 probation reviews pending",
                ].map((text, index) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${index === 0 ? "bg-error" : index === 1 ? "bg-warning" : "bg-info"}`}
                    />
                    <span className="flex-1 text-text-secondary">{text}</span>
                    <Icon name="chevron" size={14} className="text-text-muted" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

export function HrmsDashboard({ role, onToast }: { role: Role; onToast: (message: string) => void }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roleStats[role].map((item) => (
          <HrmsStatCard key={item.label} item={item} />
        ))}
      </div>
      <div className="mt-5">
        {role === "Employee" ? (
          <EmployeeDashboard onToast={onToast} />
        ) : role === "Manager" ? (
          <ManagerDashboard onToast={onToast} />
        ) : role === "Platform Admin" ? (
          <PlatformAdminDashboard onToast={onToast} />
        ) : (
          <AdminDashboard onToast={onToast} />
        )}
      </div>
    </>
  );
}
