"use client";

import { useState } from "react";

import { EmployeeMasterData } from "./components/employee-master-data";
import { TeamLeaveCalendar } from "./components/team-leave-calendar";
import { Avatar, Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";

function ReportBuilder({ onToast }: { onToast: (message: string) => void }) {
  const [chart, setChart] = useState("Bar chart");
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardTitle title="Report configuration" />
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Report type</span>
            <select className="w-full rounded-md border border-border px-3 py-2 text-sm">
              <option>Headcount analysis</option>
              <option>Attendance summary</option>
              <option>Leave utilization</option>
              <option>Payroll cost</option>
              <option>Attrition analysis</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Date range</span>
            <select className="w-full rounded-md border border-border px-3 py-2 text-sm">
              <option>This year</option>
              <option>Last quarter</option>
              <option>Custom range</option>
            </select>
          </label>
          <div>
            <p className="mb-2 text-xs font-semibold">Group by</p>
            <div className="flex flex-wrap gap-2">
              {["Department", "Location", "Employment type"].map((item) => (
                <Badge key={item} tone="brand">
                  {item} ×
                </Badge>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold">Chart type</span>
            <select
              value={chart}
              onChange={(event) => setChart(event.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option>Bar chart</option>
              <option>Line chart</option>
              <option>Pie chart</option>
              <option>Table</option>
            </select>
          </label>
          <Button onClick={() => onToast("Report saved to your library")}>Save report</Button>
        </div>
      </Card>
      <Card>
        <CardTitle
          title="Headcount by department"
          subtitle={`Preview · ${chart}`}
          action={
            <div className="flex gap-2">
              <Button variant="secondary">Schedule</Button>
              <Button variant="secondary" icon="download">
                Export
              </Button>
            </div>
          }
        />
        <div className="p-6">
          <div className="flex h-72 items-end gap-5 border-b border-l border-border px-6 pt-6">
            {[
              ["Engineering", 92],
              ["Product", 66],
              ["Sales", 74],
              ["People", 42],
              ["Finance", 34],
              ["Support", 56],
            ].map(([label, value]) => (
              <div key={label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full rounded-t bg-brand" style={{ height: `${value}%` }} />
                <span className="text-[10px] text-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ApplyLeaveDrawer({ close, onSubmit }: { close: () => void; onSubmit: () => void }) {
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [attempted, setAttempted] = useState(false);
  const submit = () => {
    setAttempted(true);
    if (leaveType && reason) onSubmit();
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Apply for leave"
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">Apply for leave</h2>
            <p className="mt-1 text-xs text-text-muted">Your manager will receive this request</p>
          </div>
          <button onClick={close} className="rounded-md p-2 text-text-muted hover:bg-slate-100">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Leave type <span className="text-error">*</span>
            </span>
            <select
              value={leaveType}
              onChange={(event) => setLeaveType(event.target.value)}
              className={`w-full rounded-md border px-3 py-2.5 text-sm ${attempted && !leaveType ? "border-error" : "border-border"}`}
            >
              <option value="">Select leave type</option>
              <option>Privilege leave · 10.5 days</option>
              <option>Sick leave · 4 days</option>
              <option>Casual leave · 3 days</option>
              <option>Wellness leave · 1 day</option>
            </select>
            {attempted && !leaveType && <p className="mt-1 text-xs text-error">Select a leave type.</p>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="mb-1.5 block text-sm font-semibold">From date</span>
              <input
                type="date"
                defaultValue="2026-10-14"
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold">To date</span>
              <input
                type="date"
                defaultValue="2026-10-16"
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
              />
            </label>
          </div>
          <label className="flex items-center gap-3 rounded-md border border-border p-3">
            <input type="checkbox" />
            <span>
              <span className="block text-sm font-semibold">Half day</span>
              <span className="block text-xs text-text-muted">Apply for the first or second half only</span>
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Reason <span className="text-error">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Tell your approver why you need time off"
              className={`w-full resize-none rounded-md border px-3 py-2.5 text-sm outline-none focus:border-brand ${attempted && !reason ? "border-error" : "border-border"}`}
            />
            {attempted && !reason && <p className="mt-1 text-xs text-error">Add a reason for your request.</p>}
          </label>
          <div>
            <p className="mb-1.5 text-sm font-semibold">
              Attachment <span className="font-normal text-text-muted">(optional)</span>
            </p>
            <button className="flex w-full flex-col items-center rounded-md border border-dashed border-border p-6 text-center hover:border-brand">
              <Icon name="file" className="text-brand" />
              <span className="mt-2 text-sm font-semibold">Upload supporting document</span>
              <span className="mt-1 text-xs text-text-muted">PDF, JPG or PNG · Maximum 10 MB</span>
            </button>
          </div>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Approval chain</p>
            <div className="mt-3 flex items-center gap-2">
              <Avatar initials="MI" index={1} size="sm" />
              <span className="text-sm font-semibold">Meera Iyer</span>
              <Icon name="arrow" size={14} className="text-text-muted" />
              <Avatar initials="NM" index={2} size="sm" />
              <span className="text-sm font-semibold">People Ops</span>
            </div>
          </Card>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-slate-50 px-6 py-4">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit}>Submit request</Button>
        </div>
      </aside>
    </div>
  );
}

function LeaveDashboard({ onToast }: { onToast: (message: string) => void }) {
  const [applyOpen, setApplyOpen] = useState(false);
  const balances = [
    { label: "Privilege leave", value: "10.5", used: "7.5 used", color: "bg-brand", width: "w-3/5" },
    { label: "Sick leave", value: "4.0", used: "8 used", color: "bg-blue-500", width: "w-2/3" },
    { label: "Casual leave", value: "3.0", used: "3 used", color: "bg-violet-500", width: "w-1/2" },
    { label: "Wellness leave", value: "1.0", used: "1 used", color: "bg-amber-500", width: "w-1/2" },
  ];
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {balances.map((balance) => (
          <Card key={balance.label} className="p-5">
            <div className={`h-1.5 w-10 rounded-full ${balance.color}`} />
            <p className="mt-4 text-sm font-medium text-text-secondary">{balance.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-2xl font-bold">{balance.value}</p>
              <span className="text-xs text-text-muted">{balance.used}</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100">
              <div className={`h-1.5 rounded-full ${balance.color} ${balance.width}`} />
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle
            title="Team leave calendar"
            subtitle="October 2026 · Product & Design"
            action={
              <select className="rounded-md border border-border px-3 py-1.5 text-xs">
                <option>Month</option>
                <option>Week</option>
              </select>
            }
          />
          <div className="p-5">
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md bg-border border border-border">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                <div key={day} className="bg-slate-50 p-2 text-center text-[10px] font-bold text-text-muted">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, index) => {
                const date = index - 1;
                const hasLeave = [8, 13, 14, 15, 18, 22, 28].includes(date);
                return (
                  <div
                    key={index}
                    className={`min-h-20 bg-white p-2 ${date < 1 || date > 31 ? "text-slate-300" : "text-text-primary"}`}
                  >
                    <span className="text-xs font-semibold">{date < 1 ? 29 + date : date > 31 ? date - 31 : date}</span>
                    {hasLeave && (
                      <div className="mt-2 flex -space-x-1">
                        <Avatar initials={date % 2 ? "AS" : "PV"} index={date} size="sm" />
                        {date === 14 && <Avatar initials="NM" index={2} size="sm" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardTitle title="Upcoming holidays" />
            <div className="divide-y divide-border">
              {[
                ["12", "Dussehra", "Friday"],
                ["31", "Diwali", "Thursday"],
                ["01", "Govardhan Puja", "Friday"],
              ].map(([date, name, day], index) => (
                <div key={name} className="flex items-center gap-3 p-4">
                  <div
                    className={`rounded-md px-3 py-2 text-center ${index === 0 ? "bg-brand-muted text-brand" : "bg-slate-100 text-text-secondary"}`}
                  >
                    <p className="text-lg font-bold">{date}</p>
                    <p className="text-[9px] font-bold">OCT</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-text-muted">{day} · Company holiday</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardTitle title="Request status" />
            <div className="space-y-3 p-5">
              {[
                ["Wellness leave", "Oct 18", "Approved"],
                ["Privilege leave", "Oct 14–16", "Pending"],
              ].map(([type, date, status]) => (
                <div key={type} className="flex items-center justify-between rounded-md bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-semibold">{type}</p>
                    <p className="text-xs text-text-muted">{date}</p>
                  </div>
                  <Badge tone={status === "Approved" ? "success" : "warning"}>{status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {applyOpen && (
        <ApplyLeaveDrawer
          close={() => setApplyOpen(false)}
          onSubmit={() => {
            setApplyOpen(false);
            onToast("Leave request submitted for approval");
          }}
        />
      )}
    </>
  );
}

export function HrmsLeave({ onToast }: { onToast: (message: string) => void }) {
  const [tab, setTab] = useState("Dashboard");
  const [applyOpen, setApplyOpen] = useState(false);
  const [requests, setRequests] = useState([
    { name: "Priya Verma", type: "Annual leave", dates: "Oct 14–16", days: "3 days", status: "Pending" },
    { name: "Ananya Sharma", type: "Wellness leave", dates: "Oct 18", days: "1 day", status: "Approved" },
    { name: "Dev Patel", type: "Sick leave", dates: "Oct 9–10", days: "2 days", status: "Pending" },
    { name: "Mohit Jain", type: "Casual leave", dates: "Oct 11", days: "Half day", status: "Needs info" },
  ]);
  const tabs = ["Dashboard", "Requests", "Team calendar", "Policies", "Holidays", "Balance report"];
  const updateRequest = (name: string, status: string) => {
    setRequests((current) => current.map((request) => (request.name === name ? { ...request, status } : request)));
    onToast(`${name} · ${status}`);
  };
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold ${tab === item ? "border-brand text-brand" : "border-transparent text-text-muted"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <Button icon="plus" onClick={() => setApplyOpen(true)}>
          Apply leave
        </Button>
      </div>
      {tab === "Dashboard" && <LeaveDashboard onToast={onToast} />}
      {tab === "Requests" && (
        <Card className="overflow-hidden">
          <CardTitle
            title="Leave requests"
            subtitle="Review, approve, reject, or request more information"
            action={
              <Button variant="secondary" icon="download">
                Export
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Employee", "Leave type", "Dates", "Duration", "Status", "Actions"].map((item) => (
                    <th key={item} className="px-5 py-3 text-xs font-semibold uppercase text-text-muted">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((request, index) => (
                  <tr key={request.name} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={request.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                          index={index}
                          size="sm"
                        />
                        <span className="text-sm font-semibold">{request.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">{request.type}</td>
                    <td className="px-5 py-4 text-sm text-text-secondary">{request.dates}</td>
                    <td className="px-5 py-4 text-sm">{request.days}</td>
                    <td className="px-5 py-4">
                      <Badge
                        tone={
                          request.status === "Approved"
                            ? "success"
                            : request.status === "Rejected"
                              ? "danger"
                              : request.status === "Needs info"
                                ? "info"
                                : "warning"
                        }
                      >
                        {request.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateRequest(request.name, "Approved")}
                          className="rounded-md bg-brand-muted p-2 text-brand"
                          title="Approve"
                        >
                          <Icon name="check" size={15} />
                        </button>
                        <button
                          onClick={() => updateRequest(request.name, "Rejected")}
                          className="rounded-md bg-red-50 p-2 text-error"
                          title="Reject"
                        >
                          <Icon name="close" size={15} />
                        </button>
                        <button
                          onClick={() => updateRequest(request.name, "Needs info")}
                          className="rounded-md bg-blue-50 px-2 text-xs font-semibold text-info"
                        >
                          More info
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {tab === "Team calendar" && <TeamLeaveCalendar />}
      {tab === "Policies" && (
        <Card>
          <CardTitle
            title="Leave policy configuration"
            subtitle="Accrual, carry forward, encashment, and eligibility rules"
            action={<Button>Save policy</Button>}
          />
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-sm font-semibold">Leave type</span>
              <select className="w-full rounded-md border border-border px-3 py-2.5 text-sm">
                <option>Earned leave</option>
                <option>Sick leave</option>
                <option>Casual leave</option>
                <option>Unpaid leave</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold">Accrual frequency</span>
              <select className="w-full rounded-md border border-border px-3 py-2.5 text-sm">
                <option>Monthly</option>
                <option>Yearly</option>
                <option>Per pay period</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold">Annual entitlement</span>
              <input
                type="number"
                defaultValue={18}
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-semibold">Maximum carry forward</span>
              <input
                type="number"
                defaultValue={10}
                className="w-full rounded-md border border-border px-3 py-2.5 text-sm"
              />
            </label>
            {[
              ["Allow encashment", true],
              ["Allow negative balance", false],
              ["Available during probation", false],
              ["Require attachment after 2 days", true],
            ].map(([label, checked]) => (
              <label key={String(label)} className="flex items-center gap-3 rounded-md border border-border p-4">
                <input type="checkbox" defaultChecked={Boolean(checked)} />
                <span className="text-sm font-semibold">{label}</span>
              </label>
            ))}
          </div>
        </Card>
      )}
      {tab === "Holidays" && (
        <EmployeeMasterData type="Locations" onToast={(message) => onToast(message.replace("location", "holiday"))} />
      )}
      {tab === "Balance report" && <ReportBuilder onToast={onToast} />}
      {applyOpen && (
        <ApplyLeaveDrawer
          close={() => setApplyOpen(false)}
          onSubmit={() => {
            setApplyOpen(false);
            onToast("Leave request submitted for approval");
          }}
        />
      )}
    </>
  );
}
