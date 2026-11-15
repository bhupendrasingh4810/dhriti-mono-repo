"use client";
import { useCallback, useEffect, useState } from "react";
import { DhritiComboboxFlat, DhritiTextField } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import {
  hrmsAssetRequestDecisionSchema,
  hrmsAssetRepairCloseSchema,
  hrmsAssetMaintenanceSchema,
  hrmsAssetAccessorySchema,
  hrmsAssetAccessoryReturnSchema,
  hrmsAssetStockObservationSchema,
  hrmsAssetStockResolutionSchema,
  hrmsAssetProcurementSchema,
  hrmsAssetProcurementDecisionSchema,
  hrmsAssetDepreciationSchema,
  hrmsAssetAttachmentSchema,
} from "@dhriti/validation";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { hrmsService, type HrmsAsset } from "@/services/hrms.service";
import {
  hrmsAssetsService as api,
  downloadAssetCsv,
  type AssetRequest,
  type AssetMaintenance,
  type AssetStockItem,
  type AssetProcurement,
  type AssetImportPreview,
} from "@/services/hrms-assets.service";
import { AssetActionForm } from "./asset-action-form";
import { Button, Card } from "./components/ui-primitives";
import { Pagination } from "./attendance-regularization";
import { assetLabel } from "./asset-editor";

