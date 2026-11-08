"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  hrmsService,
  type HrmsAsset,
  type HrmsAssetCondition,
  type HrmsAssetStatus,
  type HrmsAssetType,
  type HrmsEmployee,
} from "@/services/hrms.service";

import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";

const categories: Array<[HrmsAssetType, string]> = [
  ["LAPTOP", "Laptop"], ["PHONE", "Mobile"], ["MONITOR", "Monitor"], ["KEYBOARD", "Peripheral"],
  ["FURNITURE", "Furniture"], ["OTHER", "Other"],
];
const conditions: HrmsAssetCondition[] = ["NEW", "GOOD", "FAIR"];
const statuses: HrmsAssetStatus[] = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "UNFIT"];
type FormValues = { name: string; serialNumber: string; type: HrmsAssetType; customCategory: string; condition: HrmsAssetCondition; status: HrmsAssetStatus; assignedEmployeeId: string };
type FormErrors = Partial<Record<"name" | "serialNumber" | "customCategory" | "assignedEmployeeId", string>>;
type AssetSortField = "name" | "serialNumber" | "condition" | "status";
const emptyForm: FormValues = { name: "", serialNumber: "", type: "LAPTOP", customCategory: "", condition: "GOOD", status: "AVAILABLE", assignedEmployeeId: "" };

function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()); }
function formFor(asset?: HrmsAsset): FormValues {
  return asset ? { name: asset.name, serialNumber: asset.serialNumber, type: asset.type, customCategory: asset.customCategory ?? "", condition: asset.condition, status: asset.status, assignedEmployeeId: asset.assignedEmployeeId ?? "" } : emptyForm;
}

