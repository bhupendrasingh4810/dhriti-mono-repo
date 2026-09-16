"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

export default function OrgSettings() {
  const { toasts, addToast, removeToast } = useToast();
  const [orgName, setOrgName] = useState("Acme Corporation");
  const [orgSlug, setOrgSlug] = useState("acme-corp");
  const [orgEmail, setOrgEmail] = useState("admin@acme.com");
  const [orgWebsite, setOrgWebsite] = useState("https://acme.com");
  const [timezone, setTimezone] = useState("America/New_York");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Organization Settings</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Manage your organization profile and preferences</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* General */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>General</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: "#e6f4f2", color: "#036c5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>
              A
            </div>
            <button
              onClick={() => addToast("Logo upload coming soon", "info")}
              style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 12, color: "#475569", fontWeight: 500 }}
            >Upload Logo</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Organization Name", value: orgName, setter: setOrgName },
              { label: "URL Slug", value: orgSlug, setter: setOrgSlug },
              { label: "Contact Email", value: orgEmail, setter: setOrgEmail },
              { label: "Website", value: orgWebsite, setter: setOrgWebsite },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{field.label}</label>
                <input
                  type="text" value={field.value} onChange={(e) => field.setter(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Timezone</label>
              <select
                value={timezone} onChange={(e) => setTimezone(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, cursor: "pointer", backgroundColor: "white" }}
              >
                {["America/New_York", "America/Chicago", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Tokyo", "Asia/Kolkata"].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => addToast("Organization settings saved", "success")}
              style={{ padding: "9px 24px", borderRadius: 8, border: "none", backgroundColor: "#036c5f", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >Save Changes</button>
          </div>
        </div>

        {/* Plan */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Current Plan</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Enterprise Plan</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, backgroundColor: "#e6f4f2", color: "#036c5f" }}>Active</span>
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>420 / 500 seats used · $8,400/mo</div>
            </div>
            <button
              onClick={() => addToast("Billing portal opened", "info")}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: "#036c5f", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >Manage Billing</button>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #fecaca", padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#dc2626", margin: "0 0 12px" }}>Danger Zone</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Delete Organization</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Permanently delete this organization and all its data. This cannot be undone.</div>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #dc2626", backgroundColor: "white", color: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >Delete Organization</button>
          </div>
        </div>
      </div>

      {showDelete && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div style={{ backgroundColor: "white", borderRadius: 16, padding: 28, width: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>Delete Organization</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
              This will permanently delete <strong>Acme Corporation</strong> and all data. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(""); }} style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 13, color: "#475569" }}>Cancel</button>
              <button
                disabled={deleteConfirm !== "DELETE"}
                onClick={() => { addToast("Organization deletion requested", "error"); setShowDelete(false); }}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: deleteConfirm === "DELETE" ? "#dc2626" : "#fca5a5", color: "white", cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}
              >Delete Organization</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
