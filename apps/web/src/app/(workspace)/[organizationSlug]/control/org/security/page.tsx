"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

export default function OrgSecurity() {
  const { toasts, addToast, removeToast } = useToast();
  const [ssoEnabled, setSsoEnabled] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("8");
  const [passwordMinLength, setPasswordMinLength] = useState("12");

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Security Settings</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Configure authentication and access security for your organization
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* SSO */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Single Sign-On (SSO)</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                Allow members to sign in with your identity provider
              </div>
            </div>
            <div
              onClick={() => {
                setSsoEnabled((v) => !v);
                addToast(`SSO ${!ssoEnabled ? "enabled" : "disabled"}`, !ssoEnabled ? "success" : "warning");
              }}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                cursor: "pointer",
                backgroundColor: ssoEnabled ? "#036c5f" : "#e2e8f0",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: ssoEnabled ? 23 : 3,
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
          {ssoEnabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Provider", value: "Okta" },
                { label: "Entity ID", value: "https://acme.okta.com/app/dhriti" },
                { label: "SSO URL", value: "https://acme.okta.com/sso/saml" },
              ].map((item) => (
                <div key={item.label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
                    {item.label}
                  </label>
                  <input
                    type="text"
                    defaultValue={item.value}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MFA */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Require MFA</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                Enforce multi-factor authentication for all members
              </div>
            </div>
            <div
              onClick={() => {
                setMfaRequired((v) => !v);
                addToast(
                  `MFA enforcement ${!mfaRequired ? "enabled" : "disabled"}`,
                  !mfaRequired ? "success" : "warning",
                );
              }}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                cursor: "pointer",
                backgroundColor: mfaRequired ? "#036c5f" : "#e2e8f0",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: mfaRequired ? 23 : 3,
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
        </div>

        {/* Session & password */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>
            Session & Password Policy
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Session Timeout (hours)
              </label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
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
                Min Password Length
              </label>
              <input
                type="number"
                value={passwordMinLength}
                onChange={(e) => setPasswordMinLength(e.target.value)}
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
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => addToast("Security settings saved", "success")}
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
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