function AssetDrawer({ asset, employees, onClose, onSave }: {
  asset?: HrmsAsset; employees: HrmsEmployee[]; onClose: () => void; onSave: (values: FormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(formFor(asset));
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const change = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "serialNumber" || key === "customCategory" || key === "assignedEmployeeId") {
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
    }
  };
  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const nextFieldErrors: FormErrors = {};
    if (!values.name.trim()) nextFieldErrors.name = "Asset name is required.";
    if (!values.serialNumber.trim()) nextFieldErrors.serialNumber = "Serial number is required.";
    if (values.type === "OTHER" && !values.customCategory.trim()) nextFieldErrors.customCategory = "Custom category is required.";
    if (values.status === "ASSIGNED" && !values.assignedEmployeeId) nextFieldErrors.assignedEmployeeId = "Choose an employee for an assigned asset.";
    if (Object.keys(nextFieldErrors).length > 0) { setFieldErrors(nextFieldErrors); return; }
    if (values.assignedEmployeeId && values.status !== "ASSIGNED") { setError("An asset with an assignee must have Assigned status."); return; }
    setSaving(true); setError("");
    try { await onSave(values); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save the asset."); } finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 bg-text-primary/35" onClick={onClose}>
    <aside role="dialog" aria-modal="true" aria-label={asset ? "Edit asset" : "Add asset"} onClick={(event) => event.stopPropagation()} className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl">
      <form className="flex h-full flex-col" onSubmit={submit}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4"><div><h2 className="font-display text-lg font-bold text-text-primary">{asset ? "Edit asset" : "Add asset"}</h2><p className="mt-1 text-xs text-text-muted">Asset assignment is enforced by the organization policy.</p></div><button type="button" onClick={onClose} className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised"><Icon name="close" /></button></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && <p role="alert" className="rounded-md border border-error bg-surface-raised p-3 text-sm text-error">{error}</p>}
          <label className="block text-sm font-semibold text-text-primary">Asset name <span className="text-error">*</span><input value={values.name} onChange={(event) => change("name", event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "asset-name-error" : undefined} className={`mt-1.5 w-full rounded-md border bg-surface px-3 py-2.5 font-normal outline-none focus:border-brand ${fieldErrors.name ? "border-error" : "border-border"}`} />{fieldErrors.name && <span id="asset-name-error" role="alert" className="mt-1 text-xs font-normal text-error">{fieldErrors.name}</span>}</label>
          <label className="block text-sm font-semibold text-text-primary">Serial number <span className="text-error">*</span><input value={values.serialNumber} onChange={(event) => change("serialNumber", event.target.value)} aria-invalid={Boolean(fieldErrors.serialNumber)} aria-describedby={fieldErrors.serialNumber ? "asset-serial-number-error" : undefined} className={`mt-1.5 w-full rounded-md border bg-surface px-3 py-2.5 font-normal outline-none focus:border-brand ${fieldErrors.serialNumber ? "border-error" : "border-border"}`} />{fieldErrors.serialNumber && <span id="asset-serial-number-error" role="alert" className="mt-1 text-xs font-normal text-error">{fieldErrors.serialNumber}</span>}</label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-text-primary">Category<select value={values.type} onChange={(event) => change("type", event.target.value as HrmsAssetType)} className="mt-1.5 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2.5 font-normal"><>{categories.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</></select></label><label className="text-sm font-semibold text-text-primary">Condition<select value={values.condition} onChange={(event) => change("condition", event.target.value as HrmsAssetCondition)} className="mt-1.5 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2.5 font-normal">{conditions.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label></div>
          {values.type === "OTHER" && <label className="block text-sm font-semibold text-text-primary">Custom category <span className="text-error">*</span><input value={values.customCategory} onChange={(event) => change("customCategory", event.target.value)} aria-invalid={Boolean(fieldErrors.customCategory)} aria-describedby={fieldErrors.customCategory ? "asset-custom-category-error" : undefined} className={`mt-1.5 w-full rounded-md border bg-surface px-3 py-2.5 font-normal outline-none focus:border-brand ${fieldErrors.customCategory ? "border-error" : "border-border"}`} />{fieldErrors.customCategory && <span id="asset-custom-category-error" role="alert" className="mt-1 text-xs font-normal text-error">{fieldErrors.customCategory}</span>}</label>}
          <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-text-primary">Status<select value={values.status} onChange={(event) => change("status", event.target.value as HrmsAssetStatus)} className="mt-1.5 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2.5 font-normal">{statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label><label className="text-sm font-semibold text-text-primary">Assigned to<select value={values.assignedEmployeeId} onChange={(event) => change("assignedEmployeeId", event.target.value)} aria-invalid={Boolean(fieldErrors.assignedEmployeeId)} aria-describedby={fieldErrors.assignedEmployeeId ? "asset-assignee-error" : undefined} className={`mt-1.5 w-full cursor-pointer rounded-md border bg-surface px-3 py-2.5 font-normal ${fieldErrors.assignedEmployeeId ? "border-error" : "border-border"}`}><option value="">Unassigned</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name} · {employee.employeeNumber}</option>)}</select>{fieldErrors.assignedEmployeeId && <span id="asset-assignee-error" role="alert" className="mt-1 block text-xs font-normal text-error">{fieldErrors.assignedEmployeeId}</span>}</label></div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={saving} onClick={() => void submit()}>{saving ? "Saving…" : "Save asset"}</Button></div>
      </form>
    </aside>
  </div>;
}

export function HrmsAssets({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [tab, setTab] = useState<"inventory" | "requests">("inventory");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ type: "", condition: "", status: "" });
  const [sortBy, setSortBy] = useState<AssetSortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [data, setData] = useState<Awaited<ReturnType<typeof hrmsService.assets.list>>>();
  const [employees, setEmployees] = useState<HrmsEmployee[]>([]);
  const [editing, setEditing] = useState<HrmsAsset | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [assets, employeeList] = await Promise.all([hrmsService.assets.list(organizationId, { page, pageSize, search: query || undefined, sortBy, sortOrder, ...filters }), hrmsService.employees.list(organizationId)]);
      setData(assets); setEmployees(employeeList);
    } catch (reason) { onToast(reason instanceof Error ? reason.message : "Unable to load assets."); } finally { setLoading(false); }
  }, [filters, onToast, organizationId, page, pageSize, query, sortBy, sortOrder]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const save = async (values: FormValues) => {
    if (!organizationId) throw new Error("An organization must be selected.");
    const input = { ...values, assignedEmployeeId: values.assignedEmployeeId || undefined, customCategory: values.customCategory || undefined };
    if (editing) await hrmsService.assets.update(organizationId, editing.id, input); else await hrmsService.assets.create(organizationId, input);
    setEditing(undefined); onToast(`Asset ${editing ? "updated" : "created"}.`); await load();
  };
  const remove = async (asset: HrmsAsset) => {
    if (!organizationId || !window.confirm(`Delete ${asset.name}?`)) return;
    try { await hrmsService.assets.remove(organizationId, asset.id); onToast("Asset deleted."); await load(); } catch (reason) { onToast(reason instanceof Error ? reason.message : "Unable to delete asset."); }
  };
  const exportLoaded = () => {
    const rows = [["Asset", "Serial Number", "Assigned To", "Condition", "Status"], ...(data?.items ?? []).map((asset) => [asset.name, asset.serialNumber, asset.assignedEmployee?.user.name ?? "", asset.condition, asset.status])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = "loaded-assets.csv"; link.click(); URL.revokeObjectURL(link.href);
  };
  const changeSort = (field: AssetSortField) => {
    setPage(1);
    setSortOrder((current) => sortBy === field ? (current === "asc" ? "desc" : "asc") : "asc");
    setSortBy(field);
  };
  return <><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1 border-b border-border"><button type="button" onClick={() => setTab("inventory")} className={`cursor-pointer border-b-2 px-3 py-3 text-sm font-semibold ${tab === "inventory" ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>Inventory</button><button type="button" onClick={() => setTab("requests")} className={`cursor-pointer border-b-2 px-3 py-3 text-sm font-semibold ${tab === "requests" ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}>Requests</button></div>{tab === "inventory" && <Button icon="plus" onClick={() => setEditing(null)}>Add asset</Button>}</div>
    {tab === "requests" ? <Card className="p-6"><CardTitle title="Asset requests" subtitle="Requests are not configured for this organization." /><p className="text-sm text-text-secondary">No asset request records are available. Inventory availability is tracked in the Inventory tab.</p></Card> : <><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Total assets", data?.summary.total ?? 0], ["Assigned", data?.summary.assigned ?? 0], ["Available", data?.summary.available ?? 0], ["Maintenance", data?.summary.maintenance ?? 0]].map(([name, value]) => <Card key={String(name)} className="p-5"><p className="text-sm text-text-secondary">{name}</p><p className="mt-3 font-display text-2xl font-bold text-text-primary">{value}</p></Card>)}</div>
    <Card className="mt-5 overflow-hidden"><CardTitle title="Inventory" subtitle={`${data?.total ?? 0} assets`} action={<Button variant="secondary" icon="download" onClick={exportLoaded}>Export loaded assets</Button>} /><div className="flex flex-wrap gap-3 border-b border-border p-4"><label className="relative min-w-56 flex-1"><Icon name="search" size={16} className="absolute left-3 top-2.5 text-text-muted" /><input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} placeholder="Search assets, serials, employees" className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand" /></label>{(["type", "condition", "status"] as const).map((key) => <select key={key} value={filters[key]} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, [key]: event.target.value })); }} className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-secondary"><option value="">All {key}s</option>{(key === "type" ? categories.map(([value]) => value) : key === "condition" ? conditions : statuses).map((value) => <option key={value} value={value}>{label(value)}</option>)}</select>)}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="bg-surface-raised">{([{ label: "Asset", field: "name" }, { label: "Serial Number", field: "serialNumber" }, { label: "Assigned To" }, { label: "Condition", field: "condition" }, { label: "Status", field: "status" }, { label: "Actions" }] as Array<{ label: string; field?: AssetSortField }>).map(({ label: column, field }) => <th key={column} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">{field ? <button type="button" onClick={() => changeSort(field)} className="inline-flex cursor-pointer items-center gap-1 hover:text-text-primary" aria-label={`Sort by ${column}${sortBy === field ? `, currently ${sortOrder === "asc" ? "ascending" : "descending"}` : ""}`}><span>{column}</span><Icon name="sort" size={14} className={sortBy === field ? "text-brand" : ""} /></button> : column}</th>)}</tr></thead><tbody className="divide-y divide-border">{data?.items.map((asset) => <tr key={asset.id} className="hover:bg-surface-raised"><td className="px-5 py-4 text-sm font-semibold text-text-primary">{asset.name}</td><td className="px-5 py-4 text-sm text-text-secondary">{asset.serialNumber}</td><td className="px-5 py-4 text-sm text-text-secondary">{asset.assignedEmployee?.user.name ?? "Unassigned"}</td><td className="px-5 py-4 text-sm text-text-secondary">{label(asset.condition)}</td><td className="px-5 py-4"><Badge tone={asset.status === "ASSIGNED" ? "success" : asset.status === "AVAILABLE" ? "neutral" : "warning"}>{label(asset.status)}</Badge></td><td className="px-5 py-4"><button type="button" onClick={() => setEditing(asset)} aria-label={`Edit ${asset.name}`} className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised hover:text-brand"><Icon name="edit" size={16} /></button><button type="button" onClick={() => void remove(asset)} aria-label={`Delete ${asset.name}`} className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised"><Icon name="delete" size={16} /></button></td></tr>)}</tbody></table>{!loading && !data?.items.length && <p className="p-8 text-center text-sm text-text-muted">No assets match these filters.</p>}{loading && <p className="p-8 text-center text-sm text-text-muted">Loading assets…</p>}</div>
      <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border p-4 text-sm text-text-secondary"><label className="flex items-center gap-2">Rows per page:<select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)); }} className="cursor-pointer border-0 bg-transparent font-semibold text-text-primary outline-none"><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label><span>{data?.total ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.total)} of ${data.total}` : "0-0 of 0"}</span><div className="flex items-center gap-1"><button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"><Icon name="chevron" size={18} className="rotate-180" /></button><button type="button" aria-label="Next page" disabled={!data || page >= data.totalPages} onClick={() => setPage((current) => current + 1)} className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"><Icon name="chevron" size={18} /></button></div></div></Card></>}
    {editing !== undefined && <AssetDrawer asset={editing ?? undefined} employees={employees} onClose={() => setEditing(undefined)} onSave={save} />}
  </>;
}
