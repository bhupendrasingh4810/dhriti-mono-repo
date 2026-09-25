"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface App {
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  users: number;
  lastSync: string;
  category: string;
}

const initialApps: App[] = [
  {
    name: "Slack",
    description: "Team messaging and notifications",
    icon: "S",
    connected: true,
    users: 142,
    lastSync: "2m ago",
    category: "Communication",
  },
  {
    name: "GitHub",
    description: "Code repository and CI/CD",
    icon: "G",
    connected: true,
    users: 45,
    lastSync: "5m ago",
    category: "Development",
  },
  {
    name: "Jira",
    description: "Project and issue tracking",
    icon: "J",
    connected: true,
    users: 98,
    lastSync: "1h ago",
    category: "Productivity",
  },
  {
    name: "Salesforce",
    description: "CRM and sales pipeline",
    icon: "SF",
    connected: false,
    users: 0,
    lastSync: "Never",
    category: "Sales",
  },
  {
    name: "Zoom",
    description: "Video conferencing",
    icon: "Z",
    connected: true,
    users: 140,
    lastSync: "10m ago",
    category: "Communication",
  },
  {
    name: "Figma",
    description: "Design collaboration",
    icon: "F",
    connected: true,
    users: 28,
    lastSync: "30m ago",
    category: "Design",
  },
  {
    name: "HubSpot",
    description: "Marketing automation",
    icon: "H",
    connected: false,
    users: 0,
    lastSync: "Never",
    category: "Marketing",
  },
  {
    name: "Notion",
    description: "Docs and knowledge base",
    icon: "N",
    connected: false,
    users: 0,
    lastSync: "Never",
    category: "Productivity",
  },
];

export default function AppAccess() {
  const { toasts, addToast, removeToast } = useToast();
  const [apps, setApps] = useState<App[]>(initialApps);

  const toggleApp = (name: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.name !== name) return a;
        const next = {
          ...a,
          connected: !a.connected,
          users: a.connected ? 0 : 10,
          lastSync: a.connected ? "Never" : "Just now",
        };
        addToast(`${a.name} ${next.connected ? "connected" : "disconnected"}`, next.connected ? "success" : "warning");
        return next;
      }),
    );
  };

  const connected = apps.filter((a) => a.connected).length;

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>App Access</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          {connected} of {apps.length} apps connected
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {apps.map((app) => (
          <div
            key={app.name}
            style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    backgroundColor: app.connected ? "#e6f4f2" : "#f1f5f9",
                    color: app.connected ? "#036c5f" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {app.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{app.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{app.category}</div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: 20,
                  backgroundColor: app.connected ? "#dcfce7" : "#f1f5f9",
                  color: app.connected ? "#166534" : "#64748b",
                }}
              >
                {app.connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>{app.description}</p>
            {app.connected && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  padding: "8px 0",
                  borderTop: "1px solid #f1f5f9",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#036c5f" }}>{app.users}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Users</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#475569" }}>{app.lastSync}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Last sync</div>
                </div>
              </div>
            )}
            <button
              onClick={() => toggleApp(app.name)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 7,
                border: app.connected ? "1px solid #fecaca" : "1px solid #e2e8f0",
                backgroundColor: app.connected ? "#fff5f5" : "#036c5f",
                color: app.connected ? "#dc2626" : "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {app.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
