import type { ControlEntitlementDefinition } from "@/services/control.service";

export type EntitlementDraft = {
  key: string;
  name: string;
  kind: "FEATURE" | "LIMIT";
  productKey: string;
  description: string;
  unit: string;
};

export type EntitlementFieldErrors = Partial<Record<"key" | "name", string>>;

export const blankEntitlementDraft = (): EntitlementDraft => ({
  key: "",
  name: "",
  kind: "FEATURE",
  productKey: "",
  description: "",
  unit: "",
});

export const toEntitlementDraft = (item: ControlEntitlementDefinition): EntitlementDraft => ({
  key: item.key,
  name: item.name,
  kind: item.kind,
  productKey: item.productKey ?? "",
  description: item.description ?? "",
  unit: item.unit ?? "",
});

export const validateEntitlementDraft = (draft: EntitlementDraft, isEditing: boolean): EntitlementFieldErrors => ({
  ...(!isEditing && !draft.key.trim() ? { key: "Entitlement key is required" } : {}),
  ...(!isEditing && draft.key.trim() && !/^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)*$/.test(draft.key.trim())
    ? { key: "Use lowercase letters, numbers, underscores, and dots" }
    : {}),
  ...(!draft.name.trim() ? { name: "Display name is required" } : {}),
});
