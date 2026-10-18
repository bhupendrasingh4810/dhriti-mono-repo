"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useToast, ToastContainer } from "@/components/shared/Toast";
import { invitationsService } from "@/services/organization-management.service";
import { controlOrganizationService, type ControlOrganizationMember } from "@/services/control.service";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  joined: string;
  status: "Active" | "Inactive" | "Pending";
}

const statusColors: Record<Employee["status"], { bg: string; color: string }> = {
  Active: { bg: "#dcfce7", color: "#166534" },
  Inactive: { bg: "#f1f5f9", color: "#475569" },
  Pending: { bg: "#fef9c3", color: "#92400e" },
};

export default function EmployeePage() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const { toasts, addToast, removeToast } = useToast();
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<Employee[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadMembers = useEffectEvent(async () => {
    try {
      const result = await controlOrganizationService.listMembers(organizationSlug);
      setMembers(result.map(toEmployee));
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to load members", "error");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(loadMembers);
  }, [organizationSlug]);

  const handleInvite = async () => {
    const email = window.prompt("Enter the member email address");
    if (!email?.trim()) return;
    setIsSaving(true);
    try {
      await invitationsService.create(organizationSlug, { email: email.trim() });
      addToast(`Invitation sent to ${email.trim()}`, "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to invite member", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (member: Employee) => {
    if (!window.confirm(`Remove ${member.name} from this organization?`)) return;
    setIsSaving(true);
    try {
      await controlOrganizationService.removeMember(organizationSlug, member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      addToast(`${member.name} removed`, "warning");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to remove member", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Employees</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            {members.length} employees in this organization
          </p>
        </div>
        <button
          disabled={isSaving}
          onClick={() => void handleInvite()}
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
          + Invite Member
        </button>
      </div>

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
          placeholder="Search members..."
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

      <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              {["Member", "Role", "Team", "Joined", "Status", "Actions"].map((h) => (
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
            {filtered.map((m) => {
              const sc = statusColors[m.status];
              return (
                <tr key={m.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          backgroundColor: "#e6f4f2",
                          color: "#036c5f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {m.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{m.role}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{m.team}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{m.joined}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 20,
                        backgroundColor: sc.bg,
                        color: sc.color,
                      }}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      disabled={isSaving || m.role === "Owner"}
                      onClick={() => void handleRemove(m)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 5,
                        border: "1px solid #fecaca",
                        backgroundColor: "#fff5f5",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#dc2626",
                      }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function toEmployee(member: ControlOrganizationMember): Employee {
  const statusByApiValue: Record<string, Employee["status"]> = {
    ACTIVE: "Active",
    INVITED: "Pending",
    PENDING: "Pending",
  };
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.isOwner ? "Owner" : member.role,
    team: member.teams.join(", ") || "-",
    joined: new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: statusByApiValue[member.status] ?? "Inactive",
  };
}
