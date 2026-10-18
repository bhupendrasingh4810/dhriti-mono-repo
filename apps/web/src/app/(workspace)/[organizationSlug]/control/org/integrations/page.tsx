"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useToast, ToastContainer } from "@/components/shared/Toast";
import { webhooksService } from "@/services/admin.service";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDelivery?: string;
}

const apiKeys = [
  { name: "Production API Key", key: "dhrt_live_••••••••••••••••abcd", created: "Jan 15, 2024", lastUsed: "2m ago" },
  { name: "Development Key", key: "dhrt_dev_••••••••••••••••efgh", created: "Mar 3, 2024", lastUsed: "1d ago" },
];

export default function OrgIntegrations() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const { toasts, addToast, removeToast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadWebhooks = useEffectEvent(async () => {
    try {
      const items = await webhooksService.list(organizationSlug);
      setWebhooks(
        items.map((item) => ({
          id: String(item.id),
          url: String(item.url),
          events: Array.isArray(item.events) ? item.events.map(String) : [],
          active: Boolean(item.isActive),
          lastDelivery: item.updatedAt ? new Date(String(item.updatedAt)).toLocaleString() : undefined,
        })),
      );
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to load webhooks", "error");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(loadWebhooks);
  }, [organizationSlug]);

  const toggleWebhook = async (webhook: Webhook) => {
    setIsSaving(true);
    try {
      const updated = await webhooksService.update(organizationSlug, webhook.id, { isActive: !webhook.active });
      setWebhooks((previous) =>
        previous.map((item) => (item.id === webhook.id ? { ...item, active: Boolean(updated.isActive) } : item)),
      );
      addToast(`Webhook ${updated.isActive ? "enabled" : "disabled"}`, updated.isActive ? "success" : "warning");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to update webhook", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    setIsSaving(true);
    try {
      await webhooksService.remove(organizationSlug, id);
      setWebhooks((previous) => previous.filter((item) => item.id !== id));
      addToast("Webhook deleted", "error");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to delete webhook", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Integrations</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Manage webhooks, API keys, and external integrations
        </p>
      </div>

      {/* API Keys */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>API Keys</h2>
          <button
            onClick={() => addToast("New API key generated", "success")}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "none",
              backgroundColor: "#036c5f",
              color: "white",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Generate Key
          </button>
        </div>
        {apiKeys.map((key, i) => (
          <div
            key={i}
            style={{ padding: "16px 20px", borderBottom: i < apiKeys.length - 1 ? "1px solid #f1f5f9" : "none" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{key.name}</div>
                <code
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    backgroundColor: "#f8fafc",
                    padding: "2px 8px",
                    borderRadius: 4,
                    marginTop: 4,
                    display: "inline-block",
                  }}
                >
                  {key.key}
                </code>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Created {key.created}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Last used {key.lastUsed}</div>
                <button
                  onClick={() => addToast("API key revoked", "error")}
                  style={{
                    marginTop: 6,
                    padding: "4px 10px",
                    borderRadius: 5,
                    border: "1px solid #fecaca",
                    backgroundColor: "#fff5f5",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#dc2626",
                  }}
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Webhooks */}
      <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Webhooks</h2>
          <button
            onClick={() => setShowNewWebhook(true)}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "none",
              backgroundColor: "#036c5f",
              color: "white",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + Add Webhook
          </button>
        </div>
        {webhooks.map((wh) => (
          <div key={wh.id} style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <code
                    style={{
                      fontSize: 12,
                      color: "#475569",
                      backgroundColor: "#f8fafc",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {wh.url}
                  </code>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      backgroundColor: wh.active ? "#dcfce7" : "#f1f5f9",
                      color: wh.active ? "#166534" : "#64748b",
                    }}
                  >
                    {wh.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {wh.events.map((ev) => (
                    <span
                      key={ev}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        backgroundColor: "#f1f5f9",
                        color: "#475569",
                        fontFamily: "monospace",
                      }}
                    >
                      {ev}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                  Last updated: {wh.lastDelivery ?? "Never"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div
                  onClick={() => void toggleWebhook(wh)}
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    cursor: "pointer",
                    backgroundColor: wh.active ? "#036c5f" : "#e2e8f0",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: wh.active ? 18 : 2,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: "white",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
                <button
                  disabled={isSaving}
                  onClick={() => void deleteWebhook(wh.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 5,
                    border: "1px solid #fecaca",
                    backgroundColor: "#fff5f5",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#dc2626",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNewWebhook && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowNewWebhook(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 28,
              width: 440,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Add Webhook</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Endpoint URL <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowNewWebhook(false)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                Cancel
              </button>
              <button
                disabled={isSaving || !newUrl}
                onClick={() => {
                  void (async () => {
                    setIsSaving(true);
                    try {
                      const created = await webhooksService.create(organizationSlug, {
                        url: newUrl,
                        events: ["user.created"],
                      });
                      setWebhooks((previous) => [
                        ...previous,
                        {
                          id: String(created.id),
                          url: String(created.url),
                          events: Array.isArray(created.events) ? created.events.map(String) : [],
                          active: Boolean(created.isActive),
                        },
                      ]);
                      addToast("Webhook added", "success");
                      setShowNewWebhook(false);
                      setNewUrl("");
                    } catch (error) {
                      addToast(error instanceof Error ? error.message : "Unable to create webhook", "error");
                    } finally {
                      setIsSaving(false);
                    }
                  })();
                }}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#036c5f",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Add Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
