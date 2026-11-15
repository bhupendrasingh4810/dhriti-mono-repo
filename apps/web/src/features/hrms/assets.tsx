"use client";

import { useEffect, useState } from "react";
import { DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import type { AssetCategory } from "@dhriti/types";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { hrmsService, type HrmsAsset, type HrmsAssetPage } from "@/services/hrms.service";
import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";
import { Pagination } from "./attendance-regularization";
import { AssetEditor, assetTypes, assetConditions, assetStatuses, assetLabel } from "./asset-editor";
import { AssetCustodyDialog, AssetHistoryDialog } from "./asset-custody";
import { AssetEmployeePicker } from "./asset-employee-picker";
import { AssetActionForm } from "./asset-action-form";
import { hrmsAssetsService, type AssetRequest } from "@/services/hrms-assets.service";
import { hrmsAssetReplacementSchema } from "@dhriti/validation";
import { AssetOperations, AssetRequestDetails, AssetTools } from "./asset-operations";

const errorText = (reason: unknown) => (reason instanceof Error ? reason.message : "Unable to load assets.");
type Tab = "inventory" | "categories" | "clearance" | "operations";
type Sort = "name" | "serialNumber" | "condition" | "status";

export function HrmsAssets({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const { can, loading } = usePermissions();
  if (loading) return <p role="status">Checking asset access…</p>;
  if (!can("hrms.asset.manage"))
    return (
      <p className="p-4 text-text-secondary">
        Asset management is restricted. Your assigned equipment and replacement requests are available on your HRMS
        dashboard.
      </p>
    );
  const organizationId = user?.organization?.id;
  return organizationId ? (
    <AssetWorkspace key={organizationId} organizationId={organizationId} onToast={onToast} />
  ) : (
    <p role="status" className="p-4 text-text-muted">
      Select an organization.
    </p>
  );
}
function AssetWorkspace({ organizationId, onToast }: { organizationId: string; onToast: (message: string) => void }) {
  const { can, loading: accessLoading } = usePermissions();
  const canRead = can("hrms.asset.read");
  const canManage = can("hrms.asset.manage");
  const [selectedTab, setTab] = useState<Tab | null>(null);
  const tab = selectedTab ?? "inventory";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ type: "", condition: "", status: "", archived: "false" });
  const [sortBy, setSortBy] = useState<Sort>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const key = JSON.stringify([organizationId, page, pageSize, query, filters, sortBy, sortOrder, refresh]);
  const [result, setResult] = useState<{
    key: string;
    data?: HrmsAssetPage;
    categories?: AssetCategory[];
    error?: string;
  } | null>(null);
  const current = result?.key === key ? result : null;
  const data = result?.data;
  const categories = result?.categories ?? [];
  const [editing, setEditing] = useState<{ asset: HrmsAsset | null } | null>(null);
  const [custody, setCustody] = useState<{ asset: HrmsAsset; action: "ISSUE" | "RETURN" } | null>(null);
  const [history, setHistory] = useState<HrmsAsset | null>(null);
  const [toolsId, setToolsId] = useState<string | null>(null);
  const toolsAsset = data?.items.find((asset) => asset.id === toolsId);
  const [archive, setArchive] = useState<HrmsAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!canRead || (tab !== "inventory" && tab !== "categories")) return;
    let active = true;
    const timer = window.setTimeout(() => {
      Promise.all([
        hrmsService.assets.list(organizationId, {
          page,
          pageSize,
          search: query || undefined,
          sortBy,
          sortOrder,
          ...filters,
        }),
        hrmsService.assets.categories(organizationId),
      ])
        .then(([data, categories]) => {
          if (active) setResult({ key, data, categories });
        })
        .catch((reason: unknown) => {
          if (active) setResult({ key, error: errorText(reason) });
        });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [organizationId, page, pageSize, query, filters, sortBy, sortOrder, key, tab, canRead]);
  const done = (message: string) => {
    setEditing(null);
    setCustody(null);
    setRefresh((value) => value + 1);
    onToast(message);
  };
  const exportAssets = async () => {
    setBusy(true);
    setError("");
    try {
      const { csv, count } = await hrmsService.assets.export(organizationId, {
        search: query || undefined,
        ...filters,
      });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "asset-register.csv";
      link.click();
      URL.revokeObjectURL(url);
      onToast(`Exported ${count} assets.`);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  const archiveAsset = async () => {
    if (!archive) return;
    setBusy(true);
    setError("");
    try {
      await hrmsService.assets.remove(organizationId, archive.id, archive.revision);
      setArchive(null);
      setRefresh((value) => value + 1);
      onToast("Asset archived; history retained.");
    } catch (reason) {
      setArchive(null);
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  const sort = (field: Sort) => {
    setPage(1);
    setSortBy(field);
    setSortOrder(sortBy === field && sortOrder === "asc" ? "desc" : "asc");
  };
  if (accessLoading) return <p role="status">Checking asset access…</p>;
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-text-primary">Assets</h1>
        <p className="mt-1 text-sm text-text-secondary">Equipment inventory, employee custody and verified returns.</p>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Asset sections" className="flex flex-wrap gap-2">
          {(
            [
              { value: "inventory", label: "Inventory", visible: canRead },
              { value: "categories", label: "Categories", visible: canRead },
              { value: "clearance", label: "Asset clearance", visible: canRead },
              { value: "operations", label: "Operations", visible: canManage },
            ] as const
          )
            .filter((entry) => entry.visible)
            .map((entry) => (
              <button
                key={entry.value}
                type="button"
                aria-current={tab === entry.value ? "page" : undefined}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm font-semibold ${tab === entry.value ? "bg-brand-muted text-brand" : "text-text-secondary hover:bg-surface-raised"}`}
                onClick={() => setTab(entry.value)}
              >
                {entry.label}
              </button>
            ))}
        </nav>
        {tab === "inventory" && canManage && (
          <Button icon="plus" onClick={() => setEditing({ asset: null })} disabled={!result?.categories}>
            Add asset
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {!current && (tab === "inventory" || tab === "categories") && data && (
        <p role="status" className="text-xs text-text-muted">
          Refreshing inventory…
        </p>
      )}
      {(tab === "inventory" || tab === "categories") && canRead && (
        <>
          {current?.error ? (
            <div>
              <p role="alert" className="text-error">
                {current.error}
              </p>
              <Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}>
                Retry inventory
              </Button>
            </div>
          ) : !data ? (
            <p role="status" className="text-sm text-text-muted">
              Loading inventory…
            </p>
          ) : tab === "categories" ? (
            <AssetCategories
              organizationId={organizationId}
              categories={categories}
              canManage={canManage}
              onDone={() => setRefresh((value) => value + 1)}
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["Active inventory", data.summary.total],
                    ["Assigned", data.summary.assigned],
                    ["Available", data.summary.available],
                    ["Maintenance", data.summary.maintenance],
                  ] as const
                ).map(([label, count]) => (
                  <Card key={label} className="p-4">
                    <p className="text-sm text-text-secondary">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-text-primary">{count}</p>
                  </Card>
                ))}
              </div>
              <Card className="overflow-hidden">
                <CardTitle
                  title="Asset register"
                  subtitle={`${data.total} matching assets`}
                  action={
                    <Button variant="secondary" icon="download" disabled={busy} onClick={() => void exportAssets()}>
                      Export all matches
                    </Button>
                  }
                />
                <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
                  <DhritiTextField
                    label="Search inventory"
                    value={query}
                    onChange={(value) => {
                      setQuery(value);
                      setPage(1);
                    }}
                  />
                  {(["type", "condition", "status", "archived"] as const).map((field) => (
                    <DhritiSelectMenu
                      key={field}
                      label={field === "archived" ? "Inventory view" : assetLabel(field)}
                      value={filters[field]}
                      options={
                        field === "archived"
                          ? [
                              { value: "false", label: "Active inventory" },
                              { value: "true", label: "Archived" },
                            ]
                          : [
                              { value: "", label: `All ${field}s` },
                              ...(field === "type"
                                ? assetTypes
                                : field === "condition"
                                  ? assetConditions
                                  : assetStatuses
                              ).map((value) => ({ value, label: assetLabel(value) })),
                            ]
                      }
                      open={open === field}
                      onOpenChange={(shown) => setOpen(shown ? field : null)}
                      onChange={(value) => {
                        setFilters((current) => ({ ...current, [field]: value ?? "" }));
                        setPage(1);
                      }}
                    />
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-raised text-xs text-text-muted">
                      <tr>
                        {(
                          [
                            { label: "Asset", field: "name" },
                            { label: "Serial", field: "serialNumber" },
                            { label: "Holder" },
                            { label: "Condition", field: "condition" },
                            { label: "Status", field: "status" },
                            { label: "Actions" },
                          ] as { label: string; field?: Sort }[]
                        ).map(({ label, field }) => (
                          <th
                            key={label}
                            className="px-4 py-3"
                            aria-sort={
                              field && sortBy === field ? (sortOrder === "asc" ? "ascending" : "descending") : undefined
                            }
                          >
                            {field ? (
                              <button
                                type="button"
                                onClick={() => sort(field)}
                                className="inline-flex cursor-pointer items-center gap-1"
                                aria-label={`Sort by ${label}`}
                              >
                                {label}
                                <Icon name="sort" size={14} />
                              </button>
                            ) : (
                              label
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.items.map((asset) => (
                        <tr key={asset.id} className="text-text-primary">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{asset.name}</p>
                            <p className="text-xs text-text-muted">
                              {asset.assetTag} ·{" "}
                              {asset.category?.name ?? asset.customCategory ?? assetLabel(asset.type)}
                            </p>
                          </td>
                          <td className="px-4 py-3">{asset.serialNumber ?? "Not recorded"}</td>
                          <td className="px-4 py-3">
                            {asset.assignedEmployee?.user.name ?? "Unassigned"}
                            {asset.assignedEmployee && (
                              <p className="text-xs text-text-muted">
                                {asset.acknowledgedAt ? "Acknowledged" : "Awaiting acknowledgement"}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">{assetLabel(asset.condition)}</td>
                          <td className="px-4 py-3">
                            <Badge
                              tone={
                                asset.status === "ASSIGNED"
                                  ? "success"
                                  : asset.status === "AVAILABLE"
                                    ? "neutral"
                                    : "warning"
                              }
                            >
                              {asset.archivedAt ? "Archived" : assetLabel(asset.status)}
                            </Badge>
                            {asset.expectedReturnDate && (
                              <p className="mt-1 text-xs text-text-muted">
                                Due {asset.expectedReturnDate.slice(0, 10)}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setHistory(asset)}
                                aria-label={`History for ${asset.assetTag}`}
                                className="cursor-pointer rounded-md p-2 text-brand"
                              >
                                <Icon name="file" size={16} />
                              </button>
                              {canManage && !asset.archivedAt && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setToolsId(asset.id)}
                                    aria-label={`Operations for ${asset.assetTag}`}
                                    className="cursor-pointer rounded-md p-2 text-brand"
                                  >
                                    <Icon name="settings" size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditing({ asset })}
                                    aria-label={`Edit ${asset.assetTag}`}
                                    className="cursor-pointer rounded-md p-2 text-brand"
                                  >
                                    <Icon name="edit" size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setArchive(asset)}
                                    aria-label={`Archive ${asset.assetTag}`}
                                    disabled={!!asset.assignedEmployeeId}
                                    className="cursor-pointer rounded-md p-2 text-error disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Icon name="delete" size={16} />
                                  </button>
                                  {(asset.status === "AVAILABLE" || asset.status === "ASSIGNED") && (
                                    <Button
                                      variant="secondary"
                                      onClick={() =>
                                        setCustody({ asset, action: asset.status === "ASSIGNED" ? "RETURN" : "ISSUE" })
                                      }
                                    >
                                      {asset.status === "ASSIGNED" ? "Return" : "Issue"}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!data.items.length && (
                    <p className="p-6 text-center text-text-muted">No assets match these filters.</p>
                  )}
                </div>
                <Pagination
                  pageSize={pageSize}
                  onPageSize={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                  range={`${data.total ? (page - 1) * pageSize + 1 : 0}–${Math.min(page * pageSize, data.total)} of ${data.total}`}
                  canPrev={page > 1}
                  canNext={page < data.totalPages}
                  onPrev={() => setPage((value) => value - 1)}
                  onNext={() => setPage((value) => value + 1)}
                />
              </Card>
            </>
          )}
        </>
      )}
      {tab === "clearance" && canRead && <AssetClearance organizationId={organizationId} />}
      {tab === "operations" && canManage && <AssetOperations organizationId={organizationId} />}
      {toolsAsset && (
        <AssetTools
          organizationId={organizationId}
          asset={toolsAsset}
          onClose={() => setToolsId(null)}
          onChanged={() => setRefresh((value) => value + 1)}
        />
      )}
      {editing && (
        <AssetEditor
          organizationId={organizationId}
          asset={editing.asset}
          categories={categories}
          onClose={() => setEditing(null)}
          onDone={() => done("Asset saved.")}
        />
      )}
      {custody && (
        <AssetCustodyDialog
          organizationId={organizationId}
          asset={custody.asset}
          action={custody.action}
          onClose={() => setCustody(null)}
          onDone={() => done("Asset custody updated.")}
        />
      )}
      {history && (
        <AssetHistoryDialog
          key={history.id}
          organizationId={organizationId}
          asset={history}
          onClose={() => setHistory(null)}
        />
      )}
      <ConfirmationDialog
        open={!!archive}
        title="Archive asset?"
        description="This removes the asset from active inventory and preserves its records and custody history."
        confirmLabel={busy ? "Archiving…" : "Archive"}
        onCancel={() => {
          if (!busy) setArchive(null);
        }}
        onConfirm={() => {
          if (!busy) void archiveAsset();
        }}
      />
    </div>
  );
}

function AssetCategories({
  organizationId,
  categories,
  canManage,
  onDone,
}: {
  organizationId: string;
  categories: AssetCategory[];
  canManage: boolean;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async (input: { name: string; isActive?: boolean }, id?: string) => {
    if (!id || id === editingId) setAttempted(true);
    if (!input.name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await hrmsService.assets.saveCategory(organizationId, input, id);
      if (!id || id === editingId) {
        setName("");
        setEditingId(null);
        setAttempted(false);
      }
      onDone();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-semibold text-text-primary">Asset categories</h2>
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {canManage && (
        <div className="flex flex-wrap items-end gap-3">
          <DhritiTextField
            label="Category name"
            required
            value={name}
            onChange={setName}
            error={attempted && !name.trim() ? "Category name is required." : undefined}
            disabled={busy}
            maxLength={100}
          />
          <Button disabled={busy} onClick={() => void save({ name }, editingId ?? undefined)}>
            {editingId ? "Save category" : "Add category"}
          </Button>
          {editingId && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setEditingId(null);
                setName("");
                setAttempted(false);
              }}
            >
              Cancel edit
            </Button>
          )}
        </div>
      )}
      <ul className="divide-y divide-border">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between gap-3 py-3 text-sm text-text-primary">
            <span>
              {category.name} · {category.isActive ? "Active" : "Inactive"}
            </span>
            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Rename ${category.name}`}
                  className="cursor-pointer rounded-md p-2 text-brand"
                  onClick={() => {
                    setEditingId(category.id);
                    setName(category.name);
                    setAttempted(false);
                  }}
                >
                  <Icon name="edit" size={16} />
                </button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void save({ name: category.name, isActive: !category.isActive }, category.id)}
                >
                  {category.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!categories.length && (
        <p className="text-sm text-text-muted">No custom categories yet. Existing asset types remain available.</p>
      )}
    </Card>
  );
}

/** Fetch every page internally: dashboard cards must not truncate custody or show table pagination. */
async function loadAssetCardPages<T>(load: (page: number) => Promise<{ items: T[]; total: number }>) {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    const next = await load(page);
    if (!next.items.length) throw new Error("Assets changed while loading. Please retry.");
    items.push(...next.items);
  }
  return items;
}

export function MyAssets({ organizationId }: { organizationId: string }) {
  const [replacement, setReplacement] = useState<{ id: string; name: string; revision: number } | null>(null);
  const [retry, setRetry] = useState(0);
  const key = `${organizationId}:${retry}`;
  const [result, setResult] = useState<{
    key: string;
    data?: Awaited<ReturnType<typeof hrmsService.assets.mine>>["items"];
    error?: string;
  } | null>(null);
  const [requests, setRequests] = useState<{ key: string; data?: AssetRequest[]; error?: string } | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const current = result?.key === key ? result : null;
  const currentRequests = requests?.key === key ? requests : null;
  const refresh = () => setRetry((value) => value + 1);
  // Requests arrive newest first. Show one current status per owned asset, not a second request table.
  const ownRequests = new Map<string, AssetRequest>();
  for (const request of currentRequests?.data ?? []) {
    if (request.isOwn && !ownRequests.has(request.assetId)) ownRequests.set(request.assetId, request);
  }
  const reviews = (currentRequests?.data ?? []).filter(
    (request) => !request.isOwn && (request.canDecide || request.canFulfil),
  );
  const awaitingReplacement = [...ownRequests.values()].filter(
    (request) =>
      ["PENDING", "APPROVED"].includes(request.status) &&
      current?.data &&
      !current.data.some((asset) => asset.id === request.assetId),
  );
  const details = currentRequests?.data?.find((request) => request.id === detailsId);
  const [acknowledging, setAcknowledging] = useState<{ id: string; name: string; revision: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    loadAssetCardPages((page) => hrmsService.assets.mine(organizationId, page, 100))
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch((reason: unknown) => {
        if (active) setResult({ key, error: errorText(reason) });
      });
    loadAssetCardPages((page) => hrmsAssetsService.requests(organizationId, page, 100, "dashboard"))
      .then((data) => {
        if (active) setRequests({ key, data });
      })
      .catch((reason: unknown) => {
        if (active) setRequests({ key, error: errorText(reason) });
      });
    return () => {
      active = false;
    };
  }, [organizationId, key]);
  const acknowledge = async () => {
    if (!acknowledging || busy) return;
    setBusy(true);
    setError("");
    try {
      await hrmsService.assets.acknowledge(organizationId, acknowledging.id, acknowledging.revision);
      setAcknowledging(null);
      setRetry((value) => value + 1);
    } catch (reason) {
      setAcknowledging(null);
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="overflow-hidden">
      <CardTitle title="My assets" subtitle="Assigned equipment & replacement requests" />
      <div className="divide-y divide-border">
        {error && (
          <p role="alert" className="px-5 py-3 text-sm text-error">
            {error}
          </p>
        )}
        {current?.error ? (
          <div className="space-y-2 px-5 py-3">
            <p role="alert" className="text-error">
              {current.error}
            </p>
            <Button variant="secondary" onClick={refresh}>
              Retry my assets
            </Button>
          </div>
        ) : !current?.data ? (
          <p role="status" className="px-5 py-3 text-sm text-text-muted">
            Loading your assets…
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {current.data.map((asset) => {
                const request = ownRequests.get(asset.id);
                const openRequest = request && ["PENDING", "APPROVED"].includes(request.status);
                return (
                  <li key={asset.id} className="flex items-start gap-3 px-5 py-3 text-sm text-text-primary">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
                      <Icon name="laptop" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{asset.name}</p>
                      <p className="break-all text-xs text-text-muted">
                        {asset.serialNumber ?? asset.assetTag} · {assetLabel(asset.condition)}
                      </p>
                      {asset.expectedReturnDate && <p>Expected return: {asset.expectedReturnDate.slice(0, 10)}</p>}
                      <p className="mt-1 text-xs text-text-muted">
                        {asset.acknowledgedAt
                          ? `Acknowledged ${asset.acknowledgedAt.slice(0, 10)}`
                          : "Receipt not acknowledged"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {request && (
                          <button
                            type="button"
                            className="cursor-pointer text-xs font-semibold text-brand hover:underline"
                            onClick={() => setDetailsId(request.id)}
                          >
                            {openRequest
                              ? "Replacement requested"
                              : `Replacement ${assetLabel(request.status).toLowerCase()}`}
                          </button>
                        )}
                        {!openRequest && currentRequests?.data && (
                          <button
                            type="button"
                            disabled={busy}
                            className="cursor-pointer text-xs font-semibold text-brand hover:underline disabled:cursor-not-allowed"
                            onClick={() => setReplacement(asset)}
                          >
                            Request replacement
                          </button>
                        )}
                        {!asset.acknowledgedAt && (
                          <button
                            type="button"
                            disabled={busy}
                            className="cursor-pointer text-xs font-semibold text-brand hover:underline disabled:cursor-not-allowed"
                            onClick={() => setAcknowledging(asset)}
                          >
                            Acknowledge receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {!current.data.length && (
              <p className="px-5 py-3 text-sm text-text-muted">No assets currently assigned to you.</p>
            )}
          </>
        )}
        {currentRequests?.error ? (
          <div className="space-y-2 px-5 py-3">
            <p role="alert" className="text-sm text-error">
              {currentRequests.error}
            </p>
            <Button variant="secondary" onClick={refresh}>
              Retry replacement requests
            </Button>
          </div>
        ) : !currentRequests?.data ? (
          <p role="status" className="px-5 py-3 text-xs text-text-muted">
            Loading replacement requests…
          </p>
        ) : null}
        {awaitingReplacement.map((request) => (
          <div key={request.id} className="px-5 py-3 text-sm">
            <p className="font-semibold text-text-primary">{request.asset.name}</p>
            <p className="text-xs text-text-muted">Original equipment returned · awaiting replacement</p>
            <button
              type="button"
              className="mt-2 cursor-pointer text-xs font-semibold text-brand hover:underline"
              onClick={() => setDetailsId(request.id)}
            >
              Replacement requested
            </button>
          </div>
        ))}
        {!!reviews.length && (
          <div>
            <h3 className="px-5 py-3 text-xs font-semibold text-text-secondary">Replacement approvals</h3>
            <ul className="divide-y divide-border">
              {reviews.map((request) => (
                <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-text-primary">
                      {request.requestedFor?.user.name ?? "Employee replacement"}
                    </p>
                    <p className="break-words text-xs text-text-muted">
                      {request.asset.name} · {assetLabel(request.status)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-xs font-semibold text-brand hover:underline"
                    onClick={() => setDetailsId(request.id)}
                  >
                    {request.canFulfil ? "Send new asset" : "Review request"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {details && (
        <AssetRequestDetails
          key={details.id}
          organizationId={organizationId}
          request={details}
          onClose={() => setDetailsId(null)}
          onChanged={refresh}
        />
      )}
      {replacement && (
        <AssetActionForm
          title={`Request replacement · ${replacement.name}`}
          primaryLabel="Submit request"
          fields={[{ key: "reason", label: "Reason", required: true }]}
          onClose={() => setReplacement(null)}
          onSubmit={async ({ reason }) => {
            await hrmsAssetsService.requestReplacement(
              organizationId,
              hrmsAssetReplacementSchema.parse({ assetId: replacement.id, revision: replacement.revision, reason }),
            );
            setRetry((value) => value + 1);
          }}
        />
      )}
      <ConfirmationDialog
        open={!!acknowledging}
        title="Acknowledge asset receipt?"
        description={`Confirm you received ${acknowledging?.name ?? "this asset"} and agree with the recorded issue condition. Contact the asset manager if details are incorrect.`}
        confirmLabel="Acknowledge"
        onCancel={() => {
          if (!busy) setAcknowledging(null);
        }}
        onConfirm={() => void acknowledge()}
      />
    </Card>
  );
}

function AssetClearance({ organizationId }: { organizationId: string }) {
  const { can } = usePermissions();
  const [skip, setSkip] = useState(false);
  const [employee, setEmployee] = useState<{ id: string; label: string } | null>(null);
  const [result, setResult] = useState<{
    employeeId: string;
    data?: Awaited<ReturnType<typeof hrmsService.assets.clearance>>;
    error?: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const current = result?.employeeId === `${employee?.id}:${retry}` ? result : null;
  useEffect(() => {
    if (!employee) return;
    let active = true;
    const employeeId = `${employee.id}:${retry}`;
    hrmsService.assets
      .clearance(organizationId, employee.id)
      .then((data) => {
        if (active) setResult({ employeeId, data });
      })
      .catch((reason: unknown) => {
        if (active) setResult({ employeeId, error: errorText(reason) });
      });
    return () => {
      active = false;
    };
  }, [organizationId, employee, retry]);
  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-semibold">Asset clearance</h2>
      <p className="text-sm text-text-secondary">
        Outstanding custody blocks offboarding clearance and employee deactivation. HR/Admin may skip with an audited
        reason. No automatic salary deduction or access revocation is performed.
      </p>
      <AssetEmployeePicker
        organizationId={organizationId}
        label="Employee for clearance"
        value={employee}
        onChange={setEmployee}
        includeInactive
      />
      {employee && !current && <p role="status">Checking assigned assets…</p>}
      {current?.error && (
        <>
          <p role="alert" className="text-error">
            {current.error}
          </p>
          <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
            Retry clearance
          </Button>
        </>
      )}
      {current?.data && (
        <>
          <p className={`text-sm font-semibold ${current.data.clear ? "text-success" : "text-warning"}`}>
            {current.data.override
              ? `Clearance skipped by HR/Admin: ${current.data.override.reason}`
              : current.data.clear
                ? "No outstanding assets"
                : `${current.data.outstanding.length} assets require verified return`}
          </p>
          <ul className="space-y-2">
            {current.data.outstanding.map((asset) => (
              <li key={asset.id} className="text-sm">
                {asset.assetTag} · {asset.name} · {assetLabel(asset.status)}
              </li>
            ))}
          </ul>
          {!current.data.clear && (can("hrms.workforce.manage") || can("organization.settings.manage")) && (
            <Button variant="secondary" onClick={() => setSkip(true)}>
              Skip asset clearance (HR/Admin)
            </Button>
          )}
        </>
      )}
      {skip && current?.data && employee && (
        <AssetActionForm
          title="Skip asset clearance"
          primaryLabel="Record override"
          fields={[{ key: "reason", label: "Override reason", required: true }]}
          onClose={() => setSkip(false)}
          onSubmit={async ({ reason }) => {
            if (!current.data) throw new Error("Clearance changed. Reload before saving.");
            await hrmsAssetsService.overrideClearance(organizationId, employee.id, {
              reason,
              fingerprint: current.data.fingerprint,
            });
            setRetry((value) => value + 1);
          }}
        />
      )}
    </Card>
  );
}
