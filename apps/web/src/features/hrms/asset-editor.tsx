"use client";

import { useState } from "react";
import { DhritiDateField, DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import { hrmsAssetRegisterSchema } from "@dhriti/validation";
import type { AssetCategory } from "@dhriti/types";
import { hrmsService, type HrmsAsset } from "@/services/hrms.service";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { AssetEmployeePicker } from "./asset-employee-picker";

export const assetTypes = [
  "LAPTOP",
  "PHONE",
  "MONITOR",
  "KEYBOARD",
  "MOUSE",
  "HEADPHONES",
  "FURNITURE",
  "OTHER",
] as const;
export const assetConditions = ["NEW", "GOOD", "FAIR"] as const;
export const assetStatuses = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "UNFIT"] as const;
export const assetLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
const textFields = [
  ["name", "Asset name"],
  ["assetTag", "Asset tag"],
  ["serialNumber", "Serial number"],
  ["brand", "Brand"],
  ["model", "Model"],
  ["specifications", "Specifications"],
  ["location", "Office / storage location"],
  ["vendor", "Vendor"],
  ["purchaseCost", "Purchase cost"],
  ["currency", "Currency (ISO code)"],
  ["notes", "Private inventory notes"],
] as const;
type TextKey = (typeof textFields)[number][0];
type DateKey = "purchaseDate" | "warrantyExpiresOn";
export function AssetEditor({
  organizationId,
  asset,
  categories,
  onClose,
  onDone,
}: {
  organizationId: string;
  asset: HrmsAsset | null;
  categories: AssetCategory[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [values, setValues] = useState<Record<TextKey | DateKey | "customCategory", string>>({
    name: asset?.name ?? "",
    assetTag: asset?.assetTag ?? "",
    serialNumber: asset?.serialNumber ?? "",
    brand: asset?.brand ?? "",
    model: asset?.model ?? "",
    specifications: asset?.specifications ?? "",
    location: asset?.location ?? "",
    vendor: asset?.vendor ?? "",
    purchaseCost: asset?.purchaseCost ?? "",
    currency: asset?.currency ?? "",
    notes: asset?.notes ?? "",
    purchaseDate: asset?.purchaseDate?.slice(0, 10) ?? "",
    warrantyExpiresOn: asset?.warrantyExpiresOn?.slice(0, 10) ?? "",
    customCategory: asset?.customCategory ?? "",
  });
  const [type, setType] = useState(asset?.type ?? "LAPTOP");
  const [condition, setCondition] = useState(asset?.condition ?? "GOOD");
  const [status, setStatus] = useState(asset?.status ?? "AVAILABLE");
  const [categoryId, setCategoryId] = useState(asset?.categoryId ?? "");
  const [custodian, setCustodian] = useState<{ id: string; label: string } | null>(
    asset?.custodianEmployeeId
      ? {
          id: asset.custodianEmployeeId,
          label: asset.custodianEmployee
            ? `${asset.custodianEmployee.user.name} (${asset.custodianEmployee.employeeNumber})`
            : "Existing custodian is unavailable (change to replace)",
        }
      : null,
  );
  const [open, setOpen] = useState<string | null>(null);
  const [months, setMonths] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const close = () => {
    if (!busy) {
      if (dirty) setDiscard(true);
      else onClose();
    }
  };
  const change = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors({});
  };
  const save = async () => {
    const input = {
      ...values,
      type,
      condition,
      status,
      categoryId: categoryId || null,
      custodianEmployeeId: custodian?.id ?? null,
      purchaseCost: values.purchaseCost || null,
      currency: values.currency || null,
      purchaseDate: values.purchaseDate || null,
      warrantyExpiresOn: values.warrantyExpiresOn || null,
    };
    const parsed = hrmsAssetRegisterSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setBusy(true);
    setError("");
    setOpen(null);
    try {
      if (asset)
        await hrmsService.assets.update(organizationId, asset.id, { ...parsed.data, revision: asset.revision });
      else await hrmsService.assets.create(organizationId, parsed.data);
      onDone();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save asset.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Dialog
        open
        title={asset ? "Edit asset" : "Add asset"}
        onClose={close}
        maxWidth="md"
        primaryActionLabel="Save asset"
        onPrimaryAction={save}
        isSubmitting={busy}
      >
        <fieldset disabled={busy} className="max-h-[70vh] space-y-4 overflow-y-auto">
          <p className="text-xs text-text-muted">
            Serial is optional; the asset tag uniquely identifies equipment. Use issue/return actions for custody
            changes.
          </p>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {textFields.map(([key, label]) => (
              <DhritiTextField
                key={key}
                label={label}
                required={key === "name" || key === "assetTag" || (key === "currency" && !!values.purchaseCost)}
                value={values[key]}
                onChange={(value) => change(key, value)}
                error={errors[key]}
                maxLength={key === "notes" || key === "specifications" ? 5000 : 200}
              />
            ))}
          </div>
          <DhritiSelectMenu
            label="Asset type"
            value={type}
            options={assetTypes.map((value) => ({ value, label: assetLabel(value) }))}
            open={open === "type"}
            onOpenChange={(shown) => setOpen(shown ? "type" : null)}
            onChange={(value) => {
              const next = assetTypes.find((entry) => entry === value);
              if (next) {
                setType(next);
                setDirty(true);
              }
            }}
          />
          <DhritiSelectMenu
            label="Category"
            value={categoryId || null}
            placeholder="Use asset type"
            options={[
              { value: "", label: "Use asset type / custom label" },
              ...categories
                .filter((entry) => entry.isActive || entry.id === asset?.categoryId)
                .map((entry) => ({
                  value: entry.id,
                  label: `${entry.name}${entry.isActive ? "" : " (inactive)"}`,
                })),
            ]}
            open={open === "category"}
            onOpenChange={(shown) => setOpen(shown ? "category" : null)}
            onChange={(value) => {
              setCategoryId(value ?? "");
              setDirty(true);
            }}
          />
          {type === "OTHER" && !categoryId && (
            <DhritiTextField
              label="Custom category"
              required
              value={values.customCategory}
              onChange={(value) => change("customCategory", value)}
              error={errors.customCategory}
            />
          )}
          <DhritiSelectMenu
            label="Condition"
            value={condition}
            disabled={!!asset?.assignedEmployeeId}
            options={assetConditions.map((value) => ({ value, label: assetLabel(value) }))}
            open={open === "condition"}
            onOpenChange={(shown) => setOpen(shown ? "condition" : null)}
            onChange={(value) => {
              const next = assetConditions.find((entry) => entry === value);
              if (next) {
                setCondition(next);
                setDirty(true);
              }
            }}
          />
          <DhritiSelectMenu
            label="Status"
            value={status}
            disabled={!!asset?.assignedEmployeeId}
            options={assetStatuses
              .filter((value) => value !== "ASSIGNED" || !!asset?.assignedEmployeeId)
              .map((value) => ({ value, label: assetLabel(value) }))}
            open={open === "status"}
            onOpenChange={(shown) => setOpen(shown ? "status" : null)}
            onChange={(value) => {
              const next = assetStatuses.find((entry) => entry === value);
              if (next) {
                setStatus(next);
                setDirty(true);
              }
            }}
          />
          <AssetEmployeePicker
            organizationId={organizationId}
            label="Inventory custodian"
            value={custodian}
            disabled={busy}
            onChange={(value) => {
              setCustodian(value);
              setDirty(true);
            }}
          />
          {(["purchaseDate", "warrantyExpiresOn"] as const).map((key) => (
            <DhritiDateField
              key={key}
              label={key === "purchaseDate" ? "Purchase date" : "Warranty expires on"}
              value={values[key]}
              onChange={(value) => change(key, value ?? "")}
              month={months[key] ?? (values[key].slice(0, 7) || new Date().toISOString().slice(0, 7))}
              onMonthChange={(value) => setMonths((current) => ({ ...current, [key]: value }))}
              open={open === key}
              onOpenChange={(shown) => setOpen(shown ? key : null)}
              clearable
              error={errors[key]}
            />
          ))}
        </fieldset>
      </Dialog>
      <ConfirmationDialog
        open={discard}
        title="Discard asset changes?"
        description="Your unsaved asset details will be lost."
        confirmLabel="Discard"
        onCancel={() => setDiscard(false)}
        onConfirm={onClose}
      />
    </>
  );
}
