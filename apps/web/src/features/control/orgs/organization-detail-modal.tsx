import type { OrganizationTableItem } from "./organization-table";

export type OrganizationDetailTab = "overview" | "members" | "billing" | "audit";

type OrganizationDetailModalProps = {
  organization: OrganizationTableItem;
  activeTab: OrganizationDetailTab;
  onTabChange: (tab: OrganizationDetailTab) => void;
  onClose: () => void;
};

const tabs: Array<{ id: OrganizationDetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "billing", label: "Billing" },
  { id: "audit", label: "Audit" },
];

export function OrganizationDetailModal({
  organization,
  activeTab,
  onTabChange,
  onClose,
}: OrganizationDetailModalProps) {
  const initials = organization.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
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
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          width: "90%",
          height: "90%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: "#e6f4f2",
                color: "#036c5f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{organization.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {organization.plan} Plan · {organization.seats} seats
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}
          >
            ×
          </button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: "12px 16px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? "#036c5f" : "#64748b",
                borderBottom: activeTab === tab.id ? "2px solid #036c5f" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <OrganizationDetailContent organization={organization} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

function OrganizationDetailContent({
  organization,
  activeTab,
}: Pick<OrganizationDetailModalProps, "organization" | "activeTab">) {
  if (activeTab === "overview")
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          { label: "Status", value: organization.status },
          { label: "Plan", value: organization.plan },
          { label: "Seats", value: organization.seats },
          { label: "MRR", value: organization.mrr },
          { label: "Created", value: organization.created },
          { label: "Org ID", value: "org_" + organization.name.replace(/\s/g, "").toLowerCase().slice(0, 8) },
        ].map((item) => (
          <div key={item.label} style={{ padding: 16, backgroundColor: "#f8fafc", borderRadius: 10 }}>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              {item.label}
            </div>
            <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>
    );

  if (activeTab === "members")
    return (
      <div>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>Organization member list</p>
        {["Alice Johnson (Owner)", "Bob Smith (Admin)", "Carol White (Member)", "David Brown (Member)"].map(
          (member) => (
            <div
              key={member}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
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
                {member[0]}
              </div>
              <span style={{ fontSize: 13, color: "#0f172a" }}>{member}</span>
            </div>
          ),
        )}
      </div>
    );

  if (activeTab === "billing")
    return (
      <div>
        <div
          style={{
            padding: 16,
            backgroundColor: "#f0fdf4",
            borderRadius: 10,
            marginBottom: 16,
            border: "1px solid #bbf7d0",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#166534" }}>Current Plan: {organization.plan}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{organization.mrr}</div>
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Billing history, invoices, and payment method management would appear here.
        </div>
      </div>
    );

  return (
    <div>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>Recent audit events</p>
      {[
        { action: "User invited", actor: "admin@org.com", time: "2 hours ago" },
        { action: "Plan upgraded", actor: "billing@org.com", time: "1 day ago" },
        { action: "SSO configured", actor: "admin@org.com", time: "3 days ago" },
        { action: "API key created", actor: "dev@org.com", time: "1 week ago" },
      ].map((event) => (
        <div
          key={event.action}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{event.action}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{event.actor}</div>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{event.time}</span>
        </div>
      ))}
    </div>
  );
}
