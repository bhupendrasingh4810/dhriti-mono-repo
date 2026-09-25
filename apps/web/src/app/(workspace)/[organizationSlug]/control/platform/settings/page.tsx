"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface SettingSection {
  id: string;
  label: string;
}

const sections: SettingSection[] = [
  { id: "general", label: "General" },
  { id: "email", label: "Email" },
  { id: "billing", label: "Billing" },
  { id: "security", label: "Security" },
];

export default function PlatformSettings() {
  const { toasts, addToast, removeToast } = useToast();
  const [activeSection, setActiveSection] = useState("general");

  const [general, setGeneral] = useState({
    platformName: "Dhriti OS",
    supportEmail: "support@dhriti.io",
    maxOrgs: "1000",
    allowSignups: true,
  });
  const [email, setEmail] = useState({
    smtpHost: "smtp.sendgrid.net",
    smtpPort: "587",
    fromEmail: "noreply@dhriti.io",
    fromName: "Dhriti OS",
  });
  const [security, setSecurity] = useState({
    sessionTimeout: "24",
    mfaRequired: false,
    ipWhitelist: "",
    auditRetention: "90",
  });

  const handleSave = () => {
    addToast("Settings saved successfully", "success");
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Platform Settings</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Configure global platform behavior and integrations
        </p>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Side nav */}
        <div style={{ width: 180, flexShrink: 0 }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 14px",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 4,
                fontSize: 13,
                backgroundColor: activeSection === s.id ? "#e6f4f2" : "transparent",
                color: activeSection === s.id ? "#036c5f" : "#475569",
                fontWeight: activeSection === s.id ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          {activeSection === "general" && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>General Settings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Platform Name", key: "platformName", type: "text" },
                  { label: "Support Email", key: "supportEmail", type: "email" },
                  { label: "Max Organizations", key: "maxOrgs", type: "number" },
                ].map((field) => (
                  <div key={field.key}>
                    <label
                      style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={general[field.key as keyof typeof general] as string}
                      onChange={(e) => setGeneral((g) => ({ ...g, [field.key]: e.target.value }))}
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
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    onClick={() => setGeneral((g) => ({ ...g, allowSignups: !g.allowSignups }))}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      cursor: "pointer",
                      backgroundColor: general.allowSignups ? "#036c5f" : "#e2e8f0",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        left: general.allowSignups ? 23 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: "white",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                    Allow new organization signups
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeSection === "email" && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>
                Email Configuration
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "SMTP Host", key: "smtpHost" },
                  { label: "SMTP Port", key: "smtpPort" },
                  { label: "From Email", key: "fromEmail" },
                  { label: "From Name", key: "fromName" },
                ].map((field) => (
                  <div key={field.key}>
                    <label
                      style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}
                    >
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={email[field.key as keyof typeof email]}
                      onChange={(e) => setEmail((em) => ({ ...em, [field.key]: e.target.value }))}
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
                ))}
                <button
                  onClick={() => addToast("Test email sent to support@dhriti.io", "info")}
                  style={{
                    alignSelf: "flex-start",
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
                  Send Test Email
                </button>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>
                Billing Configuration
              </h2>
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#f0fdf4",
                  borderRadius: 10,
                  marginBottom: 16,
                  border: "1px solid #bbf7d0",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Stripe Integration</div>
                <div style={{ fontSize: 12, color: "#166534", marginTop: 4 }}>Connected · Live mode active</div>
              </div>
              {[
                { label: "Stripe Publishable Key", value: "pk_live_••••••••••••xxxx" },
                { label: "Webhook Endpoint", value: "https://api.dhriti.io/webhooks/stripe" },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    {item.label}
                  </label>
                  <input
                    type="text"
                    value={item.value}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "#f8fafc",
                      color: "#64748b",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === "security" && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Security Settings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Session Timeout (hours)
                  </label>
                  <input
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity((s) => ({ ...s, sessionTimeout: e.target.value }))}
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
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Audit Log Retention (days)
                  </label>
                  <input
                    type="number"
                    value={security.auditRetention}
                    onChange={(e) => setSecurity((s) => ({ ...s, auditRetention: e.target.value }))}
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
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    IP Allowlist (comma-separated)
                  </label>
                  <textarea
                    value={security.ipWhitelist}
                    onChange={(e) => setSecurity((s) => ({ ...s, ipWhitelist: e.target.value }))}
                    rows={3}
                    placeholder="10.0.0.0/8, 192.168.0.0/16"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    onClick={() => setSecurity((s) => ({ ...s, mfaRequired: !s.mfaRequired }))}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      cursor: "pointer",
                      backgroundColor: security.mfaRequired ? "#036c5f" : "#e2e8f0",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        left: security.mfaRequired ? 23 : 3,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: "white",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                    Require MFA for all platform staff
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={handleSave}
              style={{
                padding: "9px 24px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#036c5f",
                color: "white",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
