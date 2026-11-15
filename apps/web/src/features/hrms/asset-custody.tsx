"use client";

import { useEffect, useState } from "react";
import { DhritiDateField, DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import { hrmsAssetCustodySchema } from "@dhriti/validation";
import { hrmsService, type HrmsAsset } from "@/services/hrms.service";
import { AssetEmployeePicker } from "./asset-employee-picker";
import { assetConditions, assetLabel } from "./asset-editor";
import { Button } from "./components/ui-primitives";

export function AssetCustodyDialog({
  organizationId,
  asset,
  action,
  onClose,
  onDone,
}: {
  organizationId: string;
  asset: HrmsAsset;
  action: "ISSUE" | "RETURN";
  onClose: () => void;
  onDone: () => void;
}) {
  const [employee, setEmployee] = useState<{ id: string; label: string } | null>(null);
  const [condition, setCondition] = useState(asset.condition);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState<"AVAILABLE" | "MAINTENANCE" | "UNFIT">("AVAILABLE");
  const [open, setOpen] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const parsed = hrmsAssetCustodySchema.safeParse({
      revision: asset.revision,
      condition,
      notes,
      ...(action === "ISSUE" ? { employeeId: employee?.id, expectedReturnDate: date || null } : { status }),
    });
    const validation = !parsed.success
      ? Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message]))
      : {};
    if (action === "ISSUE" && !employee) validation.employeeId = "Choose an employee.";
    setErrors(validation);
    if (!parsed.success || Object.keys(validation).length) return;
    setBusy(true);
    setError("");
    setOpen(null);
    try {
      if (action === "ISSUE") await hrmsService.assets.issue(organizationId, asset.id, parsed.data);
      else await hrmsService.assets.returnAsset(organizationId, asset.id, parsed.data);
      onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update custody.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      title={`${action === "ISSUE" ? "Issue" : "Return"} ${asset.assetTag}`}
      onClose={() => {
        if (!busy) onClose();
      }}
      primaryActionLabel={action === "ISSUE" ? "Issue asset" : "Verify return"}
      onPrimaryAction={save}
      isSubmitting={busy}
    >
      <fieldset disabled={busy} className="space-y-4">
        <p className="text-sm text-text-secondary">
          {asset.name}
          {asset.assignedEmployee ? ` · Held by ${asset.assignedEmployee.user.name}` : ""}
        </p>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        {action === "ISSUE" && (
          <>
            <AssetEmployeePicker
              organizationId={organizationId}
              label="Issue to"
              value={employee}
              onChange={setEmployee}
              required
              error={errors.employeeId}
              disabled={busy}
            />
            <DhritiDateField
              label="Expected return date"
              value={date}
              onChange={(value) => setDate(value ?? "")}
              month={month}
              onMonthChange={setMonth}
              open={open === "date"}
              onOpenChange={(shown) => setOpen(shown ? "date" : null)}
              clearable
              error={errors.expectedReturnDate}
            />
          </>
        )}
        <DhritiSelectMenu
          label={action === "ISSUE" ? "Condition at issue" : "Condition on return"}
          value={condition}
          options={assetConditions.map((value) => ({ value, label: assetLabel(value) }))}
          open={open === "condition"}
          onOpenChange={(shown) => setOpen(shown ? "condition" : null)}
          onChange={(value) => {
            const next = assetConditions.find((entry) => entry === value);
            if (next) setCondition(next);
          }}
        />
        {action === "RETURN" && (
          <DhritiSelectMenu
            label="After return"
            value={status}
            options={["AVAILABLE", "MAINTENANCE", "UNFIT"].map((value) => ({ value, label: assetLabel(value) }))}
            open={open === "status"}
            onOpenChange={(shown) => setOpen(shown ? "status" : null)}
            onChange={(value) => {
              if (value === "AVAILABLE" || value === "MAINTENANCE" || value === "UNFIT") setStatus(value);
            }}
          />
        )}
        <DhritiTextField
          label="Handover notes"
          required
          value={notes}
          onChange={setNotes}
          maxLength={5000}
          error={errors.notes}
        />
        <p className="text-xs text-text-muted">
          Custody changes and condition are recorded together. Return verification affects asset clearance only, not
          payroll or system access.
        </p>
      </fieldset>
    </Dialog>
  );
}

