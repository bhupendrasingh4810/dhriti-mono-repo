import type { OrganizationTableItem } from "./organization-table";

type OrganizationSuspensionDialogProps = {
  organization: OrganizationTableItem;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function OrganizationSuspensionDialog({ organization, reason, onReasonChange, onClose, onConfirm }: OrganizationSuspensionDialogProps) {
  const isSuspended = organization.status === "Suspended";
  return <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
    <div style={{ backgroundColor: "white", borderRadius: 16, padding: 28, width: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(event) => event.stopPropagation()}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{isSuspended ? "Reactivate" : "Suspend"} Organization</h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>{isSuspended ? `Reactivate "${organization.name}" to restore access.` : `Suspend "${organization.name}" to block all user access.`}</p>
      {!isSuspended && <div style={{ marginBottom: 20 }}><label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Reason (optional)</label><textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} rows={3} placeholder="Describe the reason for suspension..." style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} /></div>}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}><button onClick={onClose} style={cancelButtonStyle}>Cancel</button><button onClick={onConfirm} style={{ padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "white", backgroundColor: isSuspended ? "#036c5f" : "#d97706" }}>{isSuspended ? "Reactivate" : "Suspend"}</button></div>
    </div>
  </div>;
}

const cancelButtonStyle = { padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: 13, color: "#475569", fontWeight: 500 };