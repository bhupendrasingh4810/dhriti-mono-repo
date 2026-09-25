"use client";

import { useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";

interface Role {
  name: string;
  description: string;
  members: number;
  color: string;
  bg: string;
}

interface Permission {
  category: string;
  permissions: { name: string; owner: boolean; admin: boolean; member: boolean; viewer: boolean }[];
}

const roles: Role[] = [
  { name: "Owner", description: "Full control over the organization", members: 2, color: "#036c5f", bg: "#e6f4f2" },
  { name: "Admin", description: "Manage members, teams, and settings", members: 8, color: "#1d4ed8", bg: "#dbeafe" },
  {
    name: "Member",
    description: "Standard access to workspace features",
    members: 118,
    color: "#6d28d9",
    bg: "#ede9fe",
  },
  { name: "Viewer", description: "Read-only access to shared content", members: 14, color: "#475569", bg: "#f1f5f9" },
];

const permissionMatrix: Permission[] = [
  {
    category: "Members",
    permissions: [
      { name: "Invite members", owner: true, admin: true, member: false, viewer: false },
      { name: "Remove members", owner: true, admin: true, member: false, viewer: false },
      { name: "View members", owner: true, admin: true, member: true, viewer: true },
    ],
  },
  {
    category: "Teams",
    permissions: [
      { name: "Create teams", owner: true, admin: true, member: false, viewer: false },
      { name: "Manage teams", owner: true, admin: true, member: false, viewer: false },
      { name: "View teams", owner: true, admin: true, member: true, viewer: true },
    ],
  },
  {
    category: "Settings",
    permissions: [
      { name: "Edit org settings", owner: true, admin: false, member: false, viewer: false },
      { name: "Manage billing", owner: true, admin: false, member: false, viewer: false },
      { name: "Configure SSO", owner: true, admin: true, member: false, viewer: false },
    ],
  },
];

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Cross = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function RolesPermissions() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Roles & Permissions</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Manage what each role can do in your organization
        </p>
      </div>

      {/* Role cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {roles.map((role) => (
          <div
            key={role.name}
            style={{ backgroundColor: "white", borderRadius: 12, padding: 18, border: "1px solid #e2e8f0" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                  backgroundColor: role.bg,
                  color: role.color,
                }}
              >
                {role.name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>{role.description}</p>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{role.members}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>members</div>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Permission Matrix</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th
                style={{
                  padding: "12px 20px",
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  width: "40%",
                }}
              >
                Permission
              </th>
              {["Owner", "Admin", "Member", "Viewer"].map((r) => (
                <th
                  key={r}
                  style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b" }}
                >
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionMatrix.map((section) => (
              <>
                <tr key={section.category} style={{ backgroundColor: "#fafafa" }}>
                  <td
                    colSpan={5}
                    style={{
                      padding: "10px 20px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#036c5f",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {section.category}
                  </td>
                </tr>
                {section.permissions.map((perm) => (
                  <tr key={perm.name} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: "#475569" }}>{perm.name}</td>
                    {(["owner", "admin", "member", "viewer"] as const).map((role) => (
                      <td key={role} style={{ padding: "12px 16px", textAlign: "center" }}>
                        {perm[role] ? <Check /> : <Cross />}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => addToast("Permissions updated", "success")}
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
  );
}
