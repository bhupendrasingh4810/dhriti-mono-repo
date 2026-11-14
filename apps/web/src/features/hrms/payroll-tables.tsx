"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "./components/ui-primitives";

export type PayrollColumn<T> = {
  key: string;
  label: string;
  value: (row: T) => string;
  render?: (row: T) => ReactNode;
};

/** Sort/filter the full API result before pagination; the scroll region never contains the footer. */
export function PayrollTable<T>({
  label,
  rows,
  columns,
  rowKey,
  actions,
  toolbarActions = true,
  filtersVisible,
}: {
  label: string;
  rows: T[];
  columns: PayrollColumn<T>[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  toolbarActions?: boolean;
  filtersVisible?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.key);
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const filtersOpen = filtersVisible ?? showFilters;
  const [filterKey, setFilterKey] = useState(columns[0]?.key ?? "");
  const [filterValue, setFilterValue] = useState("");
  const sortColumn = columns.find((column) => column.key === sortKey);
  const filterColumn = columns.find((column) => column.key === filterKey);
  const filtered = rows.filter(
    (row) =>
      columns.some((column) => column.value(row).toLowerCase().includes(query.toLowerCase())) &&
      (!filtersOpen ||
        !filterValue ||
        Boolean(filterColumn?.value(row).toLowerCase().includes(filterValue.toLowerCase()))),
  );
  const sorted = [...filtered].sort((a, b) => {
    const left = sortColumn?.value(a) ?? "";
    const right = sortColumn?.value(b) ?? "";
    const result =
      /^-?\d+(?:\.\d+)?$/.test(left) && /^-?\d+(?:\.\d+)?$/.test(right)
        ? Number(left) - Number(right)
        : left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
    return direction === "asc" ? result : -result;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  return (
    <div className="mt-4 w-full min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
        <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <input
            type="search"
            aria-label={`Search ${label}`}
            placeholder="Search / filter records..."
            className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none sm:w-64"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          {toolbarActions && (
            <>
              <Button
                variant="secondary"
                icon="filter"
                onClick={() => {
                  setShowFilters((current) => !current);
                  setFilterValue("");
                  setPage(1);
                }}
              >
                Filters
              </Button>
              <Button
                variant="secondary"
                icon="download"
                disabled={!sorted.length}
                onClick={() =>
                  downloadPayrollCsv(`${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, [
                    columns.map((column) => column.label),
                    ...sorted.map((row) => columns.map((column) => column.value(row))),
                  ])
                }
              >
                Export
              </Button>
            </>
          )}
        </div>
      </div>
      {filtersOpen && (
        <div
          role="group"
          aria-label={`${label} filters`}
          className="flex flex-wrap gap-2 border-b border-border bg-surface-raised p-3"
        >
          <select
            aria-label="Filter column"
            value={filterKey}
            onChange={(event) => {
              setFilterKey(event.target.value);
              setPage(1);
            }}
            className="cursor-pointer rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {columns.map((column) => (
              <option key={column.key} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          <input
            aria-label="Filter value"
            placeholder="Contains..."
            value={filterValue}
            onChange={(event) => {
              setFilterValue(event.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary"
          />
          <Button
            variant="ghost"
            onClick={() => {
              setFilterValue("");
              setQuery("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
      <div className="max-h-96 overflow-auto" role="region" aria-label={`${label} table`} tabIndex={0}>
        <table aria-label={label} className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-raised text-xs text-text-secondary">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3"
                  aria-sort={sortKey === column.key ? (direction === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1"
                    onClick={() => {
                      setSortKey(column.key);
                      setDirection(sortKey === column.key && direction === "asc" ? "desc" : "asc");
                      setPage(1);
                    }}
                  >
                    {column.label}
                    {sortKey !== column.key ? (
                      <ArrowUpDown className="size-3" aria-hidden="true" />
                    ) : direction === "asc" ? (
                      <ArrowUp className="size-3" aria-hidden="true" />
                    ) : (
                      <ArrowDown className="size-3" aria-hidden="true" />
                    )}
                  </button>
                </th>
              ))}
              {actions && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row) => (
              <tr key={rowKey(row)} className="hover:bg-surface-raised/50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-text-secondary">
                    {column.render ? column.render(row) : column.value(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td className="p-6 text-center text-text-secondary" colSpan={columns.length + (actions ? 1 : 0)}>
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={sorted.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setPage(1);
        }}
        ariaLabel={`${label} pagination`}
      />
    </div>
  );
}

export function downloadPayrollCsv(name: string, rows: string[][]) {
  // Spreadsheet cells beginning with formula markers must remain text.
  const encode = (value: string) =>
    `"${(/^\s*[=+\-@]|^[\t\r\n]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`;
  const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(encode).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
