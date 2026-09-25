"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  ip: string;
  timestamp: string;
  status: "success" | "failure";
}

const entries: AuditEntry[] = [
  {
    id: "1",
    actor: "jordan@dhriti.io",
    action: "org.suspend",
    resource: "Stark Industries",
    ip: "10.0.0.1",
    timestamp: "2024-11-15 09:23:14",
    status: "success",
  },
  {
    id: "2",
    actor: "priya@dhriti.io",
    action: "user.invite",
    resource: "nadia@dhriti.io",
    ip: "10.0.0.2",
    timestamp: "2024-11-15 09:10:05",
    status: "success",
  },
  {
    id: "3",
    actor: "marcus@dhriti.io",
    action: "flag.toggle",
    resource: "ai_assistant",
    ip: "10.0.0.3",
    timestamp: "2024-11-15 08:55:30",
    status: "success",
  },
  {
    id: "4",
    actor: "sophie@dhriti.io",
    action: "org.view",
    resource: "Acme Corporation",
    ip: "10.0.0.4",
    timestamp: "2024-11-15 08:42:11",
    status: "success",
  },
  {
    id: "5",
    actor: "unknown",
    action: "auth.login",
    resource: "admin panel",
    ip: "203.0.113.78",
    timestamp: "2024-11-15 08:30:00",
    status: "failure",
  },
  {
    id: "6",
    actor: "jordan@dhriti.io",
    action: "platform.settings",
    resource: "email config",
    ip: "10.0.0.1",
    timestamp: "2024-11-15 07:58:42",
    status: "success",
  },
  {
    id: "7",
    actor: "ravi@dhriti.io",
    action: "user.role_change",
    resource: "aria@dhriti.io",
    ip: "10.0.0.9",
    timestamp: "2024-11-15 07:45:00",
    status: "success",
  },
  {
    id: "8",
    actor: "priya@dhriti.io",
    action: "org.delete",
    resource: "Veridian Dynamics",
    ip: "10.0.0.2",
    timestamp: "2024-11-15 07:12:55",
    status: "success",
  },
  {
    id: "9",
    actor: "unknown",
    action: "api.key_access",
    resource: "prod_key_xxxx",
    ip: "172.16.0.99",
    timestamp: "2024-11-14 23:11:08",
    status: "failure",
  },
  {
    id: "10",
    actor: "marcus@dhriti.io",
    action: "flag.create",
    resource: "guest_access",
    ip: "10.0.0.3",
    timestamp: "2024-11-14 22:05:33",
    status: "success",
  },
  {
    id: "11",
    actor: "jordan@dhriti.io",
    action: "org.create",
    resource: "Pied Piper",
    ip: "10.0.0.1",
    timestamp: "2024-11-14 18:30:00",
    status: "success",
  },
  {
    id: "12",
    actor: "sophie@dhriti.io",
    action: "user.remove",
    resource: "ex-staff@dhriti.io",
    ip: "10.0.0.4",
    timestamp: "2024-11-14 17:22:10",
    status: "success",
  },
];

export default function AuditLogs() {
  const { toasts, addToast, removeToast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failure">("all");

  const filtered = entries.filter((e) => {
    const matchSearch =
      e.actor.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.resource.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    addToast("Audit log exported as CSV", "success");
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Audit Logs</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Complete record of all administrative actions
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{
            padding: "9px 18px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: 13,
            color: "#475569",
            fontWeight: 500,
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by actor, action, or resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 9,
              paddingBottom: 9,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | "success" | "failure")}
          style={{
            padding: "9px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 13,
            cursor: "pointer",
            backgroundColor: "white",
          }}
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              {["Actor", "Action", "Resource", "IP Address", "Timestamp", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{entry.actor}</td>
                <td style={{ padding: "12px 16px" }}>
                  <code
                    style={{
                      fontSize: 12,
                      backgroundColor: "#f1f5f9",
                      padding: "2px 6px",
                      borderRadius: 4,
                      color: "#475569",
                    }}
                  >
                    {entry.action}
                  </code>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{entry.resource}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                  {entry.ip}
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                  {entry.timestamp}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 20,
                      backgroundColor: entry.status === "success" ? "#dcfce7" : "#fee2e2",
                      color: entry.status === "success" ? "#166534" : "#dc2626",
                      textTransform: "capitalize",
                    }}
                  >
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            Showing {filtered.length} of {entries.length} entries
          </span>
        </div>
      </div>
    </div>
  );
}
