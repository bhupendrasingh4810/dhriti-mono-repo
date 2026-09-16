
"use client";

import { useState, useRef } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

type Plan = "Free" | "Pro" | "Business" | "Enterprise";
type Status = "Active" | "Trial" | "Suspended" | "Churned";

interface Org {
  name: string;
  plan: Plan;
  seats: string;
  status: Status;
  created: string;
  mrr: string;
}

const planColors: Record<Plan, { bg: string; color: string }> = {
  Free: { bg: "#f1f5f9", color: "#475569" },
  Pro: { bg: "#dbeafe", color: "#1d4ed8" },
  Business: { bg: "#ede9fe", color: "#6d28d9" },
  Enterprise: { bg: "#e6f4f2", color: "#036c5f" },
};

const statusColors: Record<Status, { bg: string; color: string }> = {
  Active: { bg: "#dcfce7", color: "#166534" },
  Trial: { bg: "#dbeafe", color: "#1d4ed8" },
  Suspended: { bg: "#fef9c3", color: "#92400e" },
  Churned: { bg: "#fee2e2", color: "#991b1b" },
};

const initialOrgs: Org[] = [
  { name: "Acme Corporation", plan: "Enterprise", seats: "420/500", status: "Active", created: "Jan 15, 2024", mrr: "$8,400/mo" },
  { name: "TechFlow Inc", plan: "Business", seats: "85/100", status: "Active", created: "Mar 3, 2024", mrr: "$1,700/mo" },
  { name: "Globex Corp", plan: "Pro", seats: "32/50", status: "Active", created: "Apr 22, 2024", mrr: "$320/mo" },
  { name: "Initech", plan: "Free", seats: "8/10", status: "Trial", created: "Jun 1, 2024", mrr: "$0/mo" },
  { name: "Umbrella Corp", plan: "Enterprise", seats: "650/750", status: "Active", created: "Nov 8, 2023", mrr: "$13,000/mo" },
  { name: "Stark Industries", plan: "Business", seats: "120/100", status: "Suspended", created: "Feb 14, 2024", mrr: "$2,400/mo" },
  { name: "Wonka Co", plan: "Pro", seats: "28/50", status: "Active", created: "Jul 19, 2024", mrr: "$280/mo" },
  { name: "Dunder Mifflin", plan: "Free", seats: "15/20", status: "Trial", created: "Aug 5, 2024", mrr: "$0/mo" },
  { name: "Cyberdyne Systems", plan: "Enterprise", seats: "890/1000", status: "Active", created: "Sep 12, 2023", mrr: "$17,800/mo" },
  { name: "Pied Piper", plan: "Business", seats: "45/100", status: "Active", created: "May 30, 2024", mrr: "$900/mo" },
  { name: "Hooli", plan: "Enterprise", seats: "1200/1500", status: "Active", created: "Jun 2, 2023", mrr: "$24,000/mo" },
  { name: "Veridian Dynamics", plan: "Pro", seats: "38/50", status: "Churned", created: "Oct 11, 2024", mrr: "$0/mo" },
];

interface AddOrgForm {
  name: string;
  plan: Plan;
  seats: string;
  email: string;
}

interface AddOrgErrors {
  name?: string;
  email?: string;
  seats?: string;
}

type ModalType = "none" | "add" | "suspend" | "delete" | "detail";

interface DetailTab {
  id: string;
  label: string;
}

const detailTabs: DetailTab[] = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "billing", label: "Billing" },
  { id: "audit", label: "Audit" },
];

