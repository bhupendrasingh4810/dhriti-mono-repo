import { Icon } from "@/components/shared/icons/icon";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  ariaLabel?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  ariaLabel = "Pagination",
}: PaginationProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-wrap items-center justify-end gap-5 px-4 py-3 text-xs text-slate-600"
    >
      <label className="flex items-center gap-2">
        Rows per page:
        <select
          aria-label="Rows per page"
          className="cursor-pointer border-0 bg-transparent py-1 text-xs text-slate-900 focus:outline-none"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <span>
        {firstItem}-{lastItem} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous page"
          className="cursor-pointer rounded p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page <= 1}
          title="Previous page"
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="chevronLeft" />
        </button>
        <button
          aria-label="Next page"
          className="cursor-pointer rounded p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= totalPages}
          title="Next page"
          onClick={() => onPageChange(page + 1)}
        >
          <Icon name="chevronRight" />
        </button>
      </div>
    </nav>
  );
}
