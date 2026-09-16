"use client";
import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

const stats = [
  { label: "Total Members", value: "142", change: "+8", positive: true },
  { label: "Active Teams", value: "18", change: "+2", positive: true },
  { label: "Apps Connected", value: "7", change: "0", positive: true },
  { label: "Storage Used", value: "68%", change: "+4%", positive: false },
];

const recentActivity = [
  { actor: "Alice Johnson", action: "invited 3 new members", time: "10m ago" },
  { actor: "Bob Smith", action: "created team Engineering", time: "2h ago" },
  { actor: "Carol White", action: "updated SSO configuration", time: "4h ago" },
  { actor: "David Brown", action: "exported audit log", time: "Yesterday" },
  { actor: "Eve Davis", action: "changed role to Admin", time: "Yesterday" },
];

export default function OrgDashboard() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Acme Corporation</h1>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, backgroundColor: "#e6f4f2", color: "#036c5f" }}>Enterprise</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, backgroundColor: "#dcfce7", color: "#166534" }}>Active</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Organization overview and activity summary</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ backgroundColor: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.positive ? "#059669" : "#dc2626", marginTop: 4, fontWeight: 600 }}>
              {s.change} this month
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Recent Activity</h2>
          {recentActivity.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < recentActivity.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#e6f4f2", color: "#036c5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {item.actor[0]}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{item.actor}</span>
                <span style={{ fontSize: 13, color: "#64748b" }}> {item.action}</span>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Seat Usage</h2>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#475569" }}>Used seats</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>420 / 500</span>
            </div>
            <div style={{ height: 12, backgroundColor: "#f1f5f9", borderRadius: 6 }}>
              <div style={{ height: "100%", width: "84%", backgroundColor: "#036c5f", borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>84% utilized · 80 seats remaining</div>
          </div>
          <div style={{ padding: 14, backgroundColor: "#fef9c3", borderRadius: 10, border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>Approaching seat limit</div>
            <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>Consider upgrading your plan to avoid disruption.</div>
          </div>
          <button
            onClick={() => addToast("Upgrade request sent to platform admin", "info")}
            style={{ marginTop: 12, width: "100%", padding: "9px", borderRadius: 8, border: "none", backgroundColor: "#036c5f", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >Request Seat Increase</button>
        </div>
      </div>
    </div>
  );
}
