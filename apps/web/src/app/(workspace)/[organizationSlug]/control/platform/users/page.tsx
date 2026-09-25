"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

type Role = "Super Admin" | "Admin" | "Support" | "Viewer";
type UserStatus = "Active" | "Inactive";

interface StaffUser {
  name: string;
  email: string;
  role: Role;
  lastActive: string;
  status: UserStatus;
}

const roleColors: Record<Role, { bg: string; color: string }> = {
  "Super Admin": { bg: "#e6f4f2", color: "#036c5f" },
  Admin: { bg: "#dbeafe", color: "#1d4ed8" },
  Support: { bg: "#ede9fe", color: "#6d28d9" },
  Viewer: { bg: "#f1f5f9", color: "#475569" },
};

const initialUsers: StaffUser[] = [
  { name: "Jordan Smith", email: "super-admin@dhriti.io", role: "Super Admin", lastActive: "2m ago", status: "Active" },
  { name: "Priya Patel", email: "priya@dhriti.io", role: "Admin", lastActive: "1h ago", status: "Active" },
  { name: "Marcus Lee", email: "marcus@dhriti.io", role: "Admin", lastActive: "3h ago", status: "Active" },
  { name: "Sophie Chen", email: "sophie@dhriti.io", role: "Support", lastActive: "Yesterday", status: "Active" },
  { name: "Tyler Brown", email: "tyler@dhriti.io", role: "Support", lastActive: "2 days ago", status: "Active" },
  { name: "Aria Kim", email: "aria@dhriti.io", role: "Viewer", lastActive: "1 week ago", status: "Active" },
  { name: "Connor Walsh", email: "connor@dhriti.io", role: "Support", lastActive: "3h ago", status: "Active" },
  { name: "Zoe Martinez", email: "zoe@dhriti.io", role: "Viewer", lastActive: "5 days ago", status: "Inactive" },
  { name: "Ravi Gupta", email: "ravi@dhriti.io", role: "Admin", lastActive: "30m ago", status: "Active" },
  { name: "Nadia Okafor", email: "nadia@dhriti.io", role: "Viewer", lastActive: "2 weeks ago", status: "Inactive" },
];

interface InviteForm {
  name: string;
  email: string;
  role: Role;
  sendInvite: boolean;
}

interface InviteErrors {
  name?: string;
  email?: string;
}

export default function PlatformUsers() {
  const { toasts, addToast, removeToast } = useToast();
  const [users, setUsers] = useState<StaffUser[]>(initialUsers);
  const [showInvite, setShowInvite] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<number | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteForm>({ name: "", email: "", role: "Viewer", sendInvite: true });
  const [inviteErrors, setInviteErrors] = useState<InviteErrors>({});
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const validateInvite = (): boolean => {
    const errs: InviteErrors = {};
    if (!inviteForm.name.trim()) errs.name = "Name is required";
    if (!inviteForm.email.trim()) errs.email = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(inviteForm.email)) errs.email = "Invalid email address";
    setInviteErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInvite = () => {
    if (!validateInvite()) return;
    const newUser: StaffUser = {
      name: inviteForm.name,
      email: inviteForm.email,
      role: inviteForm.role,
      lastActive: "Never",
      status: "Inactive",
    };
    setUsers((prev) => [...prev, newUser]);
    setShowInvite(false);
    setInviteForm({ name: "", email: "", role: "Viewer", sendInvite: true });
    setInviteErrors({});
    addToast(`Invitation sent to ${inviteForm.email}`, "success");
  };

  const handleRoleChange = (i: number, role: Role) => {
    setUsers((prev) => prev.map((u, idx) => (idx === i ? { ...u, role } : u)));
    addToast(`Role updated to ${role}`, "success");
  };

  const handleRemove = () => {
    if (removeTarget === null) return;
    const name = users[removeTarget].name;
    setUsers((prev) => prev.filter((_, i) => i !== removeTarget));
    setRemoveTarget(null);
    addToast(`${name} removed from platform`, "error");
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Platform Users</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Manage internal staff and their access levels
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
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
          + Invite Staff
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
          placeholder="Search staff..."
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
              {["Staff Member", "Role", "Last Active", "Status", "Actions"].map((h) => (
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
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const rc = roleColors[user.role];
              const initials = user.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2);
              return (
                <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: user.status === "Active" ? "#e6f4f2" : "#f1f5f9",
                          color: user.status === "Active" ? "#036c5f" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 20,
                        backgroundColor: rc.bg,
                        color: rc.color,
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#475569" }}>{user.lastActive}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          backgroundColor: user.status === "Active" ? "#22c55e" : "#94a3b8",
                        }}
                      />
                      <span style={{ fontSize: 13, color: user.status === "Active" ? "#166534" : "#64748b" }}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(i, e.target.value as Role)}
                        style={{
                          padding: "5px 8px",
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: "pointer",
                          backgroundColor: "white",
                          color: "#475569",
                        }}
                      >
                        {(["Super Admin", "Admin", "Support", "Viewer"] as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setRemoveTarget(i)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "1px solid #fecaca",
                          backgroundColor: "#fff5f5",
                          cursor: "pointer",
                          fontSize: 12,
                          color: "#dc2626",
                          fontWeight: 500,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
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
          onClick={() => setShowInvite(false)}
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
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Invite Staff Member</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Full Name <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: `1px solid ${inviteErrors.name ? "#dc2626" : "#e2e8f0"}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {inviteErrors.name && (
                <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{inviteErrors.name}</p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Email Address <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@dhriti.io"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: `1px solid ${inviteErrors.email ? "#dc2626" : "#e2e8f0"}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {inviteErrors.email && (
                <p style={{ color: "#dc2626", fontSize: 12, margin: "4px 0 0" }}>{inviteErrors.email}</p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Role <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as Role }))}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  backgroundColor: "white",
                }}
              >
                {(["Super Admin", "Admin", "Support", "Viewer"] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <input
                type="checkbox"
                id="sendInvite"
                checked={inviteForm.sendInvite}
                onChange={(e) => setInviteForm((f) => ({ ...f, sendInvite: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="sendInvite" style={{ fontSize: 13, color: "#374151", cursor: "pointer" }}>
                Send invitation email immediately
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowInvite(false);
                  setInviteErrors({});
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
                onClick={handleInvite}
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
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE CONFIRM MODAL */}
      {removeTarget !== null && (
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
          onClick={() => setRemoveTarget(null)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 28,
              width: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 10px" }}>Remove Staff Member</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px", lineHeight: 1.6 }}>
              Are you sure you want to remove <strong>{users[removeTarget]?.name}</strong> from the platform? They will
              lose all access immediately.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setRemoveTarget(null)}
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
                onClick={handleRemove}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
