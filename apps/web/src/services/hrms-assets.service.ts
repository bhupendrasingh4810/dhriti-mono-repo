import { pathSegment, tenantJsonRequest, tenantRequest } from "./request.service";
import type {
  z,
  hrmsAssetReplacementSchema,
  hrmsAssetRequestDecisionSchema,
  hrmsAssetMaintenanceSchema,
  hrmsAssetRepairCloseSchema,
  hrmsAssetAccessorySchema,
  hrmsAssetAccessoryReturnSchema,
  hrmsAssetStockObservationSchema,
  hrmsAssetStockResolutionSchema,
  hrmsAssetProcurementSchema,
  hrmsAssetProcurementDecisionSchema,
  hrmsAssetDepreciationSchema,
} from "@dhriti/validation";
type Page<T> = { items: T[]; total: number };
export interface AssetRequest {
  id: string;
  assetId: string;
  employeeId: string;
  reason: string;
  status: string;
  revision: number;
  managerUserId: string | null;
  decisionNote: string | null;
  canDecide: boolean;
  canFulfil: boolean;
  isOwn: boolean;
  requestedFor: { id: string; employeeNumber: string; user: { name: string } } | null;
  createdAt: string;
  updatedAt: string;
  asset: { assetTag: string; name: string };
}
export interface AssetMaintenance {
  id: string;
  assetId: string;
  fault: string;
  vendor: string | null;
  cost: string | null;
  currency: string | null;
  status: string;
  revision: number;
  resolution: string | null;
  asset: { assetTag: string; name: string; revision: number };
}
export interface AssetAccessory {
  id: string;
  assetId: string;
  name: string;
  quantity: number;
  outstanding: number;
  condition: string;
  revision: number;
}
export interface AssetAttachment {
  id: string;
  title: string;
  kind: string;
  createdAt: string;
  file: { originalName: string; contentType: string; sizeBytes: number };
}
export interface AssetStockCheck {
  id: string;
  name: string;
  status: string;
  revision: number;
  createdAt: string;
}
export interface AssetStockItem {
  id: string;
  revision: number;
  result: string;
  expectedLocation: string | null;
  expectedHolderId: string | null;
  observedLocation: string | null;
  note: string | null;
  resolution: string | null;
  asset: { assetTag: string; name: string };
}
export interface AssetProcurement {
  id: string;
  name: string;
  quantity: number;
  estimatedCost: string;
  currency: string;
  reason: string;
  status: string;
  revision: number;
  requestedById: string;
  decisionNote: string | null;
}
export interface AssetDepreciation {
  method: "DISABLED" | "STRAIGHT_LINE";
  usefulLifeMonths: number | null;
  residualPercent: string | null;
  revision: number;
}
export interface AssetImportPreview {
  id: string;
  valid: number;
  total: number;
  rows: { row: number; input: { name: string; assetTag: string } | null; errors: string[] }[];
}
const base = "/api/organization/hrms/asset-operations";
const get = <T>(org: string, path: string, query?: object) => tenantRequest<T>(org, `${base}/${path}`, { query });
const post = <T, I>(org: string, path: string, input: I) =>
  tenantJsonRequest<T, I>(org, `${base}/${path}`, "POST", input);
