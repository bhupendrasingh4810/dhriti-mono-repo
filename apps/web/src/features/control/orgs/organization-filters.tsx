type Plan = "Free" | "Standard" | "Premium" | "Enterprise";
type Status = "Active" | "Trial" | "Suspended" | "Churned";

type OrganizationFiltersProps = {
  search: string;
  plan: Plan | "All";
  status: Status | "All";
  onSearchChange: (value: string) => void;
  onPlanChange: (value: Plan | "All") => void;
  onStatusChange: (value: Status | "All") => void;
};

export function OrganizationFilters({
  search,
  plan,
  status,
  onSearchChange,
  onPlanChange,
  onStatusChange,
}: OrganizationFiltersProps) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      <div style={{ flex: 1, position: "relative" }}>
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
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
      <select
        value={plan}
        onChange={(event) => onPlanChange(event.target.value as Plan | "All")}
        style={{
          padding: "9px 12px",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          fontSize: 13,
          cursor: "pointer",
          backgroundColor: "white",
        }}
      >
        <option value="All">All Plans</option>
        {(["Free", "Standard", "Premium", "Enterprise"] as Plan[]).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value as Status | "All")}
        style={{
          padding: "9px 12px",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          fontSize: 13,
          cursor: "pointer",
          backgroundColor: "white",
        }}
      >
        <option value="All">All Status</option>
        {(["Active", "Trial", "Suspended", "Churned"] as Status[]).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