const message = (error: unknown) => (error instanceof Error ? error.message : "Unable to load asset workflow.");
function useAssetQuery<T>(load: () => Promise<T>) {
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ load: () => Promise<T>; data?: T; error?: string } | null>(null);
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setResult({ load, data });
      })
      .catch((error: unknown) => {
        if (active) setResult({ load, error: message(error) });
      });
    return () => {
      active = false;
    };
  }, [load, refresh]);
  return {
    data: result?.load === load ? result.data : undefined,
    error: result?.load === load ? result.error : undefined,
    reload: () => setRefresh((value) => value + 1),
  };
}
function LoadState({ error, retry }: { error?: string; retry: () => void }) {
  return error ? (
    <div>
      <p role="alert" className="text-sm text-error">
        {error}
      </p>
      <Button variant="secondary" onClick={retry}>
        Retry asset workflow
      </Button>
    </div>
  ) : (
    <p role="status" className="text-sm text-text-muted">
      Loading asset workflow…
    </p>
  );
}
function PageControls({
  page,
  setPage,
  pageSize,
  setPageSize,
  total,
}: {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  total: number;
}) {
  return (
    <Pagination
      pageSize={pageSize}
      onPageSize={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      range={`${total ? (page - 1) * pageSize + 1 : 0}–${Math.min(page * pageSize, total)} of ${total}`}
      canPrev={page > 1}
      canNext={page * pageSize < total}
      onPrev={() => setPage(page - 1)}
      onNext={() => setPage(page + 1)}
    />
  );
}
const noteField = { key: "note", label: "Decision / handover note", required: true };
const conditions = ["NEW", "GOOD", "FAIR"].map((value) => ({ value, label: assetLabel(value) }));
function AvailableAssetPicker({
  org,
  value,
  onChange,
}: {
  org: string;
  value: HrmsAsset | null;
  onChange: (asset: HrmsAsset | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const load = useCallback(
    () => hrmsService.assets.list(org, { search: query || undefined, status: "AVAILABLE", page, pageSize: 50 }),
    [org, query, page],
  );
  const { data, error, reload } = useAssetQuery(load);
  const options = [
    ...new Map([...(value ? [value] : []), ...(data?.items ?? [])].map((asset) => [asset.id, asset])).values(),
  ];
  return (
    <div className="space-y-2">
      <DhritiComboboxFlat
        label="Available replacement"
        required
        options={options.map((asset) => ({ value: asset.id, label: `${asset.assetTag} · ${asset.name}` }))}
        value={value ? [value.id] : []}
        onChange={(ids) => {
          onChange(options.find((asset) => asset.id === ids.at(-1)) ?? null);
          setOpen(false);
        }}
        open={open}
        onOpenChange={setOpen}
        search={query}
        onSearchChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        clearable
      />
      {error && <LoadState error={error} retry={reload} />}
      {data && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous matches
          </Button>
          <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next matches
          </Button>
        </div>
      )}
    </div>
  );
}
export function AssetRequests({ organizationId: org }: { organizationId: string }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const load = useCallback(() => api.requests(org, page, size), [org, page, size]);
  const { data, error, reload } = useAssetQuery(load);
  const [selected, setSelected] = useState<{ request: AssetRequest; action: "APPROVE" | "REJECT" | "FULFIL" } | null>(
    null,
  );
  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-semibold text-text-primary">Asset requests & approvals</h2>
      {!data ? (
        <LoadState error={error} retry={reload} />
      ) : (
        <>
          {!data.items.length && (
            <p className="text-sm text-text-muted">No asset requests or manager decisions pending.</p>
          )}
          <ul className="divide-y divide-border">
            {data.items.map((request) => (
              <li key={request.id} className="space-y-2 py-3 text-sm text-text-primary">
                <p className="font-semibold">
                  {request.asset.assetTag} · {request.asset.name} · {assetLabel(request.status)}
                </p>
                <p>{request.reason}</p>
                {!request.managerUserId && (
                  <p className="text-xs text-text-muted">
                    No active reporting manager: explicit asset-manager review required.
                  </p>
                )}
                {request.decisionNote && (
                  <p className="text-xs text-text-secondary">Decision: {request.decisionNote}</p>
                )}
                <div className="flex gap-2">
                  {request.canDecide &&
                    (["APPROVE", "REJECT"] as const).map((action) => (
                      <Button key={action} variant="secondary" onClick={() => setSelected({ request, action })}>
                        {assetLabel(action)}
                      </Button>
                    ))}
                  {request.canFulfil && (
                    <Button
                      onClick={() => {
                        setSelected({ request, action: "FULFIL" });
                      }}
                    >
                      Send new asset
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <PageControls page={page} setPage={setPage} pageSize={size} setPageSize={setSize} total={data.total} />
        </>
      )}
      {selected && (
        <AssetRequestAction
          organizationId={org}
          request={selected.request}
          action={selected.action}
          onClose={() => setSelected(null)}
          onDone={reload}
        />
      )}
    </Card>
  );
}

function AssetRequestAction({
  organizationId: org,
  request,
  action,
  onClose,
  onDone,
}: {
  organizationId: string;
  request: AssetRequest;
  action: "APPROVE" | "REJECT" | "FULFIL";
  onClose: () => void;
  onDone: () => void;
}) {
  const [replacement, setReplacement] = useState<HrmsAsset | null>(null);
  return (
    <>
      {action === "FULFIL" && !replacement ? (
        <Dialog open title="Select replacement equipment" onClose={onClose}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              First verify return of the original equipment and its accessories. Replacement issuance is atomic with
              fulfilment.
            </p>
            <AvailableAssetPicker org={org} value={replacement} onChange={setReplacement} />
          </div>
        </Dialog>
      ) : (
        <AssetActionForm
          title={action === "FULFIL" ? "Send new asset" : `${assetLabel(action)} asset request`}
          primaryLabel={action === "FULFIL" ? "Send new asset" : "Save"}
          fields={[noteField]}
          onClose={onClose}
          onSubmit={async ({ note }) => {
            await api.decideRequest(
              org,
              request.id,
              hrmsAssetRequestDecisionSchema.parse({
                revision: request.revision,
                action,
                note,
                ...(action === "FULFIL" && replacement
                  ? { replacementAssetId: replacement.id, assetRevision: replacement.revision }
                  : {}),
              }),
            );
            onDone();
          }}
        />
      )}
    </>
  );
}

export function AssetRequestDetails({
  organizationId,
  request,
  onClose,
  onChanged,
}: {
  organizationId: string;
  request: AssetRequest;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [action, setAction] = useState<"APPROVE" | "REJECT" | "FULFIL" | null>(null);
  if (action)
    return (
      <AssetRequestAction
        organizationId={organizationId}
        request={request}
        action={action}
        onClose={() => setAction(null)}
        onDone={() => {
          onChanged();
          onClose();
        }}
      />
    );
  return (
    <Dialog open title="Replacement request details" onClose={onClose}>
      <div className="space-y-4 text-sm text-text-primary">
        <div>
          <p className="font-semibold">{request.asset.name}</p>
          <p className="break-all text-xs text-text-muted">{request.asset.assetTag}</p>
        </div>
        <dl className="space-y-3">
          {request.requestedFor && (
            <div>
              <dt className="text-text-muted">Employee</dt>
              <dd>
                {request.requestedFor.user.name} · {request.requestedFor.employeeNumber}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-text-muted">Status</dt>
            <dd>{assetLabel(request.status)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Reason</dt>
            <dd className="whitespace-pre-wrap break-words">{request.reason}</dd>
          </div>
          {request.createdAt && (
            <div>
              <dt className="text-text-muted">Requested on</dt>
              <dd>{request.createdAt.slice(0, 10)}</dd>
            </div>
          )}
          {request.decisionNote && (
            <div>
              <dt className="text-text-muted">Decision / handover note</dt>
              <dd className="whitespace-pre-wrap break-words">{request.decisionNote}</dd>
            </div>
          )}
        </dl>
        {request.status === "PENDING" && (
          <p className="text-xs text-text-muted">
            {request.managerUserId
              ? "Awaiting reporting manager approval."
              : "No active reporting manager: explicit asset-manager review required."}
          </p>
        )}
        {request.status === "APPROVED" && (
          <p className="text-xs text-text-muted">
            Manager review approved. HR/Admin with asset-management permission can send the new asset after verifying
            return of the original equipment and accessories.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {request.canDecide &&
            (["APPROVE", "REJECT"] as const).map((value) => (
              <Button key={value} variant="secondary" onClick={() => setAction(value)}>
                {assetLabel(value)}
              </Button>
            ))}
          {request.canFulfil && <Button onClick={() => setAction("FULFIL")}>Send new asset</Button>}
        </div>
      </div>
    </Dialog>
  );
}

export function AssetTools({
  organizationId: org,
  asset,
  onClose,
  onChanged,
}: {
  organizationId: string;
  asset: HrmsAsset;
  onClose: () => void;
  onChanged: () => void;
}) {
  const loadAccessories = useCallback(() => api.accessories(org, asset.id), [org, asset.id]);
  const loadAttachments = useCallback(() => api.attachments(org, asset.id), [org, asset.id]);
  const accessories = useAssetQuery(loadAccessories);
  const attachments = useAssetQuery(loadAttachments);
  const [action, setAction] = useState<"accessory" | "repair" | "upload" | null>(null);
  const [returnItem, setReturnItem] = useState<NonNullable<typeof accessories.data>[number] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [archiveAttachment, setArchiveAttachment] = useState<{ id: string; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const changed = () => {
    accessories.reload();
    attachments.reload();
    onChanged();
  };
  return (
    <Dialog
      open
      title={`Asset operations · ${asset.assetTag}`}
      onClose={() => {
        if (!busy) onClose();
      }}
      maxWidth="md"
    >
      <div className="max-h-[70vh] space-y-5 overflow-y-auto">
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <h2 className="font-semibold">Accessories / issue bundle</h2>
        <p className="text-xs text-text-muted">
          Configured accessories issue with the asset. Record partial accessory returns here before verifying the
          equipment return.
        </p>
        {!accessories.data ? (
          <LoadState error={accessories.error} retry={accessories.reload} />
        ) : (
          <ul className="space-y-2">
            {accessories.data.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {item.name} · {item.quantity} total · {item.outstanding} outstanding · {assetLabel(item.condition)}
                </span>
                {!!item.outstanding && (
                  <Button variant="secondary" onClick={() => setReturnItem(item)}>
                    Record return
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!asset.assignedEmployeeId && (
          <Button variant="secondary" onClick={() => setAction("accessory")}>
            Add accessory
          </Button>
        )}
        {!asset.assignedEmployeeId && asset.status !== "UNFIT" && (
          <Button variant="secondary" onClick={() => setAction("repair")}>
            Open maintenance ticket
          </Button>
        )}
        <h2 className="font-semibold">Private documents & condition photos</h2>
        {!attachments.data ? (
          <LoadState error={attachments.error} retry={attachments.reload} />
        ) : (
          <ul className="space-y-2">
            {attachments.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span>
                  {item.title} · {assetLabel(item.kind)} · {item.file.originalName}
                </span>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const { url } = await api.download(org, item.id);
                      window.open(url, "_blank", "noopener,noreferrer");
                    } catch (reason) {
                      setError(message(reason));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Download
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => setArchiveAttachment(item)}>
                  Archive
                </Button>
              </li>
            ))}
          </ul>
        )}
        <label className="block text-sm text-text-secondary">
          PDF, PNG, JPEG or WebP (up to 10 MB)
          <input
            aria-label="Asset attachment"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="mt-2 block w-full cursor-pointer text-sm"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError("");
            }}
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => {
            if (!file) setError("Choose a file first.");
            else setAction("upload");
          }}
        >
          Attach document / photo
        </Button>
      </div>
      {action === "accessory" && (
        <AssetActionForm
          title="Add bundle accessory"
          fields={[
            { key: "name", label: "Accessory name", required: true },
            { key: "quantity", label: "Quantity", required: true, initial: "1" },
          ]}
          onClose={() => setAction(null)}
          onSubmit={async (values) => {
            await api.addAccessory(
              org,
              asset.id,
              hrmsAssetAccessorySchema.parse({
                ...values,
                quantity: Number(values.quantity),
                revision: asset.revision,
              }),
            );
            changed();
          }}
        />
      )}
      {returnItem && (
        <AssetActionForm
          title={`Return ${returnItem.name}`}
          fields={[
            { key: "quantity", label: "Quantity", initial: String(returnItem.outstanding), required: true },
            {
              key: "condition",
              label: "Condition",
              initial: returnItem.condition,
              options: conditions,
              required: true,
            },
            noteField,
          ]}
          onClose={() => setReturnItem(null)}
          onSubmit={async (values) => {
            await api.returnAccessory(
              org,
              returnItem.id,
              hrmsAssetAccessoryReturnSchema.parse({
                ...values,
                quantity: Number(values.quantity),
                revision: returnItem.revision,
              }),
            );
            changed();
          }}
        />
      )}
      {action === "repair" && (
        <AssetActionForm
          title="Open maintenance ticket"
          fields={[
            { key: "fault", label: "Fault / service reason", required: true },
            { key: "vendor", label: "Service vendor" },
          ]}
          onClose={() => setAction(null)}
          onSubmit={async (values) => {
            await api.openMaintenance(
              org,
              hrmsAssetMaintenanceSchema.parse({ ...values, assetId: asset.id, revision: asset.revision }),
            );
            changed();
          }}
        />
      )}
      {action === "upload" && file && (
        <AssetActionForm
          title="Attach private asset evidence"
          fields={[
            { key: "title", label: "Title", required: true },
            {
              key: "kind",
              label: "Document category",
              required: true,
              initial: "CONDITION",
              options: ["INVOICE", "WARRANTY", "CONDITION", "HANDOVER", "OTHER"].map((value) => ({
                value,
                label: assetLabel(value),
              })),
            },
          ]}
          onClose={() => setAction(null)}
          onSubmit={async (values) => {
            const parsed = hrmsAssetAttachmentSchema.parse(values);
            await api.upload(org, asset.id, file, parsed.title, parsed.kind);
            changed();
            setFile(null);
          }}
        />
      )}
      {archiveAttachment && (
        <AssetActionForm
          title={`Archive attachment · ${archiveAttachment.title}`}
          fields={[]}
          primaryLabel="Archive"
          onClose={() => setArchiveAttachment(null)}
          onSubmit={async () => {
            await api.archiveAttachment(org, archiveAttachment.id);
            changed();
          }}
        />
      )}
    </Dialog>
  );
}

function Maintenance({ org }: { org: string }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const load = useCallback(() => api.maintenance(org, page, size), [org, page, size]);
  const { data, error, reload } = useAssetQuery(load);
  const [ticket, setTicket] = useState<AssetMaintenance | null>(null);
  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-semibold">Maintenance tickets</h2>
      <p className="text-sm text-text-muted">
        Open a ticket from an inventory row’s operations button after employee return.
      </p>
      {!data ? (
        <LoadState error={error} retry={reload} />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {data.items.map((item) => (
              <li key={item.id} className="space-y-2 py-3 text-sm">
                <p className="font-semibold">
                  {item.asset.assetTag} · {item.asset.name} · {item.status}
                </p>
                <p>{item.fault}</p>
                <p>{item.vendor}</p>
                {item.resolution && (
                  <p>
                    {item.resolution} · {item.cost} {item.currency}
                  </p>
                )}
                {item.status === "OPEN" && (
                  <Button variant="secondary" onClick={() => setTicket(item)}>
                    Close repair
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {!data.items.length && <p className="text-sm text-text-muted">No maintenance tickets.</p>}
          <PageControls page={page} setPage={setPage} pageSize={size} setPageSize={setSize} total={data.total} />
        </>
      )}
      {ticket && (
        <AssetActionForm
          title={`Close repair · ${ticket.asset.assetTag}`}
          onClose={() => setTicket(null)}
          fields={[
            { key: "resolution", label: "Resolution", required: true },
            { key: "cost", label: "Repair cost", required: true, initial: "0" },
            { key: "currency", label: "Currency", required: true },
            { key: "condition", label: "Condition", options: conditions, initial: "GOOD", required: true },
            {
              key: "status",
              label: "Disposition",
              initial: "AVAILABLE",
              required: true,
              options: ["AVAILABLE", "UNFIT"].map((value) => ({ value, label: assetLabel(value) })),
            },
          ]}
          onSubmit={async (values) => {
            await api.closeMaintenance(
              org,
              ticket.id,
              hrmsAssetRepairCloseSchema.parse({
                ...values,
                revision: ticket.revision,
                assetRevision: ticket.asset.revision,
              }),
            );
            reload();
          }}
        />
      )}
    </Card>
  );
}
function StockVerification({ org }: { org: string }) {
  const load = useCallback(() => api.stock(org), [org]);
  const checks = useAssetQuery(load);
  const [selected, setSelected] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const loadItems = useCallback(
    () => (selected ? api.stockItems(org, selected, page, size) : Promise.resolve(null)),
    [org, selected, page, size],
  );
  const details = useAssetQuery(loadItems);
  const [create, setCreate] = useState(false);
  const [observe, setObserve] = useState<AssetStockItem | null>(null);
  const [resolve, setResolve] = useState<AssetStockItem | null>(null);
  const [complete, setComplete] = useState(false);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Stock verification</h2>
        <Button onClick={() => setCreate(true)}>Start stock check</Button>
      </div>
      {!checks.data ? (
        <LoadState error={checks.error} retry={checks.reload} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {checks.data.map((check) => (
            <Button
              key={check.id}
              variant={selected === check.id ? "primary" : "secondary"}
              onClick={() => {
                setSelected(check.id);
                setPage(1);
              }}
            >
              {check.name} · {check.status}
            </Button>
          ))}
        </div>
      )}
      {selected &&
        (!details.data ? (
          <LoadState error={details.error} retry={details.reload} />
        ) : (
          <>
            <p className="text-xs text-text-muted">
              Expected locations/holders are snapshots at the start. Resolving a discrepancy records the investigation;
              it never silently rewrites custody.
            </p>
            <ul className="divide-y divide-border">
              {details.data.items.map((item) => (
                <li key={item.id} className="space-y-2 py-3 text-sm">
                  <p className="font-semibold">
                    {item.asset.assetTag} · {item.asset.name} · {assetLabel(item.result)}
                  </p>
                  <p>
                    Expected: {item.expectedLocation ?? "No location"} · Observed:{" "}
                    {item.observedLocation ?? "Not recorded"}
                  </p>
                  <p>{item.note}</p>
                  {item.resolution && <p>Resolution: {item.resolution}</p>}
                  {details.data?.check.status === "OPEN" && (
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setObserve(item)}>
                        Record observation
                      </Button>
                      {!["UNCHECKED", "FOUND"].includes(item.result) && !item.resolution && (
                        <Button variant="secondary" onClick={() => setResolve(item)}>
                          Resolve discrepancy
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <PageControls
              page={page}
              setPage={setPage}
              pageSize={size}
              setPageSize={setSize}
              total={details.data.total}
            />
            {details.data.check.status === "OPEN" && (
              <Button onClick={() => setComplete(true)}>Complete stock check</Button>
            )}
          </>
        ))}
      {create && (
        <AssetActionForm
          title="Start stock verification"
          fields={[{ key: "name", label: "Stock check name", required: true }]}
          onClose={() => setCreate(false)}
          onSubmit={async ({ name }) => {
            const check = await api.createStock(org, name);
            setSelected(check.id);
            checks.reload();
          }}
        />
      )}
      {observe && (
        <AssetActionForm
          title={`Observe ${observe.asset.assetTag}`}
          fields={[
            {
              key: "result",
              label: "Result",
              required: true,
              initial: "FOUND",
              options: ["FOUND", "MISSING", "MISPLACED", "HOLDER_MISMATCH"].map((value) => ({
                value,
                label: assetLabel(value),
              })),
            },
            { key: "observedLocation", label: "Observed location", initial: observe.expectedLocation ?? "" },
            noteField,
          ]}
          onClose={() => setObserve(null)}
          onSubmit={async (values) => {
            await api.observeStock(
              org,
              observe.id,
              hrmsAssetStockObservationSchema.parse({ ...values, revision: observe.revision }),
            );
            details.reload();
            checks.reload();
          }}
        />
      )}
      {resolve && (
        <AssetActionForm
          title={`Resolve ${resolve.asset.assetTag}`}
          fields={[{ key: "resolution", label: "Investigation / resolution", required: true }]}
          onClose={() => setResolve(null)}
          onSubmit={async (values) => {
            await api.resolveStock(
              org,
              resolve.id,
              hrmsAssetStockResolutionSchema.parse({ ...values, revision: resolve.revision }),
            );
            details.reload();
            checks.reload();
          }}
        />
      )}
      {complete && details.data && (
        <AssetActionForm
          title="Complete stock verification"
          primaryLabel="Complete"
          fields={[]}
          onClose={() => setComplete(false)}
          onSubmit={async () => {
            if (details.data) await api.completeStock(org, selected, details.data.check.revision);
            details.reload();
            checks.reload();
          }}
        />
      )}
    </Card>
  );
}
function Procurement({ org }: { org: string }) {
  const { can } = usePermissions();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [create, setCreate] = useState(false);
  const load = useCallback(() => api.procurement(org, page, size), [org, page, size]);
  const { data, error, reload } = useAssetQuery(load);
  const [decision, setDecision] = useState<{ item: AssetProcurement; action: "APPROVE" | "REJECT" } | null>(null);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Procurement requests</h2>
        <Button onClick={() => setCreate(true)}>Request purchase</Button>
      </div>
      <p className="text-xs text-text-muted">
        Another finance approver must approve purchasing. Approval does not create inventory or post accounting entries.
      </p>
      {!data ? (
        <LoadState error={error} retry={reload} />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {data.items.map((item) => (
              <li key={item.id} className="space-y-2 py-3 text-sm">
                <p className="font-semibold">
                  {item.name} · {item.quantity} units · {item.estimatedCost} {item.currency} total · {item.status}
                </p>
                <p>{item.reason}</p>
                <p>{item.decisionNote}</p>
                {can("hrms.payroll.manage") && user?.id !== item.requestedById && item.status === "PENDING" && (
                  <div className="flex gap-2">
                    {(["APPROVE", "REJECT"] as const).map((action) => (
                      <Button key={action} variant="secondary" onClick={() => setDecision({ item, action })}>
                        {assetLabel(action)}
                      </Button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <PageControls page={page} setPage={setPage} pageSize={size} setPageSize={setSize} total={data.total} />
        </>
      )}
      {create && (
        <AssetActionForm
          title="Request equipment purchase"
          fields={[
            { key: "name", label: "Equipment", required: true },
            { key: "quantity", label: "Quantity", required: true, initial: "1" },
            { key: "estimatedCost", label: "Estimated total cost", required: true },
            { key: "currency", label: "Currency", required: true },
            { key: "reason", label: "Business reason", required: true },
          ]}
          onClose={() => setCreate(false)}
          onSubmit={async (values) => {
            await api.createProcurement(
              org,
              hrmsAssetProcurementSchema.parse({ ...values, quantity: Number(values.quantity) }),
            );
            reload();
          }}
        />
      )}
      {decision && (
        <AssetActionForm
          title={`${assetLabel(decision.action)} purchase`}
          fields={[noteField]}
          onClose={() => setDecision(null)}
          onSubmit={async (values) => {
            await api.decideProcurement(
              org,
              decision.item.id,
              hrmsAssetProcurementDecisionSchema.parse({
                ...values,
                revision: decision.item.revision,
                action: decision.action,
              }),
            );
            reload();
          }}
        />
      )}
    </Card>
  );
}
function Finance({ org }: { org: string }) {
  const { can } = usePermissions();
  const [configure, setConfigure] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const load = useCallback(() => api.depreciation(org), [org]);
  const policy = useAssetQuery(load);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-semibold">Finance & depreciation</h2>
      {!policy.data ? (
        <LoadState error={policy.error} retry={policy.reload} />
      ) : (
        <>
          <p className="text-sm">
            {assetLabel(policy.data.method)}
            {policy.data.method !== "DISABLED"
              ? ` · ${policy.data.usefulLifeMonths} months · ${policy.data.residualPercent}% residual`
              : ""}
          </p>
          <p className="text-xs text-text-muted">
            Straight-line depreciation uses completed UTC calendar months and exact decimals, rounded to three places.
            Missing purchase data is flagged. No ledger entries are posted.
          </p>
          {can("hrms.payroll.manage") && (
            <Button variant="secondary" onClick={() => setConfigure(true)}>
              Configure depreciation
            </Button>
          )}
        </>
      )}
      <DhritiTextField label="Accounting as-of date (YYYY-MM-DD)" value={date} onChange={setDate} />
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await api.accounting(org, date);
            downloadAssetCsv(result.csv, `asset-accounting-${date}.csv`);
          } catch (reason) {
            setError(message(reason));
          } finally {
            setBusy(false);
          }
        }}
      >
        Export accounting CSV
      </Button>
      {configure && policy.data && (
        <AssetActionForm
          title="Configure depreciation"
          fields={[
            {
              key: "method",
              label: "Method",
              initial: policy.data.method,
              options: [
                { value: "DISABLED", label: "Disabled" },
                { value: "STRAIGHT_LINE", label: "Straight line" },
              ],
              required: true,
            },
            {
              key: "usefulLifeMonths",
              label: "Useful life (months)",
              initial: String(policy.data.usefulLifeMonths ?? ""),
            },
            { key: "residualPercent", label: "Residual percentage", initial: policy.data.residualPercent ?? "" },
            { key: "reason", label: "Finance approval reason", required: true },
          ]}
          onClose={() => setConfigure(false)}
          onSubmit={async (values) => {
            await api.configureDepreciation(
              org,
              hrmsAssetDepreciationSchema.parse({
                ...values,
                revision: policy.data?.revision,
                usefulLifeMonths: values.usefulLifeMonths ? Number(values.usefulLifeMonths) : null,
                residualPercent: values.residualPercent || null,
              }),
            );
            policy.reload();
          }}
        />
      )}
    </Card>
  );
}
function AssetImport({ org }: { org: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<AssetImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await operation();
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="space-y-4 p-5">
      <h2 className="font-semibold">Import inventory</h2>
      <p className="text-sm text-text-muted">
        CSV, up to 1,000 rows. Preview all duplicates/errors before applying. Application is all-or-nothing and creates
        only unassigned stock. Previews expire in one hour.
      </p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            downloadAssetCsv((await api.importTemplate(org)).csv, "asset-import-template.csv");
          })
        }
      >
        Download CSV template
      </Button>
      <label className="block text-sm">
        Inventory CSV
        <input
          aria-label="Inventory CSV"
          type="file"
          accept=".csv"
          className="mt-2 block cursor-pointer"
          disabled={busy}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setPreview(null);
            setSuccess("");
          }}
        />
      </label>
      <Button
        disabled={busy || !file}
        onClick={() =>
          void run(async () => {
            if (file) setPreview(await api.previewImport(org, file));
          })
        }
      >
        Preview import
      </Button>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-success">
          {success}
        </p>
      )}
      {preview && (
        <>
          <p className="text-sm font-semibold">
            {preview.valid} of {preview.total} rows valid
          </p>
          <p className="text-sm text-text-muted">
            Only valid rows will be imported. {preview.total - preview.valid} invalid rows will be skipped; correct them
            and upload a new file afterward.
          </p>
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {preview.rows.map((row) => (
              <li key={row.row} className={row.errors.length ? "text-error" : "text-text-secondary"}>
                Row {row.row} · {row.input?.assetTag ?? "Invalid record"} · {row.errors.join("; ") || "Ready"}
              </li>
            ))}
          </ul>
          <Button
            disabled={busy || !preview.valid}
            onClick={() =>
              void run(async () => {
                const result = await api.applyImport(org, preview.id);
                setPreview(null);
                setSuccess(`Imported ${result.count} assets. Skipped ${result.skipped} invalid rows.`);
              })
            }
          >
            Apply validated import
          </Button>
        </>
      )}
    </Card>
  );
}
export function AssetOperations({ organizationId }: { organizationId: string }) {
  const [tab, setTab] = useState("requests");
  return (
    <div className="space-y-4">
      <nav aria-label="Asset operations" className="flex flex-wrap gap-2">
        {["requests", "maintenance", "stock", "procurement", "finance", "import"].map((value) => (
          <Button key={value} variant={tab === value ? "primary" : "secondary"} onClick={() => setTab(value)}>
            {assetLabel(value)}
          </Button>
        ))}
      </nav>
      {tab === "requests" && <AssetRequests organizationId={organizationId} />}
      {tab === "maintenance" && <Maintenance org={organizationId} />}
      {tab === "stock" && <StockVerification org={organizationId} />}
      {tab === "procurement" && <Procurement org={organizationId} />}
      {tab === "finance" && <Finance org={organizationId} />}
      {tab === "import" && <AssetImport org={organizationId} />}
    </div>
  );
}
