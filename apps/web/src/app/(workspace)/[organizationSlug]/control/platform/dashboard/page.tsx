"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  sparkline: number[];
}

interface OrgRow {
  name: string;
  plan: "Free" | "Pro" | "Business" | "Enterprise";
  seats: number;
  status: "Active" | "Trial" | "Suspended";
}

interface Alert {
  severity: "critical" | "warning" | "info";
  message: string;
  time: string;
}

interface UsageBar {
  name: string;
  pct: number;
}

const planColors: Record<OrgRow["plan"], { bg: string; color: string }> = {
  Free: { bg: "#f1f5f9", color: "#475569" },
  Pro: { bg: "#dbeafe", color: "#1d4ed8" },
  Business: { bg: "#ede9fe", color: "#6d28d9" },
  Enterprise: { bg: "#e6f4f2", color: "#036c5f" },
};

const statusColors: Record<OrgRow["status"], { bg: string; color: string }> = {
  Active: { bg: "#dcfce7", color: "#166534" },
  Trial: { bg: "#dbeafe", color: "#1d4ed8" },
  Suspended: { bg: "#fef9c3", color: "#92400e" },
};

const alertColors: Record<Alert["severity"], { bg: string; color: string; label: string }> = {
  critical: { bg: "#fee2e2", color: "#dc2626", label: "Critical" },
  warning: { bg: "#fef9c3", color: "#d97706", label: "Warning" },
  info: { bg: "#dbeafe", color: "#2563eb", label: "Info" },
};

const orgs: OrgRow[] = [
  { name: "Acme Corp", plan: "Enterprise", seats: 420, status: "Active" },
  { name: "TechFlow", plan: "Business", seats: 85, status: "Active" },
  { name: "Globex", plan: "Pro", seats: 32, status: "Active" },
  { name: "Initech", plan: "Free", seats: 8, status: "Trial" },
  { name: "Umbrella Corp", plan: "Enterprise", seats: 650, status: "Active" },
  { name: "Stark Industries", plan: "Business", seats: 120, status: "Suspended" },
  { name: "Wonka Co", plan: "Pro", seats: 28, status: "Active" },
  { name: "Dunder Mifflin", plan: "Free", seats: 15, status: "Trial" },
];

const alerts: Alert[] = [
  { severity: "critical", message: "API Gateway latency spike (95th percentile: 847ms)", time: "2m ago" },
  { severity: "warning", message: "Redis cache hit rate below 80%", time: "15m ago" },
  { severity: "info", message: "Scheduled maintenance window in 48h", time: "1h ago" },
  { severity: "warning", message: "3 orgs approaching seat limit", time: "3h ago" },
  { severity: "info", message: "New version deployed successfully", time: "6h ago" },
];

const usageBars: UsageBar[] = [
  { name: "Hooli", pct: 80 },
  { name: "Cyberdyne", pct: 59 },
  { name: "Acme Corp", pct: 56 },
  { name: "Umbrella Corp", pct: 52 },
  { name: "Stark Industries", pct: 50 },
];

const stats: StatCard[] = [
  {
    label: "Total Orgs",
    value: "847",
    change: "+12%",
    positive: true,
    sparkline: [40, 55, 45, 60, 50, 70, 65],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2">
        <path d="M3 21h18M9 21V7l6-4v18M9 11h6M9 15h6M9 19h6" />
      </svg>
    ),
  },
  {
    label: "Active Users",
    value: "124,392",
    change: "+8.4%",
    positive: true,
    sparkline: [55, 60, 58, 72, 68, 80, 75],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "MRR",
    value: "$284,750",
    change: "+5.2%",
    positive: true,
    sparkline: [50, 45, 60, 55, 65, 70, 80],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Uptime",
    value: "99.97%",
    change: "-0.01%",
    positive: false,
    sparkline: [90, 95, 88, 100, 95, 98, 97],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export default function PlatformDashboard() {
  const { toasts, addToast, removeToast } = useToast();
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<number>>(new Set());

  const handleResolve = (i: number) => {
    setResolvedAlerts((prev) => new Set([...prev, i]));
    addToast("Alert resolved successfully", "success");
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Platform Overview</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Real-time metrics across your entire platform</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: "white", borderRadius: 12, padding: 20,
              border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>{s.value}</div>
              </div>
              <div
                style={{
                  width: 42, height: 42, borderRadius: 10,
                  backgroundColor: "#e6f4f2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {s.icon}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: s.positive ? "#059669" : "#dc2626",
                  display: "flex", alignItems: "center", gap: 2,
                }}
              >
                {s.positive ? "▲" : "▼"} {s.change}
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>vs last month</span>
            </div>
            {/* Sparkline */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 30 }}>
              {s.sparkline.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, borderRadius: 3,
                    backgroundColor: "#036c5f",
                    height: `${h}%`,
                    opacity: 0.4 + (i / s.sparkline.length) * 0.6,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, marginBottom: 24 }}>
        {/* Recent Orgs */}
        <div
          style={{
            backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Recent Organizations</h2>
            <span style={{ fontSize: 12, color: "#036c5f", cursor: "pointer", fontWeight: 600 }}>View all →</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {["Organization", "Plan", "Seats", "Status", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left", padding: "10px 16px", fontSize: 11,
                      fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em",
                    }}
                  >{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map((org, i) => {
                const pc = planColors[org.plan];
                const sc = statusColors[org.status];
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            backgroundColor: "#e6f4f2", color: "#036c5f",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}
                        >{org.name.slice(0, 2).toUpperCase()}</div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{org.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                          backgroundColor: pc.bg, color: pc.color,
                        }}
                      >{org.plan}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{org.seats}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
                          backgroundColor: sc.bg, color: sc.color,
                        }}
                      >{org.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => addToast(`Viewing ${org.name}`, "info")}
                        style={{
                          padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0",
                          backgroundColor: "white", cursor: "pointer", fontSize: 12, color: "#475569",
                          fontWeight: 500,
                        }}
                      >View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* System Alerts */}
        <div
          style={{
            backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>System Alerts</h2>
            <span
              style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 20,
                backgroundColor: "#fee2e2", color: "#dc2626", fontWeight: 600,
              }}
            >2 Critical</span>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {alerts.map((a, i) => {
              if (resolvedAlerts.has(i)) return null;
              const ac = alertColors[a.severity];
              return (
                <div
                  key={i}
                  style={{
                    padding: 12, borderRadius: 8,
                    backgroundColor: ac.bg, border: `1px solid ${ac.color}20`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          backgroundColor: ac.color, color: "white", marginRight: 6,
                        }}
                      >{ac.label}</span>
                      <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{a.message}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{a.time}</span>
                    <button
                      onClick={() => handleResolve(i)}
                      style={{
                        padding: "3px 10px", borderRadius: 5, border: `1px solid ${ac.color}40`,
                        backgroundColor: "white", cursor: "pointer", fontSize: 11, color: ac.color, fontWeight: 600,
                      }}
                    >Resolve</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Usage bar chart */}
      <div
        style={{
          backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", padding: 20,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Top Orgs by Usage</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {usageBars.map((u) => (
            <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120, fontSize: 13, color: "#475569", fontWeight: 500, textAlign: "right", flexShrink: 0 }}>{u.name}</div>
              <div style={{ flex: 1, backgroundColor: "#f1f5f9", borderRadius: 6, height: 20, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${u.pct}%`, height: "100%", borderRadius: 6,
                    backgroundColor: "#036c5f",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div style={{ width: 40, fontSize: 13, fontWeight: 600, color: "#036c5f", flexShrink: 0 }}>{u.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
