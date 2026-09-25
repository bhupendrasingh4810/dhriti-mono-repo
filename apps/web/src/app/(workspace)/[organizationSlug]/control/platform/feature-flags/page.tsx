"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  orgsOverridden: number;
  lastModified: string;
}

const initialFlags: FeatureFlag[] = [
  {
    key: "ai_assistant",
    name: "AI Assistant",
    description: "AI Assistant chat widget",
    enabled: true,
    rollout: 100,
    orgsOverridden: 2,
    lastModified: "2 days ago",
  },
  {
    key: "video_calls",
    name: "Video Calls",
    description: "Native video calling",
    enabled: false,
    rollout: 0,
    orgsOverridden: 0,
    lastModified: "1 week ago",
  },
  {
    key: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Advanced analytics dashboard",
    enabled: true,
    rollout: 80,
    orgsOverridden: 5,
    lastModified: "3 days ago",
  },
  {
    key: "custom_domains",
    name: "Custom Domains",
    description: "Custom domain support",
    enabled: true,
    rollout: 100,
    orgsOverridden: 0,
    lastModified: "5 days ago",
  },
  {
    key: "sso_enforcement",
    name: "SSO Enforcement",
    description: "Enforce SSO login",
    enabled: false,
    rollout: 0,
    orgsOverridden: 3,
    lastModified: "1 day ago",
  },
  {
    key: "scim_provisioning",
    name: "SCIM Provisioning",
    description: "SCIM user provisioning",
    enabled: true,
    rollout: 60,
    orgsOverridden: 1,
    lastModified: "4 days ago",
  },
  {
    key: "api_rate_limit_increase",
    name: "API Rate Limit Increase",
    description: "Higher API rate limits",
    enabled: false,
    rollout: 0,
    orgsOverridden: 8,
    lastModified: "6 days ago",
  },
  {
    key: "beta_editor",
    name: "Beta Editor",
    description: "New rich text editor",
    enabled: true,
    rollout: 25,
    orgsOverridden: 0,
    lastModified: "Today",
  },
  {
    key: "dark_mode",
    name: "Dark Mode",
    description: "Dark mode UI",
    enabled: true,
    rollout: 100,
    orgsOverridden: 0,
    lastModified: "2 weeks ago",
  },
  {
    key: "bulk_import",
    name: "Bulk Import",
    description: "Bulk CSV import",
    enabled: true,
    rollout: 50,
    orgsOverridden: 0,
    lastModified: "3 days ago",
  },
  {
    key: "webhooks_v2",
    name: "Webhooks v2",
    description: "Webhooks v2 with retry",
    enabled: true,
    rollout: 75,
    orgsOverridden: 0,
    lastModified: "1 week ago",
  },
  {
    key: "kanban_limits",
    name: "Kanban Limits",
    description: "Kanban board card limits",
    enabled: false,
    rollout: 0,
    orgsOverridden: 0,
    lastModified: "2 weeks ago",
  },
  {
    key: "audit_export",
    name: "Audit Export",
    description: "Export audit logs CSV",
    enabled: true,
    rollout: 100,
    orgsOverridden: 0,
    lastModified: "1 month ago",
  },
  {
    key: "mobile_app",
    name: "Mobile App",
    description: "Mobile app beta",
    enabled: false,
    rollout: 0,
    orgsOverridden: 12,
    lastModified: "5 days ago",
  },
  {
    key: "guest_access",
    name: "Guest Access",
    description: "Guest user access",
    enabled: true,
    rollout: 40,
    orgsOverridden: 0,
    lastModified: "1 week ago",
  },
];

const sampleOrgs = [
  "Acme Corporation",
  "TechFlow Inc",
  "Globex Corp",
  "Initech",
  "Umbrella Corp",
  "Stark Industries",
  "Wonka Co",
  "Cyberdyne Systems",
];

interface NewFlagForm {
  name: string;
  key: string;
  description: string;
  defaultEnabled: boolean;
  rollout: number;
}

interface NewFlagErrors {
  name?: string;
  key?: string;
}

