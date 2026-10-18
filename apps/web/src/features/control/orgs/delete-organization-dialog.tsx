import type { OrganizationTableItem } from "./organization-table";

type DeleteOrganizationDialogProps = {
  organization: OrganizationTableItem;
  confirmation: string;
  onConfirmationChange: (confirmation: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteOrganizationDialog({ organization, confirmation, onConfirmationChange, onClose, onConfirm }: DeleteOrganizationDialogProps) {
  const isConfirmed = confirmation === "DELETE";
  return <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ backgroundColor: "white", borderRadius: 16, padding: 28, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg></div><h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>Delete Organization</h2></div>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>This will permanently delete <strong>{organization.name}</strong> and all associated data. This action cannot be undone.</p>
      <div style={{ marginBottom: 20 }}><label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Type <strong>DELETE</strong> to confirm</label><input type="text" value={confirmation} onChange={(event) => onConfirmationChange(event.target.value)} placeholder="DELETE" style={{ width: "100%", padding: "9px 12px", border: `1px solid ${isConfirmed ? "#dc2626" : "#e2e8f0"}`, borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} /></div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button onClick={onClose} style={cancelButtonStyle}>Cancel</button><button onClick={onConfirm} disabled={!isConfirmed} style={{ padding: "9px 18px", borderRadius: 8, border: "none", backgroundColor: isConfirmed ? "#dc2626" : "#fca5a5", color: "white", cursor: isConfirmed ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600 }}>Delete Organization</button></div>
    </div>
  </div>;
}

const cancelButtonStyle = { padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 500 };