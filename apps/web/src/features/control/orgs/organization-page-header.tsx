type OrganizationPageHeaderProps = {
  total: number;
  onAdd: () => void;
};

export function OrganizationPageHeader({ total, onAdd }: OrganizationPageHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Organizations</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{total} total organizations</p>
      </div>
      <button
        type="button"
        onClick={onAdd}
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
        Add Organization
      </button>
    </div>
  );
}