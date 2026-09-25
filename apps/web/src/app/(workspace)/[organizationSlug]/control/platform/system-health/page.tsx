"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface Service {
  name: string;
  status: "operational" | "degraded" | "outage";
  uptime: string;
  latency: string;
  lastCheck: string;
}

const statusColors: Record<Service["status"], { bg: string; color: string; dot: string }> = {
  operational: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  degraded: { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  outage: { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
};

const services: Service[] = [
  { name: "API Gateway", status: "degraded", uptime: "99.94%", latency: "847ms", lastCheck: "30s ago" },
  { name: "Auth Service", status: "operational", uptime: "100%", latency: "12ms", lastCheck: "30s ago" },
  { name: "Database (Primary)", status: "operational", uptime: "99.99%", latency: "4ms", lastCheck: "30s ago" },
  { name: "Database (Replica)", status: "operational", uptime: "99.99%", latency: "6ms", lastCheck: "30s ago" },
  { name: "Redis Cache", status: "degraded", uptime: "99.80%", latency: "22ms", lastCheck: "30s ago" },
  { name: "File Storage (S3)", status: "operational", uptime: "100%", latency: "38ms", lastCheck: "30s ago" },
  { name: "Email Service", status: "operational", uptime: "99.97%", latency: "210ms", lastCheck: "30s ago" },
  { name: "WebSocket Server", status: "operational", uptime: "99.95%", latency: "8ms", lastCheck: "30s ago" },
  { name: "Search (Elasticsearch)", status: "operational", uptime: "99.92%", latency: "55ms", lastCheck: "30s ago" },
  { name: "CDN", status: "operational", uptime: "100%", latency: "15ms", lastCheck: "30s ago" },
];

const resourceMetrics = [
  { label: "CPU Usage", value: 68, unit: "%", color: "#036c5f" },
  { label: "Memory", value: 74, unit: "%", color: "#2563eb" },
  { label: "Disk I/O", value: 42, unit: "%", color: "#7c3aed" },
  { label: "Network", value: 31, unit: "%", color: "#d97706" },
];

export default function SystemHealth() {
  const { toasts, addToast, removeToast } = useToast();

  const operational = services.filter((s) => s.status === "operational").length;
  const degraded = services.filter((s) => s.status === "degraded").length;
  const outage = services.filter((s) => s.status === "outage").length;

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>System Health</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Real-time infrastructure status and performance metrics
        </p>
      </div>

      {/* Status summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Operational", count: operational, color: "#166534", bg: "#dcfce7" },
          { label: "Degraded", count: degraded, color: "#92400e", bg: "#fef9c3" },
          { label: "Outage", count: outage, color: "#991b1b", bg: "#fee2e2" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ backgroundColor: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}
          >
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>{item.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: item.color }}>{item.count}</span>
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 20,
                  backgroundColor: item.bg,
                  color: item.color,
                  fontWeight: 600,
                }}
              >
                services
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
        {/* Services table */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Service Status</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {["Service", "Status", "Uptime", "Latency", "Last Check"].map((h) => (
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
              {services.map((svc) => {
                const sc = statusColors[svc.status];
                return (
                  <tr key={svc.name} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                      {svc.name}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: sc.dot }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: sc.color, textTransform: "capitalize" }}>
                          {svc.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{svc.uptime}</td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        color: svc.latency > "100ms" ? "#d97706" : "#475569",
                        fontFamily: "monospace",
                      }}
                    >
                      {svc.latency}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>{svc.lastCheck}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resource metrics */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Resource Usage</h2>
          {resourceMetrics.map((rm) => (
            <div key={rm.label} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{rm.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: rm.color }}>
                  {rm.value}
                  {rm.unit}
                </span>
              </div>
              <div style={{ height: 10, backgroundColor: "#f1f5f9", borderRadius: 5 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${rm.value}%`,
                    borderRadius: 5,
                    backgroundColor: rm.color,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 14, backgroundColor: "#f8fafc", borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Active Connections</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>4,821</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>+124 in last 5m</div>
          </div>
          <button
            onClick={() => addToast("Health report generated", "success")}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "9px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              backgroundColor: "white",
              cursor: "pointer",
              fontSize: 13,
              color: "#475569",
              fontWeight: 500,
            }}
          >
            Download Health Report
          </button>
        </div>
      </div>
    </div>
  );
}