export const hrmsAssetsService = {
  requestReplacement: (org: string, input: z.infer<typeof hrmsAssetReplacementSchema>) =>
    post<AssetRequest, typeof input>(org, "replacement", input),
  requests: (org: string, page = 1, pageSize = 20, scope?: "dashboard") =>
    get<Page<AssetRequest>>(org, "requests", { page, pageSize, scope }),
  decideRequest: (org: string, id: string, input: z.infer<typeof hrmsAssetRequestDecisionSchema>) =>
    post<AssetRequest, typeof input>(org, `requests/${pathSegment(id)}/decision`, input),
  maintenance: (org: string, page = 1, pageSize = 20) =>
    get<Page<AssetMaintenance>>(org, "maintenance", { page, pageSize }),
  openMaintenance: (org: string, input: z.infer<typeof hrmsAssetMaintenanceSchema>) =>
    post<AssetMaintenance, typeof input>(org, "maintenance", input),
  closeMaintenance: (org: string, id: string, input: z.infer<typeof hrmsAssetRepairCloseSchema>) =>
    post<AssetMaintenance, typeof input>(org, `maintenance/${pathSegment(id)}/close`, input),
  accessories: (org: string, id: string) => get<AssetAccessory[]>(org, `assets/${pathSegment(id)}/accessories`),
  addAccessory: (org: string, id: string, input: z.infer<typeof hrmsAssetAccessorySchema>) =>
    post<AssetAccessory, typeof input>(org, `assets/${pathSegment(id)}/accessories`, input),
  returnAccessory: (org: string, id: string, input: z.infer<typeof hrmsAssetAccessoryReturnSchema>) =>
    post<AssetAccessory, typeof input>(org, `accessories/${pathSegment(id)}/return`, input),
  overrideClearance: (org: string, id: string, input: { reason: string; fingerprint: string }) =>
    post<unknown, typeof input>(org, `clearance/${pathSegment(id)}/skip`, input),
  stock: (org: string) => get<AssetStockCheck[]>(org, "stock"),
  createStock: (org: string, name: string) => post<AssetStockCheck, { name: string }>(org, "stock", { name }),
  stockItems: (org: string, id: string, page = 1, pageSize = 20) =>
    get<Page<AssetStockItem> & { check: AssetStockCheck }>(org, `stock/${pathSegment(id)}`, { page, pageSize }),
  observeStock: (org: string, id: string, input: z.infer<typeof hrmsAssetStockObservationSchema>) =>
    post<AssetStockItem, typeof input>(org, `stock/items/${pathSegment(id)}/observe`, input),
  resolveStock: (org: string, id: string, input: z.infer<typeof hrmsAssetStockResolutionSchema>) =>
    post<AssetStockItem, typeof input>(org, `stock/items/${pathSegment(id)}/resolve`, input),
  completeStock: (org: string, id: string, revision: number) =>
    post<AssetStockCheck, { revision: number }>(org, `stock/${pathSegment(id)}/complete`, { revision }),
  procurement: (org: string, page = 1, pageSize = 20) =>
    get<Page<AssetProcurement>>(org, "procurement", { page, pageSize }),
  createProcurement: (org: string, input: z.infer<typeof hrmsAssetProcurementSchema>) =>
    post<AssetProcurement, typeof input>(org, "procurement", input),
  decideProcurement: (org: string, id: string, input: z.infer<typeof hrmsAssetProcurementDecisionSchema>) =>
    post<AssetProcurement, typeof input>(org, `procurement/${pathSegment(id)}/decision`, input),
  depreciation: (org: string) => get<AssetDepreciation>(org, "depreciation"),
  configureDepreciation: (org: string, input: z.infer<typeof hrmsAssetDepreciationSchema>) =>
    post<AssetDepreciation, typeof input>(org, "depreciation", input),
  accounting: (org: string, asOf: string) =>
    get<{
      csv: string;
      rows: {
        assetTag: string;
        name: string;
        currency: string | null;
        cost: string | null;
        depreciation: string | null;
        netBookValue: string | null;
        status: string;
      }[];
    }>(org, "accounting", { asOf }),
  attachments: (org: string, id: string) => get<AssetAttachment[]>(org, `assets/${pathSegment(id)}/attachments`),
  upload: (org: string, id: string, file: File, title: string, kind: string) => {
    const body = new FormData();
    body.append("file", file);
    body.append("title", title);
    body.append("kind", kind);
    return tenantRequest<AssetAttachment>(org, `${base}/assets/${pathSegment(id)}/attachments`, {
      method: "POST",
      body,
    });
  },
  download: (org: string, id: string) =>
    get<{ url: string; expiresIn: number }>(org, `attachments/${pathSegment(id)}/download`),
  archiveAttachment: (org: string, id: string) => post<void, object>(org, `attachments/${pathSegment(id)}/archive`, {}),
  importTemplate: (org: string) => get<{ csv: string }>(org, "import/template"),
  previewImport: (org: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return tenantRequest<AssetImportPreview>(org, `${base}/import/preview`, { method: "POST", body });
  },
  applyImport: (org: string, id: string) =>
    post<{ count: number; skipped: number }, object>(org, `import/${pathSegment(id)}/apply`, {}),
};
export function downloadAssetCsv(csv: string, name: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