export default function OrgsPanel() {
  const { toasts, addToast, removeToast } = useToast();
  const [orgs, setOrgs] = useState<Org[]>(initialOrgs);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<Plan | "All">("All");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalType>("none");
  const [targetIdx, setTargetIdx] = useState<number | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [detailTab, setDetailTab] = useState("overview");
  const [addForm, setAddForm] = useState<AddOrgForm>({ name: "", plan: "Free", seats: "", email: "" });
  const [addErrors, setAddErrors] = useState<AddOrgErrors>({});

  const filtered = orgs.filter((o) => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === "All" || o.plan === filterPlan;
    const matchStatus = filterStatus === "All" || o.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

  const perPage = 10;
  const pageCount = Math.ceil(filtered.length / perPage);
  const pageOrgs = filtered.slice(page * perPage, (page + 1) * perPage);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pageOrgs.length) setSelected(new Set());
    else setSelected(new Set(pageOrgs.map((_, i) => page * perPage + i)));
  };

  const validateAdd = (): boolean => {
    const errs: AddOrgErrors = {};
    if (!addForm.name.trim()) errs.name = "Organization name is required";
    if (!addForm.email.trim()) errs.email = "Admin email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(addForm.email)) errs.email = "Invalid email address";
    if (!addForm.seats.trim()) errs.seats = "Seat count is required";
    else if (isNaN(Number(addForm.seats)) || Number(addForm.seats) < 1) errs.seats = "Must be a positive number";
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddOrg = () => {
    if (!validateAdd()) return;
    const newOrg: Org = {
      name: addForm.name,
      plan: addForm.plan,
      seats: `0/${addForm.seats}`,
      status: "Trial",
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      mrr: "$0/mo",
    };
    setOrgs((prev) => [newOrg, ...prev]);
    setModal("none");
    setAddForm({ name: "", plan: "Free", seats: "", email: "" });
    setAddErrors({});
    addToast(`Organization "${newOrg.name}" created`, "success");
  };

  const handleSuspend = () => {
    if (targetIdx === null) return;
    const org = orgs[targetIdx];
    const newStatus: Status = org.status === "Suspended" ? "Active" : "Suspended";
    setOrgs((prev) => prev.map((o, i) => i === targetIdx ? { ...o, status: newStatus } : o));
    setModal("none");
    setSuspendReason("");
    addToast(`${org.name} ${newStatus === "Suspended" ? "suspended" : "reactivated"}`, newStatus === "Suspended" ? "warning" : "success");
  };

  const handleDelete = () => {
    if (targetIdx === null || deleteConfirm !== "DELETE") return;
    const name = orgs[targetIdx].name;
    setOrgs((prev) => prev.filter((_, i) => i !== targetIdx));
    setModal("none");
    setDeleteConfirm("");
    addToast(`Organization "${name}" deleted`, "error");
  };

  const openSuspend = (i: number) => { setTargetIdx(i); setModal("suspend"); setOpenMenu(null); };
  const openDelete = (i: number) => { setTargetIdx(i); setModal("delete"); setOpenMenu(null); };
  const openDetail = (i: number) => { setTargetIdx(i); setModal("detail"); setDetailTab("overview"); setOpenMenu(null); };

  const closeModal = () => {
    setModal("none");
    setTargetIdx(null);
    setDeleteConfirm("");
    setSuspendReason("");
  };

  const targetOrg = targetIdx !== null ? orgs[targetIdx] : null;

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Organizations</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{orgs.length} total organizations</p>
        </div>
        <button
          onClick={() => setModal("add")}
          style={{
            padding: "9px 18px", borderRadius: 8, border: "none",
            backgroundColor: "#036c5f", color: "white", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
          }}
        >+ Add Organization</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => { setFilterPlan(e.target.value as Plan | "All"); setPage(0); }}
          style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", backgroundColor: "white" }}
        >
          <option value="All">All Plans</option>
          {(["Free", "Pro", "Business", "Enterprise"] as Plan[]).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as Status | "All"); setPage(0); }}
          style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", backgroundColor: "white" }}
        >
          <option value="All">All Status</option>
          {(["Active", "Trial", "Suspended", "Churned"] as Status[]).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={{ padding: "12px 16px", textAlign: "left" }}>
                <input
                  type="checkbox"
                  checked={selected.size === pageOrgs.length && pageOrgs.length > 0}
                  onChange={toggleAll}
                  style={{ cursor: "pointer" }}
                />
              </th>
              {["Organization", "Plan", "Seats", "Status", "Created", "MRR", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px", textAlign: "left", fontSize: 11,
                    fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}
                >{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageOrgs.map((org, ri) => {
              const globalIdx = page * perPage + ri;
              const pc = planColors[org.plan];
              const sc = statusColors[org.status];
              const initials = org.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <tr key={globalIdx} style={{ borderTop: "1px solid #f1f5f9", backgroundColor: selected.has(globalIdx) ? "#f0fdf4" : "white" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <input type="checkbox" checked={selected.has(globalIdx)} onChange={() => toggleSelect(globalIdx)} style={{ cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: 8, backgroundColor: "#e6f4f2",
                          color: "#036c5f", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}
                      >{initials}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{org.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, backgroundColor: pc.bg, color: pc.color }}>
                      {org.plan}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{org.seats}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, backgroundColor: sc.bg, color: sc.color }}>
                      {org.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{org.created}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{org.mrr}</td>
                  <td style={{ padding: "12px 16px", position: "relative" }}>
                    <button
                      onClick={() => setOpenMenu(openMenu === globalIdx ? null : globalIdx)}
                      style={{
                        padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
                        backgroundColor: "white", cursor: "pointer", fontSize: 13, color: "#475569",
                      }}
                    >•••</button>
                    {openMenu === globalIdx && (
                      <div
                        style={{
                          position: "absolute", right: 16, top: "100%", zIndex: 10,
                          backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: 8,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 160, overflow: "hidden",
                        }}
                      >
                        {[
                          { label: "View Details", action: () => openDetail(globalIdx), color: "#0f172a" },
                          { label: org.status === "Suspended" ? "Reactivate" : "Suspend", action: () => openSuspend(globalIdx), color: "#d97706" },
                          { label: "Delete", action: () => openDelete(globalIdx), color: "#dc2626" },
                        ].map((item) => (
                          <button
                            key={item.label}
                            onClick={item.action}
                            style={{
                              display: "block", width: "100%", padding: "10px 14px",
                              border: "none", backgroundColor: "white", cursor: "pointer",
                              textAlign: "left", fontSize: 13, color: item.color,
                              borderBottom: item.label !== "Delete" ? "1px solid #f1f5f9" : "none",
                            }}
                          >{item.label}</button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                backgroundColor: "white", cursor: page === 0 ? "not-allowed" : "pointer",
                fontSize: 13, color: page === 0 ? "#cbd5e1" : "#475569",
              }}
            >← Prev</button>
            {Array.from({ length: pageCount }).map((_, pi) => (
              <button
                key={pi}
                onClick={() => setPage(pi)}
                style={{
                  padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
                  backgroundColor: page === pi ? "#036c5f" : "white",
                  color: page === pi ? "white" : "#475569",
                  cursor: "pointer", fontSize: 13, fontWeight: page === pi ? 600 : 400,
                }}
              >{pi + 1}</button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                backgroundColor: "white", cursor: page === pageCount - 1 ? "not-allowed" : "pointer",
                fontSize: 13, color: page === pageCount - 1 ? "#cbd5e1" : "#475569",
              }}
            >Next →</button>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {openMenu !== null && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 5 }}
          onClick={() => setOpenMenu(null)}
        />
      )}

      {/* ADD ORG MODAL */}
      {modal === "add" && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={closeModal}
        >
          <div
            style={{ backgroundColor: "white", borderRadius: 16, padding: 28, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Add Organization</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Organization Name <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Acme Corporation"
                style={{
                  width: "100%", padding: "9px 12px", border: `1px solid ${addErrors.name ? "#dc2626" : "#e2e8f0"}`,
                  borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
              {addErrors.name && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{addErrors.name}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Admin Email <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="admin@company.com"
                style={{
                  width: "100%", padding: "9px 12px", border: `1px solid ${addErrors.email ? "#dc2626" : "#e2e8f0"}`,
                  borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
              {addErrors.email && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{addErrors.email}</p>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Plan <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  value={addForm.plan}
                  onChange={(e) => setAddForm((f) => ({ ...f, plan: e.target.value as Plan }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", backgroundColor: "white" }}
                >
                  {(["Free", "Pro", "Business", "Enterprise"] as Plan[]).map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Seats <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="number"
                  value={addForm.seats}
                  onChange={(e) => setAddForm((f) => ({ ...f, seats: e.target.value }))}
                  placeholder="100"
                  style={{
                    width: "100%", padding: "9px 12px", border: `1px solid ${addErrors.seats ? "#dc2626" : "#e2e8f0"}`,
                    borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
                  }}
                />
                {addErrors.seats && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{addErrors.seats}</p>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 500 }}
              >Cancel</button>
              <button
                onClick={handleAddOrg}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: "#036c5f", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >Create Organization</button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {modal === "suspend" && targetOrg && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={closeModal}
        >
          <div
            style={{ backgroundColor: "white", borderRadius: 16, padding: 28, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              {targetOrg.status === "Suspended" ? "Reactivate" : "Suspend"} Organization
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
              {targetOrg.status === "Suspended"
                ? `Reactivate "${targetOrg.name}" to restore access.`
                : `Suspend "${targetOrg.name}" to block all user access.`}
            </p>
            {targetOrg.status !== "Suspended" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Reason (optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the reason for suspension..."
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 500 }}
              >Cancel</button>
              <button
                onClick={handleSuspend}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "white",
                  backgroundColor: targetOrg.status === "Suspended" ? "#036c5f" : "#d97706",
                }}
              >{targetOrg.status === "Suspended" ? "Reactivate" : "Suspend"}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {modal === "delete" && targetOrg && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            style={{ backgroundColor: "white", borderRadius: 16, padding: 28, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Delete Organization</h2>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
              This will permanently delete <strong>{targetOrg.name}</strong> and all associated data. This action cannot be undone.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: "100%", padding: "9px 12px", border: `1px solid ${deleteConfirm === "DELETE" ? "#dc2626" : "#e2e8f0"}`,
                  borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 500 }}
              >Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== "DELETE"}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "none",
                  backgroundColor: deleteConfirm === "DELETE" ? "#dc2626" : "#fca5a5",
                  color: "white", cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 600,
                }}
              >Delete Organization</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {modal === "detail" && targetOrg && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={closeModal}
        >
          <div
            style={{ backgroundColor: "white", borderRadius: 16, width: "90%", height: "90%", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 10, backgroundColor: "#e6f4f2",
                    color: "#036c5f", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700,
                  }}
                >{targetOrg.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{targetOrg.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{targetOrg.plan} Plan · {targetOrg.seats} seats</div>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
              {detailTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  style={{
                    padding: "12px 16px", border: "none", backgroundColor: "transparent", cursor: "pointer",
                    fontSize: 13, fontWeight: detailTab === tab.id ? 700 : 400,
                    color: detailTab === tab.id ? "#036c5f" : "#64748b",
                    borderBottom: detailTab === tab.id ? "2px solid #036c5f" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >{tab.label}</button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {detailTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { label: "Status", value: targetOrg.status },
                    { label: "Plan", value: targetOrg.plan },
                    { label: "Seats", value: targetOrg.seats },
                    { label: "MRR", value: targetOrg.mrr },
                    { label: "Created", value: targetOrg.created },
                    { label: "Org ID", value: "org_" + targetOrg.name.replace(/\s/g, "").toLowerCase().slice(0, 8) },
                  ].map((item) => (
                    <div key={item.label} style={{ padding: 16, backgroundColor: "#f8fafc", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {detailTab === "members" && (
                <div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>Organization member list</p>
                  {["Alice Johnson (Owner)", "Bob Smith (Admin)", "Carol White (Member)", "David Brown (Member)"].map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#e6f4f2", color: "#036c5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                        {m[0]}
                      </div>
                      <span style={{ fontSize: 13, color: "#0f172a" }}>{m}</span>
                    </div>
                  ))}
                </div>
              )}
              {detailTab === "billing" && (
                <div>
                  <div style={{ padding: 16, backgroundColor: "#f0fdf4", borderRadius: 10, marginBottom: 16, border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Current Plan: {targetOrg.plan}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{targetOrg.mrr}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Billing history, invoices, and payment method management would appear here.</div>
                </div>
              )}
              {detailTab === "audit" && (
                <div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>Recent audit events</p>
                  {[
                    { action: "User invited", actor: "admin@org.com", time: "2 hours ago" },
                    { action: "Plan upgraded", actor: "billing@org.com", time: "1 day ago" },
                    { action: "SSO configured", actor: "admin@org.com", time: "3 days ago" },
                    { action: "API key created", actor: "dev@org.com", time: "1 week ago" },
                  ].map((ev, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{ev.action}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{ev.actor}</div>
                      </div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{ev.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
