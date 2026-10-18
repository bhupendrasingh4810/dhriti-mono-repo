import { Icon } from "@/components/shared/icons/icon";
import { Pagination } from "@/components/shared/pagination";
import type { ControlEntitlementDefinition, EntitlementSortField } from "@/services/control.service";

type EntitlementTableProps = {
  items: ControlEntitlementDefinition[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  sortBy: EntitlementSortField;
  sortOrder: "asc" | "desc";
  onView: (item: ControlEntitlementDefinition) => void;
  onEdit: (item: ControlEntitlementDefinition) => void;
  onDelete: (item: ControlEntitlementDefinition) => void;
  onPageChange: (page: number) => void;
  onSort: (field: EntitlementSortField) => void;
  onPageSizeChange: (limit: number) => void;
};

export function EntitlementTable({
  items,
  pagination,
  sortBy,
  sortOrder,
  onView,
  onEdit,
  onDelete,
  onPageChange,
  onSort,
  onPageSizeChange,
}: EntitlementTableProps) {
  const headings: Array<{ label: string; field?: EntitlementSortField }> = [
    { label: "Entitlement", field: "name" },
    { label: "Product", field: "productKey" },
    { label: "Type", field: "kind" },
    { label: "Status" },
    { label: "Plans" },
    { label: "Active orgs" },
    { label: "Overrides" },
    { label: "Actions" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              {headings.map(({ label, field }) => (
                <th key={label} className="px-4 py-3 font-bold">
                  {field ? (
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1 text-left hover:text-brand"
                      onClick={() => onSort(field)}
                    >
                      {label}
                      <span className={sortBy === field ? "text-brand" : "text-slate-400"}>
                        <Icon
                          name={sortBy !== field ? "arrowUpDown" : sortOrder === "asc" ? "arrowUp" : "arrowDown"}
                          size={14}
                        />
                      </span>
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
              <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-4 py-3.5">
                  <button type="button" className="cursor-pointer text-left" onClick={() => onView(item)}>
                    <span className="block font-semibold text-brand hover:underline">{item.name}</span>
                    <code className="mt-1 block font-mono text-[11px] text-slate-500">{item.key}</code>
                  </button>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-700">{item.productKey ?? "-"}</td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {item.kind === "FEATURE" ? "Feature flag" : "Numeric limit"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{item._count.planEntitlements}</td>
                <td className="px-4 py-3.5 text-slate-600">-</td>
                <td className="px-4 py-3.5 text-slate-600">{item._count.overrides}</td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`View ${item.name}`}
                      className="cursor-pointer rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-brand"
                      title="View entitlement"
                      onClick={() => onView(item)}
                    >
                      <Icon name="view" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Edit ${item.name}`}
                      className="cursor-pointer rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-brand"
                      title="Edit entitlement"
                      onClick={() => onEdit(item)}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${item.name}`}
                      className="cursor-pointer rounded p-1 text-red-700 hover:bg-red-50"
                      title="Delete entitlement"
                      onClick={() => onDelete(item)}
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                  No matching records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100">
        <Pagination
          ariaLabel="Entitlements pagination"
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </div>
  );
}