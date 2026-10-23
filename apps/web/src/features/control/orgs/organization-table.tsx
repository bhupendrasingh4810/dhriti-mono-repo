import { Icon } from "@/components/shared/icons/icon";
import { Pagination } from "@/components/shared/pagination";
import type { PlatformOrganizationSortField } from "@/services/control.service";

export type OrganizationTableItem = {
  id: string;
  name: string;
  plan: "Free" | "Standard" | "Premium" | "Enterprise";
  seats: string;
  status: "Active" | "Trial" | "Suspended" | "Churned";
  created: string;
  mrr: string;
};

type OrganizationTableProps = {
  items: OrganizationTableItem[];
  selected: Set<string>;
  openMenu: string | null;
  sortBy: PlatformOrganizationSortField;
  sortOrder: "asc" | "desc";
  pagination: { page: number; limit: number; total: number; totalPages: number };
  isLoading: boolean;
  onToggleAll: () => void;
  onToggleSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onView: (id: string) => void;
  onSuspend: (id: string) => void;
  onDelete: (id: string) => void;
  onSort: (field: PlatformOrganizationSortField) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
};

const planColors = {
  Free: { bg: "#f1f5f9", color: "#475569" },
  Standard: { bg: "#dbeafe", color: "#1d4ed8" },
  Premium: { bg: "#ede9fe", color: "#6d28d9" },
  Enterprise: { bg: "#e6f4f2", color: "#036c5f" },
};

const statusColors = {
  Active: { bg: "#dcfce7", color: "#166534" },
  Trial: { bg: "#dbeafe", color: "#1d4ed8" },
  Suspended: { bg: "#fef9c3", color: "#92400e" },
  Churned: { bg: "#fee2e2", color: "#991b1b" },
};

export function OrganizationTable({
  items,
  selected,
  openMenu,
  sortBy,
  sortOrder,
  pagination,
  isLoading,
  onToggleAll,
  onToggleSelect,
  onToggleMenu,
  onView,
  onSuspend,
  onDelete,
  onSort,
  onPageChange,
  onPageSizeChange,
}: OrganizationTableProps) {
  const columns: Array<{ label: string; field?: PlatformOrganizationSortField }> = [
    { label: "Organization", field: "name" },
    { label: "Plan" },
    { label: "Seats", field: "seats" },
    { label: "Status" },
    { label: "Created", field: "createdAt" },
    { label: "MRR" },
    { label: "Actions" },
  ];

  return (
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
            <th style={{ padding: "12px 16px", textAlign: "left" }}>
              <input
                type="checkbox"
                checked={selected.size === items.length && items.length > 0}
                onChange={onToggleAll}
                style={{ cursor: "pointer" }}
              />
            </th>
            {columns.map(({ label, field }) => (
              <th
                key={label}
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
                {field ? (
                  <button
                    type="button"
                    onClick={() => onSort(field)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "inherit",
                      font: "inherit",
                    }}
                  >
                    {label}
                    <Icon
                      name={sortBy !== field ? "arrowUpDown" : sortOrder === "asc" ? "arrowUp" : "arrowDown"}
                      size={14}
                    />
                  </button>
                ) : (
                  label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <OrganizationRow
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              menuOpen={openMenu === item.id}
              onToggleSelect={onToggleSelect}
              onToggleMenu={onToggleMenu}
              onView={onView}
              onSuspend={onSuspend}
              onDelete={onDelete}
            />
          ))}
          {!isLoading && items.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", fontSize: 13, color: "#64748b" }}>
                No matching organizations
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination
        ariaLabel="Organizations pagination"
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

function OrganizationRow({
  item,
  selected,
  menuOpen,
  onToggleSelect,
  onToggleMenu,
  onView,
  onSuspend,
  onDelete,
}: {
  item: OrganizationTableItem;
  selected: boolean;
  menuOpen: boolean;
  onToggleSelect: (id: string) => void;
  onToggleMenu: (id: string) => void;
  onView: (id: string) => void;
  onSuspend: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const initials = item.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const plan = planColors[item.plan];
  const status = statusColors[item.status];
  return (
    <tr style={{ borderTop: "1px solid #f1f5f9", backgroundColor: selected ? "#f0fdf4" : "white" }}>
      <td style={{ padding: "12px 16px" }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          style={{ cursor: "pointer" }}
        />
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: "#e6f4f2",
              color: "#036c5f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <button
            type="button"
            onClick={() => onView(item.id)}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#036c5f",
            }}
          >
            {item.name}
          </button>
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 20,
            backgroundColor: plan.bg,
            color: plan.color,
          }}
        >
          {item.plan}
        </span>
      </td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{item.seats}</td>
      <td style={{ padding: "12px 16px" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 20,
            backgroundColor: status.bg,
            color: status.color,
          }}
        >
          {item.status}
        </span>
      </td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{item.created}</td>
      <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569", fontWeight: 500 }}>{item.mrr}</td>
      <td style={{ padding: "12px 16px", position: "relative" }}>
        <button
          type="button"
          onClick={() => onToggleMenu(item.id)}
          style={{
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            backgroundColor: "white",
            cursor: "pointer",
            fontSize: 13,
            color: "#475569",
          }}
        >
          ...
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              right: 16,
              top: "100%",
              zIndex: 10,
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: 160,
              overflow: "hidden",
            }}
          >
            {[
              ["View Details", onView, "#0f172a"],
              [item.status === "Suspended" ? "Reactivate" : "Suspend", onSuspend, "#d97706"],
              ["Delete", onDelete, "#dc2626"],
            ].map(([label, action, color]) => (
              <button
                key={label as string}
                type="button"
                onClick={() => (action as (id: string) => void)(item.id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 14px",
                  border: "none",
                  backgroundColor: "white",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  color: color as string,
                }}
              >
                {label as string}
              </button>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