export default function FeatureFlags() {
  const { toasts, addToast, removeToast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [showNew, setShowNew] = useState(false);
  const [showOverride, setShowOverride] = useState<string | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [newForm, setNewForm] = useState<NewFlagForm>({
    name: "",
    key: "",
    description: "",
    defaultEnabled: false,
    rollout: 0,
  });
  const [newErrors, setNewErrors] = useState<NewFlagErrors>({});

  const generateKey = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

  const handleNameChange = (name: string) => {
    setNewForm((f) => ({ ...f, name, key: generateKey(name) }));
  };

  const toggleFlag = (key: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f;
        const next = { ...f, enabled: !f.enabled, lastModified: "Just now" };
        addToast(`${f.name} ${next.enabled ? "enabled" : "disabled"}`, next.enabled ? "success" : "warning");
        return next;
      }),
    );
  };

  const handleRolloutChange = (key: string, rollout: number) => {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, rollout, lastModified: "Just now" } : f)));
  };

  const validateNew = (): boolean => {
    const errs: NewFlagErrors = {};
    if (!newForm.name.trim()) errs.name = "Flag name is required";
    if (!newForm.key.trim()) errs.key = "Flag key is required";
    else if (!/^[a-z0-9_]+$/.test(newForm.key)) errs.key = "Only lowercase letters, numbers, underscores";
    else if (flags.some((f) => f.key === newForm.key)) errs.key = "Key already exists";
    setNewErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateFlag = () => {
    if (!validateNew()) return;
    const flag: FeatureFlag = {
      key: newForm.key,
      name: newForm.name,
      description: newForm.description,
      enabled: newForm.defaultEnabled,
      rollout: newForm.rollout,
      orgsOverridden: 0,
      lastModified: "Just now",
    };
    setFlags((prev) => [flag, ...prev]);
    setShowNew(false);
    setNewForm({ name: "", key: "", description: "", defaultEnabled: false, rollout: 0 });
    setNewErrors({});
    addToast(`Feature flag "${flag.name}" created`, "success");
  };

  const handleSaveOverride = (key: string) => {
    const count = selectedOrgs.size;
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, orgsOverridden: count, lastModified: "Just now" } : f)),
    );
    setShowOverride(null);
    setSelectedOrgs(new Set());
    addToast(`Overrides saved for ${count} org${count !== 1 ? "s" : ""}`, "success");
  };

  const toggleOrgSelect = (org: string) => {
    setSelectedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(org)) next.delete(org);
      else next.add(org);
      return next;
    });
  };

  const filtered = flags.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()),
  );

  const overrideFlag = showOverride ? flags.find((f) => f.key === showOverride) : null;

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Feature Flags</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            {flags.filter((f) => f.enabled).length} of {flags.length} flags enabled
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
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
          + New Flag
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
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
          placeholder="Search flags..."
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

      {/* Table */}
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
              {["Flag", "Description", "Enabled", "Rollout %", "Orgs Overridden", "Last Modified", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((flag) => (
              <tr key={flag.key} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{flag.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginTop: 2 }}>
                    {flag.key}
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569", maxWidth: 200 }}>
                  <span
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {flag.description}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div
                    onClick={() => toggleFlag(flag.key)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      cursor: "pointer",
                      backgroundColor: flag.enabled ? "#036c5f" : "#e2e8f0",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        left: flag.enabled ? 23 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: "white",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={flag.rollout}
                      onChange={(e) => handleRolloutChange(flag.key, Number(e.target.value))}
                      style={{ width: 80, accentColor: "#036c5f", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#036c5f", minWidth: 32 }}>
                      {flag.rollout}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  {flag.orgsOverridden > 0 ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 20,
                        backgroundColor: "#ede9fe",
                        color: "#6d28d9",
                      }}
                    >
                      {flag.orgsOverridden} org{flag.orgsOverridden !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span style={{ fontSize: 13, color: "#94a3b8" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>
                  {flag.lastModified}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <button
                    onClick={() => {
                      setShowOverride(flag.key);
                      setSelectedOrgs(new Set());
                    }}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontSize: 12,
                      color: "#475569",
                      fontWeight: 500,
                    }}
                  >
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NEW FLAG MODAL */}
      {showNew && (
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
          onClick={() => setShowNew(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 28,
              width: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>New Feature Flag</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Flag Name <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Feature Flag"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: `1px solid ${newErrors.name ? "#dc2626" : "#e2e8f0"}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {newErrors.name && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{newErrors.name}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Key <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={newForm.key}
                onChange={(e) => setNewForm((f) => ({ ...f, key: e.target.value }))}
                placeholder="my_feature_flag"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: `1px solid ${newErrors.key ? "#dc2626" : "#e2e8f0"}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                }}
              />
              {newErrors.key && <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{newErrors.key}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Description
              </label>
              <input
                type="text"
                value={newForm.description}
                onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does this flag do?"
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

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                  Default Value
                </label>
                <div
                  onClick={() => setNewForm((f) => ({ ...f, defaultEnabled: !f.defaultEnabled }))}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    cursor: "pointer",
                    backgroundColor: newForm.defaultEnabled ? "#036c5f" : "#e2e8f0",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      left: newForm.defaultEnabled ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "white",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  Rollout: {newForm.rollout}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={newForm.rollout}
                  onChange={(e) => setNewForm((f) => ({ ...f, rollout: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#036c5f", cursor: "pointer" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowNew(false);
                  setNewErrors({});
                }}
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
                Cancel
              </button>
              <button
                onClick={handleCreateFlag}
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
                Create Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE MODAL */}
      {showOverride && overrideFlag && (
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
          onClick={() => setShowOverride(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 28,
              width: 460,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Org Overrides</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
              Select orgs to override the <strong>{overrideFlag.name}</strong> flag setting
            </p>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
              {sampleOrgs.map((org) => (
                <label
                  key={org}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9",
                    backgroundColor: selectedOrgs.has(org) ? "#f0fdf4" : "white",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedOrgs.has(org)}
                    onChange={() => toggleOrgSelect(org)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 13, color: "#0f172a" }}>{org}</span>
                  {selectedOrgs.has(org) && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#036c5f", fontWeight: 600 }}>
                      Override enabled
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowOverride(null)}
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
                Cancel
              </button>
              <button
                onClick={() => handleSaveOverride(overrideFlag.key)}
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
                Save Overrides ({selectedOrgs.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
