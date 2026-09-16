"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface SecurityEvent {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  description: string;
  ip: string;
  time: string;
  resolved: boolean;
}

const severityColors: Record<SecurityEvent["severity"], { bg: string; color: string }> = {
  critical: { bg: "#fee2e2", color: "#dc2626" },
  high: { bg: "#ffedd5", color: "#c2410c" },
  medium: { bg: "#fef9c3", color: "#92400e" },
  low: { bg: "#dbeafe", color: "#1d4ed8" },
};

const events: SecurityEvent[] = [
  { id: "1", severity: "critical", type: "Brute Force", description: "Multiple failed login attempts detected", ip: "192.168.1.45", time: "5m ago", resolved: false },
  { id: "2", severity: "high", type: "Suspicious IP", description: "Login from unusual geographic location", ip: "203.0.113.78", time: "23m ago", resolved: false },
  { id: "3", severity: "medium", type: "API Abuse", description: "Rate limit exceeded 10x in 60s", ip: "198.51.100.22", time: "1h ago", resolved: false },
  { id: "4", severity: "low", type: "Config Change", description: "MFA settings modified by admin", ip: "10.0.0.5", time: "2h ago", resolved: true },
  { id: "5", severity: "high", type: "Token Leak", description: "API token used from two IPs simultaneously", ip: "172.16.0.99", time: "3h ago", resolved: false },
  { id: "6", severity: "medium", type: "Privilege Escalation", description: "User attempted unauthorized role change", ip: "10.0.0.12", time: "5h ago", resolved: true },
];

const metrics = [
  { label: "Active Threats", value: "4", color: "#dc2626", bg: "#fee2e2" },
  { label: "Blocked IPs", value: "127", color: "#c2410c", bg: "#ffedd5" },
  { label: "MFA Adoption", value: "87%", color: "#059669", bg: "#dcfce7" },
  { label: "SSO Orgs", value: "23", color: "#036c5f", bg: "#e6f4f2" },
];

export default function SecurityCenter() {
  const { toasts, addToast, removeToast } = useToast();
  const [secEvents, setSecEvents] = useState<SecurityEvent[]>(events);

  const handleResolve = (id: string) => {
    setSecEvents((prev) => prev.map((e) => e.id === id ? { ...e, resolved: true } : e));
    addToast("Security event marked as resolved", "success");
  };

  const handleBlock = (ip: string) => {
    addToast(`IP ${ip} has been blocked`, "warning");
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Security Center</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Monitor and respond to security threats across the platform</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ backgroundColor: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Security events */}
      <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Security Events</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              {["Severity", "Type", "Description", "IP Address", "Time", "Actions"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {secEvents.map((ev) => {
              const sc = severityColors[ev.severity];
              return (
                <tr key={ev.id} style={{ borderTop: "1px solid #f1f5f9", opacity: ev.resolved ? 0.5 : 1 }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, backgroundColor: sc.bg, color: sc.color, textTransform: "capitalize" }}>
                      {ev.severity}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{ev.type}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{ev.description}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{ev.ip}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{ev.time}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {ev.resolved ? (
                      <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Resolved</span>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleResolve(ev.id)}
                          style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 12, color: "#475569" }}
                        >Resolve</button>
                        <button
                          onClick={() => handleBlock(ev.ip)}
                          style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #fecaca", backgroundColor: "#fff5f5", cursor: "pointer", fontSize: 12, color: "#dc2626" }}
                        >Block IP</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MFA & SSO summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>MFA Status</h3>
          {[
            { label: "MFA Enforced", value: "23 orgs", pct: 48 },
            { label: "MFA Optional", value: "19 orgs", pct: 40 },
            { label: "No MFA", value: "6 orgs", pct: 12 },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.value}</span>
              </div>
              <div style={{ height: 6, backgroundColor: "#f1f5f9", borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${item.pct}%`, backgroundColor: "#036c5f", borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Blocked IPs</h3>
          {["192.168.1.45", "203.0.113.78", "198.51.100.22", "172.16.0.99"].map((ip) => (
            <div key={ip} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 13, fontFamily: "monospace", color: "#475569" }}>{ip}</span>
              <button
                onClick={() => addToast(`${ip} unblocked`, "info")}
                style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 11, color: "#475569" }}
              >Unblock</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
