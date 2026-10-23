"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useToast, ToastContainer } from "@/components/shared/Toast";
import { controlOrganizationService, type ControlProductEntitlement } from "@/services/control.service";

interface App {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  users: number;
  lastSync: string;
  category: string;
}

export default function AppAccess() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const { toasts, addToast, removeToast } = useToast();
  const [apps, setApps] = useState<App[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadApps = useEffectEvent(async () => {
    try {
      const entitlements = await controlOrganizationService.listEntitlements(organizationSlug);
      setApps(entitlements.map(toApp));
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to load app access", "error");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(loadApps);
  }, [organizationSlug]);

  const toggleApp = async (app: App) => {
    setIsSaving(true);
    try {
      const updated = await controlOrganizationService.setEntitlement(organizationSlug, {
        productKey: app.key,
        isEnabled: !app.connected,
      });
      setApps((current) => current.map((item) => (item.id === app.id ? toApp(updated) : item)));
      addToast(`${app.name} ${updated.isEnabled ? "enabled" : "disabled"}`, updated.isEnabled ? "success" : "warning");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to update app access", "error");
    } finally {
      setIsSaving(false);
    }
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
            key={app.id}
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
              disabled={isSaving}
              onClick={() => void toggleApp(app)}
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

function toApp(entitlement: ControlProductEntitlement): App {
  return {
    id: entitlement.id,
    key: entitlement.product.key,
    name: entitlement.product.name,
    description: entitlement.product.isActive
      ? "Managed product access for this organization"
      : "This product is currently unavailable",
    icon: entitlement.product.name.slice(0, 2).toUpperCase(),
    connected: entitlement.isEnabled,
    users: 0,
    lastSync: entitlement.updatedAt ? new Date(entitlement.updatedAt).toLocaleString() : "Never",
    category: "Dhriti product",
  };
}
