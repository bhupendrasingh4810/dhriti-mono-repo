"use client";

import { useMemo, useState } from "react";

import { EmployeeMasterData } from "./components/employee-master-data";
import { Avatar, Badge, Button, Card, CardTitle, Icon, type DirectoryEmployee } from "./components/ui-primitives";

function EmployeeDirectory({
  employees,
  onAdd,
  onToast,
}: {
  employees: DirectoryEmployee[];
  onAdd: () => void;
  onToast: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = useMemo(
    () =>
      employees.filter(
        (employee) =>
          `${employee.name} ${employee.role} ${employee.department}`.toLowerCase().includes(query.toLowerCase()) &&
          (department === "All departments" || employee.department === department),
      ),
    [employees, query, department],
  );
  const activeCount = employees.filter((employee) => employee.status === "active").length;
  const onLeaveCount = employees.filter((employee) => employee.status === "on-leave").length;
  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total employees", String(employees.length), "Current organization"],
          [
            "Active",
            String(activeCount),
            employees.length ? `${Math.round((activeCount / employees.length) * 100)}% of workforce` : "No employees",
          ],
          ["On leave", String(onLeaveCount), "Today"],
          ["New joiners", "0", "This month"],
        ].map(([label, value, meta], index) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">{label}</p>
              <Icon name={index === 2 ? "calendar" : "users"} className="text-brand" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-text-primary">{value}</p>
            <p className="mt-1 text-xs text-text-muted">{meta}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <label className="relative min-w-64 flex-1">
            <Icon name="search" size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, role or department…"
              className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text-secondary"
          >
            <option>All departments</option>
            <option>Engineering</option>
            <option>Product & Design</option>
            <option>People</option>
            <option>Finance</option>
            <option>Marketing</option>
            <option>Customer Success</option>
          </select>
          <Button variant="secondary" icon="filter">
            More filters
          </Button>
          <Button
            variant="secondary"
            icon="download"
            onClick={() => onToast("Employee directory export is being prepared")}
          >
            Export
          </Button>
          <Button icon="plus" onClick={onAdd}>
            Add employee
          </Button>
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-3 bg-brand-muted px-5 py-2.5 text-sm text-brand">
            <span className="font-semibold">{selected.length} selected</span>
            <button className="font-medium hover:underline">Send email</button>
            <button className="font-medium hover:underline">Assign policy</button>
            <button onClick={() => setSelected([])} className="ml-auto">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="w-12 px-5 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all employees"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={() =>
                      setSelected(selected.length === filtered.length ? [] : filtered.map((employee) => employee.id))
                    }
                  />
                </th>
                <th className="px-3 py-3">Employee</th>
                <th className="px-3 py-3">Department</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Employment</th>
                <th className="px-3 py-3">Status</th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={`cursor-pointer transition hover:bg-brand-muted/30 ${selected.includes(employee.id) ? "bg-brand-muted/50" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(employee.id)}
                      onChange={() => toggle(employee.id)}
                      aria-label={`Select ${employee.name}`}
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        initials={employee.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                        index={index}
                      />
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{employee.name}</p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {employee.role} · {employee.code}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-text-secondary">{employee.department}</td>
                  <td className="px-3 py-3.5 text-sm text-text-secondary">{employee.location}</td>
                  <td className="px-3 py-3.5">
                    <Badge>{employee.type}</Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge
                      tone={
                        employee.status === "active" ? "success" : employee.status === "on-leave" ? "warning" : "danger"
                      }
                    >
                      {employee.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <button className="rounded-md p-2 text-text-muted hover:bg-slate-100">
                      <Icon name="dots" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-semibold text-text-primary">No employees found</p>
              <p className="mt-1 text-sm text-text-muted">Try a different search or filter.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-text-muted">
          <span>
            Showing {filtered.length} of {employees.length} employees
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled>
              Previous
            </Button>
            <span className="rounded-md bg-brand px-3 py-2 font-semibold text-white">1</span>
            <Button variant="secondary">Next</Button>
          </div>
        </div>
      </Card>
    </>
  );
}

function EmployeeProfileDrawer({ close, onToast }: { close: () => void; onToast: (message: string) => void }) {
  const [tab, setTab] = useState("Overview");
  const tabs = ["Overview", "Attendance", "Leave", "Payroll", "Performance", "Documents"];
  const timeline = [
    { title: "Performance goal updated", detail: "Design system adoption · 78% complete", date: "Today" },
    { title: "Leave request approved", detail: "Wellness leave · 18 October", date: "Yesterday" },
    { title: "Document uploaded", detail: "Address proof · Verified", date: "4 days ago" },
  ];
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[1px]" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Employee profile"
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Employees</span>
            <Icon name="chevron" size={12} />
            <span>Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => onToast("Employee profile edit mode opened")}>
              Edit profile
            </Button>
            <button
              onClick={close}
              className="rounded-md p-2 text-text-muted hover:bg-slate-100"
              aria-label="Close profile"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto">
          <div className="border-b border-border bg-gradient-to-r from-brand-muted to-white p-6">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar initials="AS" size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-text-primary">Ananya Sharma</h2>
                  <Badge tone="success">Active</Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">Senior Product Designer · Product & Design</p>
                <p className="mt-1 text-xs text-text-muted">DHR-1042 · Bengaluru · Joined 14 February 2023</p>
              </div>
              <Button icon="dots" variant="secondary">
                Actions
              </Button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-white bg-white/80 p-3">
                <p className="text-xs text-text-muted">Reporting manager</p>
                <p className="mt-1 text-sm font-semibold">Meera Iyer</p>
              </div>
              <div className="rounded-md border border-white bg-white/80 p-3">
                <p className="text-xs text-text-muted">Work email</p>
                <p className="mt-1 truncate text-sm font-semibold">ananya@dhriti.com</p>
              </div>
              <div className="rounded-md border border-white bg-white/80 p-3">
                <p className="text-xs text-text-muted">Employment</p>
                <p className="mt-1 text-sm font-semibold">Full-time</p>
              </div>
            </div>
          </div>
          <div className="flex overflow-x-auto border-b border-border px-6">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`shrink-0 border-b-2 px-3 py-3 text-xs font-semibold ${tab === item ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}
              >
                {item}
              </button>
            ))}
          </div>
          {tab === "Overview" ? (
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  ["Leave balance", "18.5 days"],
                  ["Attendance", "96.2%"],
                  ["Goals", "4 active"],
                  ["Assets", "3 assigned"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-border p-3">
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className="mt-2 font-display text-lg font-bold text-text-primary">{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Card>
                  <CardTitle title="Job information" />
                  <dl className="space-y-3 p-5 text-sm">
                    {[
                      ["Designation", "Senior Product Designer"],
                      ["Department", "Product & Design"],
                      ["Business unit", "Dhriti OS"],
                      ["Location", "Bengaluru"],
                      ["Cost center", "PD-IND-02"],
                    ].map(([term, value]) => (
                      <div key={term} className="flex justify-between gap-4">
                        <dt className="text-text-muted">{term}</dt>
                        <dd className="text-right font-medium text-text-primary">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
                <Card>
                  <CardTitle title="Activity timeline" />
                  <div className="p-5">
                    {timeline.map((item, index) => (
                      <div key={item.title} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < timeline.length - 1 && (
                          <span className="absolute left-2 top-4 h-full w-px bg-border" />
                        )}
                        <span className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-brand-muted bg-brand" />
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                          <p className="text-xs text-text-muted">{item.detail}</p>
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                            {item.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <Card>
                <CardTitle
                  title="Assigned assets"
                  action={<button className="text-xs font-semibold text-brand">Manage</button>}
                />
                <div className="grid gap-3 p-5 sm:grid-cols-3">
                  {[
                    ["MacBook Pro 14", "DHR-MBP-1842"],
                    ["Dell 27” Monitor", "DHR-MON-0392"],
                    ["iPhone 15", "DHR-IPH-0248"],
                  ].map(([asset, id]) => (
                    <div key={id} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
                      <Icon name="laptop" className="text-brand" />
                      <div>
                        <p className="text-xs font-semibold">{asset}</p>
                        <p className="text-[10px] text-text-muted">{id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="p-6">
              <Card className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand">
                  <Icon
                    name={
                      tab === "Attendance"
                        ? "clock"
                        : tab === "Leave"
                          ? "calendar"
                          : tab === "Payroll"
                            ? "wallet"
                            : tab === "Performance"
                              ? "target"
                              : "file"
                    }
                    size={22}
                  />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{tab} history</h3>
                <p className="mt-1 max-w-sm text-sm text-text-muted">
                  Detailed {tab.toLowerCase()} records, trends, and related actions for Ananya appear here.
                </p>
                <Button variant="secondary" icon="download">
                  Export history
                </Button>
              </Card>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function EmployeeDirectoryWorkspace({
  employees,
  onAdd,
  onToast,
}: {
  employees: DirectoryEmployee[];
  onAdd: () => void;
  onToast: (message: string) => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <>
      <Card className="mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex -space-x-2">
            {employees.slice(0, 4).map((employee, index) => (
              <Avatar
                key={employee.id}
                initials={employee.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
                index={index}
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text-primary">Explore your organization</p>
            <p className="text-xs text-text-muted">
              View profiles, reporting lines, documents, assets, payroll, and employee history.
            </p>
          </div>
          <Button variant="secondary" onClick={() => onToast("Organization chart opened")}>
            Organization chart
          </Button>
          <Button onClick={() => setProfileOpen(true)}>View sample profile</Button>
        </div>
      </Card>
      <EmployeeDirectory employees={employees} onAdd={onAdd} onToast={onToast} />
      {profileOpen && <EmployeeProfileDrawer close={() => setProfileOpen(false)} onToast={onToast} />}
    </>
  );
}

function EmployeeImportFlow({ onToast }: { onToast: (message: string) => void }) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const rows = [
    ["Aarav Bhatia", "aarav@dhriti.com", "Engineering", "Staff Engineer", "Valid"],
    ["Simran Kaur", "simran@dhriti.com", "Product", "Product Manager", "Valid"],
    ["Vikram Nair", "vikram@", "Finance", "Data Analyst", "Invalid email"],
  ];
  return (
    <Card className="overflow-hidden">
      <CardTitle
        title="Import employees"
        subtitle="Upload, map, validate, and import employee records"
        action={
          <Button variant="secondary" icon="download" onClick={() => onToast("Employee import template downloaded")}>
            Download template
          </Button>
        }
      />
      <div className="flex gap-2 border-b border-border px-5 py-4">
        {["Upload", "Map columns", "Validate", "Result"].map((label, index) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= index + 1 ? "bg-brand text-white" : "bg-slate-100 text-text-muted"}`}
            >
              {index + 1}
            </span>
            <span
              className={`hidden text-xs font-semibold md:block ${step === index + 1 ? "text-brand" : "text-text-muted"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="min-h-80 p-6">
        {step === 1 && (
          <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-slate-50 text-center hover:border-brand">
            <Icon name="download" size={28} className="rotate-180 text-brand" />
            <p className="mt-3 text-sm font-semibold">{fileName || "Choose CSV or XLSX file"}</p>
            <p className="mt-1 text-xs text-text-muted">Maximum 5,000 employees · 10 MB</p>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
            />
          </label>
        )}
        {step === 2 && (
          <div>
            <p className="mb-4 text-sm text-text-secondary">Match uploaded columns to Dhriti employee fields.</p>
            <div className="space-y-3">
              {[
                ["Full Name", "Employee name"],
                ["Work Email", "Work email"],
                ["Team", "Department"],
                ["Job Title", "Designation"],
                ["Office", "Location"],
              ].map(([source, target]) => (
                <div key={source} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium">{source}</div>
                  <Icon name="arrow" className="text-text-muted" />
                  <select defaultValue={target} className="rounded-md border border-border px-3 py-2 text-sm">
                    <option>{target}</option>
                    <option>Do not import</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <div className="mb-4 flex gap-3">
              <Badge tone="success">2 valid</Badge>
              <Badge tone="danger">1 error</Badge>
              <Badge>3 total rows</Badge>
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-text-muted">
                  <tr>
                    {["Name", "Email", "Department", "Designation", "Validation"].map((item) => (
                      <th key={item} className="px-3 py-2.5">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, index) => (
                        <td key={cell} className="px-3 py-3">
                          {index === 4 ? <Badge tone={cell === "Valid" ? "success" : "danger"}>{cell}</Badge> : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-success">
              <Icon name="check" size={28} />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">Import completed</h3>
            <p className="mt-2 text-sm text-text-secondary">2 employees imported successfully. 1 row was skipped.</p>
            <Button variant="secondary" icon="download">
              Download error report
            </Button>
          </div>
        )}
      </div>
      <div className="flex justify-between border-t border-border bg-slate-50 px-6 py-4">
        <Button variant="secondary" disabled={step === 1} onClick={() => setStep((current) => current - 1)}>
          Back
        </Button>
        <Button
          disabled={step === 1 && !fileName}
          onClick={() => {
            if (step < 4) setStep((current) => current + 1);
            else onToast("Employee import saved");
          }}
        >
          {step === 3 ? "Import valid rows" : step === 4 ? "Done" : "Continue"}
        </Button>
      </div>
    </Card>
  );
}

function OrganizationChart() {
  const teams = [
    { lead: "Neha Mehta", role: "Head of People", initials: "NM", reports: ["Aditi Bose", "Kunal Shah", "Mira Das"] },
    {
      lead: "Rohan Kapoor",
      role: "Engineering Manager",
      initials: "RK",
      reports: ["Dev Patel", "Mohit Jain", "Tanya Roy"],
    },
    {
      lead: "Meera Iyer",
      role: "Director, Product",
      initials: "MI",
      reports: ["Ananya Sharma", "Simran Kaur", "Vikram Nair"],
    },
  ];
  return (
    <Card>
      <CardTitle
        title="Organization chart"
        subtitle="Reporting structure · 486 employees"
        action={
          <div className="flex gap-2">
            <Button variant="secondary">Collapse all</Button>
            <Button variant="secondary" icon="download">
              Export
            </Button>
          </div>
        }
      />
      <div className="overflow-x-auto p-6">
        <div className="mx-auto min-w-[760px]">
          <div className="mx-auto w-64 rounded-lg border-2 border-brand bg-brand-muted p-4 text-center">
            <Avatar initials="JS" index={0} size="lg" />
            <p className="mt-2 font-semibold">Jane Smith</p>
            <p className="text-xs text-text-muted">Chief Executive Officer</p>
          </div>
          <div className="mx-auto h-8 w-px bg-border" />
          <div className="grid grid-cols-3 gap-6 border-t border-border pt-6">
            {teams.map((team, index) => (
              <div key={team.lead} className="text-center">
                <div className="mx-auto rounded-lg border border-border bg-white p-4 shadow-sm">
                  <Avatar initials={team.initials} index={index + 1} />
                  <p className="mt-2 text-sm font-semibold">{team.lead}</p>
                  <p className="text-xs text-text-muted">{team.role}</p>
                  <Badge tone="brand">{team.reports.length} reports</Badge>
                </div>
                <div className="mx-auto h-5 w-px bg-border" />
                <div className="space-y-2">
                  {team.reports.map((person) => (
                    <div
                      key={person}
                      className="rounded-md border border-border bg-slate-50 px-3 py-2 text-xs font-medium"
                    >
                      {person}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function OffboardingWorkflow({ onToast }: { onToast: (message: string) => void }) {
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

export function HrmsEmployees({
  employees,
  onAdd,
  onToast,
}: {
  employees: DirectoryEmployee[];
  onAdd: () => void;
  onToast: (message: string) => void;
}) {
  const [tab, setTab] = useState("Directory");
  const tabs = [
    "Directory",
    "Import",
    "Organization chart",
    "Departments",
    "Designations",
    "Locations",
    "Employment types",
    "Offboarding",
  ];
  return (
    <>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold ${tab === item ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Directory" && <EmployeeDirectoryWorkspace employees={employees} onAdd={onAdd} onToast={onToast} />}
      {tab === "Import" && <EmployeeImportFlow onToast={onToast} />}
      {tab === "Organization chart" && <OrganizationChart />}
      {["Departments", "Designations", "Locations", "Employment types"].includes(tab) && (
        <EmployeeMasterData type={tab} onToast={onToast} />
      )}
      {tab === "Offboarding" && <OffboardingWorkflow onToast={onToast} />}
    </>
  );
}