export function AssetHistoryDialog({
  organizationId,
  asset,
  onClose,
}: {
  organizationId: string;
  asset: HrmsAsset;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    page: number;
    data?: Awaited<ReturnType<typeof hrmsService.assets.history>>;
    error?: string;
  } | null>(null);
  const current = result?.page === page ? result : null;
  useEffect(() => {
    let active = true;
    hrmsService.assets
      .history(organizationId, asset.id, page)
      .then((data) => {
        if (active) setResult({ page, data });
      })
      .catch((reason: unknown) => {
        if (active) setResult({ page, error: reason instanceof Error ? reason.message : "Unable to load history." });
      });
    return () => {
      active = false;
    };
  }, [organizationId, asset.id, page, retry]);
  return (
    <Dialog open title={`Details and history · ${asset.assetTag}`} onClose={onClose}>
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        <h2 className="font-semibold text-text-primary">{asset.name}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["Asset tag", asset.assetTag],
            ["Serial number", asset.serialNumber],
            ["Category", asset.category?.name ?? asset.customCategory ?? assetLabel(asset.type)],
            ["Condition", assetLabel(asset.condition)],
            ["Status", asset.archivedAt ? "Archived" : assetLabel(asset.status)],
            ["Brand / model", [asset.brand, asset.model].filter(Boolean).join(" ")],
            ["Location", asset.location],
            [
              "Inventory custodian",
              asset.custodianEmployee?.user.name ?? (asset.custodianEmployeeId ? "Employee unavailable" : "Unassigned"),
            ],
            ["Holder", asset.assignedEmployee?.user.name],
            ["Purchase date", asset.purchaseDate?.slice(0, 10)],
            ["Purchase cost", asset.purchaseCost !== null ? `${asset.purchaseCost} ${asset.currency ?? ""}` : null],
            ["Vendor", asset.vendor],
            ["Warranty expires", asset.warrantyExpiresOn?.slice(0, 10)],
            ["Expected return", asset.expectedReturnDate?.slice(0, 10)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-text-muted">{label}</dt>
              <dd className="break-words text-text-primary">{value || "Not recorded"}</dd>
            </div>
          ))}
        </dl>
        {asset.specifications && (
          <div>
            <h3 className="text-xs text-text-muted">Specifications</h3>
            <p className="whitespace-pre-wrap break-words text-sm">{asset.specifications}</p>
          </div>
        )}
        {asset.notes && (
          <div>
            <h3 className="text-xs text-text-muted">Private inventory notes</h3>
            <p className="whitespace-pre-wrap break-words text-sm">{asset.notes}</p>
          </div>
        )}
        <h3 className="font-semibold text-text-primary">Custody history</h3>
        <p className="text-xs text-text-muted">
          Events are recorded from rollout onward. Earlier custody and legacy acknowledgements are not reconstructed.
        </p>
        {current?.error ? (
          <div>
            <p role="alert" className="text-error">
              {current.error}
            </p>
            <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
              Retry history
            </Button>
          </div>
        ) : !current?.data ? (
          <p role="status">Loading history…</p>
        ) : (
          <>
            <ol className="space-y-3">
              {current.data.items.map((event) => (
                <li key={event.id} className="rounded-md border border-border p-3 text-sm text-text-primary">
                  <p className="font-semibold">
                    {assetLabel(event.action)} · {event.condition ? assetLabel(event.condition) : ""}
                  </p>
                  <p>{event.employeeName}</p>
                  <p className="break-words">{event.notes}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(event.createdAt).toLocaleString()} ·{" "}
                    {event.actorName ?? `Former user (${event.actorUserId})`}
                  </p>
                  {event.expectedReturnDate && (
                    <p className="text-xs text-text-secondary">
                      Expected return: {event.expectedReturnDate.slice(0, 10)}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            {!current.data.items.length && <p>No recorded events.</p>}
            <div className="flex items-center justify-end gap-3 text-sm">
              <span>
                {current.data.total} events · page {page}
              </span>
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page * 20 >= current.data.total}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
