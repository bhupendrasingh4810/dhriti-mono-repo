import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { AssetOperations, AssetRequests } from "../../asset-operations";
import { HrmsSidebar } from "../../hrms-sidebar";

const mocks = vi.hoisted(() => ({
  held: ["hrms.asset.manage", "hrms.asset.read", "hrms.payroll.manage", "hrms.workforce.manage"] as string[],
  requests: vi.fn(),
  assetList: vi.fn(),
  decideRequest: vi.fn(),
  maintenance: vi.fn(),
  closeMaintenance: vi.fn(),
  stock: vi.fn(),
  stockItems: vi.fn(),
  createStock: vi.fn(),
  observeStock: vi.fn(),
  resolveStock: vi.fn(),
  completeStock: vi.fn(),
  procurement: vi.fn(),
  createProcurement: vi.fn(),
  decideProcurement: vi.fn(),
  depreciation: vi.fn(),
  configureDepreciation: vi.fn(),
  accounting: vi.fn(),
  previewImport: vi.fn(),
  applyImport: vi.fn(),
  importTemplate: vi.fn(),
  downloadAssetCsv: vi.fn(),
}));
vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ can: (key: string) => mocks.held.includes(key), loading: false }),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "actor", organization: { id: "org" } } }) }));
vi.mock("@/services/hrms-assets.service", () => ({
  hrmsAssetsService: mocks,
  downloadAssetCsv: mocks.downloadAssetCsv,
}));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { assets: { list: mocks.assetList } } }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ organizationSlug: "synthetic" }),
  usePathname: () => "/synthetic/hrms",
}));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@/components/layout/workspace/page-sidebar", () => ({
  PageSidebar: ({ children }: ComponentProps<"div">) => <div>{children}</div>,
}));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.held = ["hrms.asset.manage", "hrms.asset.read", "hrms.payroll.manage", "hrms.workforce.manage"];
  mocks.requests.mockResolvedValue({ items: [], total: 0 });
  mocks.assetList.mockResolvedValue({ items: [], total: 0, totalPages: 1 });
  mocks.maintenance.mockResolvedValue({ items: [], total: 0 });
  mocks.stock.mockResolvedValue([]);
  mocks.procurement.mockResolvedValue({ items: [], total: 0 });
  mocks.depreciation.mockResolvedValue({
    method: "DISABLED",
    revision: 0,
    usefulLifeMonths: null,
    residualPercent: null,
  });
});
afterEach(cleanup);
describe("HRMS sidebar permissions", () => {
  it("hides asset and workforce links without their exact manage permissions", () => {
    mocks.held = ["hrms.asset.read", "hrms.employee.manage"];
    render(<HrmsSidebar />);
    expect(screen.queryByRole("link", { name: "Assets" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Workforce" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });
  it("shows links for their independent manage grants", () => {
    render(<HrmsSidebar />);
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute("href", "/synthetic/hrms/assets");
    expect(screen.getByRole("link", { name: "Workforce" })).toHaveAttribute("href", "/synthetic/hrms/employees");
  });
});
describe("asset operational UI", () => {
  it("sends an approved replacement only after equipment selection and a validated handover note", async () => {
    mocks.requests.mockResolvedValue({
      items: [
        {
          id: "request",
          assetId: "original",
          reason: "Battery fails",
          revision: 3,
          status: "APPROVED",
          canDecide: false,
          canFulfil: true,
          asset: { assetTag: "IT-001", name: "Laptop" },
        },
      ],
      total: 1,
    });
    mocks.assetList.mockResolvedValue({
      items: [
        { id: "00000000-0000-4000-8000-000000000002", name: "Replacement laptop", assetTag: "IT-002", revision: 4 },
      ],
      total: 1,
      totalPages: 1,
    });
    render(<AssetRequests organizationId="org" />);
    fireEvent.click(await screen.findByRole("button", { name: "Send new asset" }));
    fireEvent.click(screen.getByRole("combobox", { name: /Available replacement/ }));
    fireEvent.click(await screen.findByRole("option", { name: /IT-002/ }));
    fireEvent.click(screen.getByRole("button", { name: "Send new asset" }));
    expect(mocks.decideRequest).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: /Decision \/ handover note/ }), {
      target: { value: "Original returned; replacement issued" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send new asset" }));
    await waitFor(() =>
      expect(mocks.decideRequest).toHaveBeenCalledWith("org", "request", {
        revision: 3,
        action: "FULFIL",
        note: "Original returned; replacement issued",
        replacementAssetId: "00000000-0000-4000-8000-000000000002",
        assetRevision: 4,
      }),
    );
  });
  it("records explicit manager decisions with revision and reason", async () => {
    mocks.requests.mockResolvedValue({
      items: [
        {
          id: "request",
          assetId: "asset",
          reason: "Battery fails",
          revision: 3,
          status: "PENDING",
          managerUserId: "manager",
          canDecide: true,
          canFulfil: false,
          asset: { assetTag: "IT-001", name: "Laptop" },
        },
      ],
      total: 1,
    });
    render(<AssetRequests organizationId="org" />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.decideRequest).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: /Decision \/ handover note/ }), {
      target: { value: "Approved replacement" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.decideRequest).toHaveBeenCalledWith("org", "request", {
        revision: 3,
        action: "APPROVE",
        note: "Approved replacement",
      }),
    );
  });
  it("does not expose decision controls to an ordinary request viewer", async () => {
    mocks.requests.mockResolvedValue({
      items: [
        {
          id: "request",
          reason: "Battery fails",
          revision: 1,
          status: "PENDING",
          managerUserId: null,
          canDecide: false,
          canFulfil: false,
          asset: { assetTag: "IT-001", name: "Laptop" },
        },
      ],
      total: 1,
    });
    render(<AssetRequests organizationId="org" />);
    await screen.findByText("Battery fails");
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.getByText(/explicit asset-manager review required/)).toBeInTheDocument();
  });
  it("closes repairs with actual cost, currency, condition and disposition", async () => {
    mocks.maintenance.mockResolvedValue({
      items: [
        {
          id: "repair",
          revision: 2,
          fault: "Broken screen",
          status: "OPEN",
          vendor: "Repair vendor",
          asset: { assetTag: "IT-001", name: "Laptop", revision: 5 },
        },
      ],
      total: 1,
    });
    render(<AssetOperations organizationId="org" />);
    fireEvent.click(screen.getByRole("button", { name: "Maintenance" }));
    fireEvent.click(await screen.findByRole("button", { name: "Close repair" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Resolution/ }), { target: { value: "Screen replaced" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Repair cost/ }), { target: { value: "150.125" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Currency/ }), { target: { value: "INR" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.closeMaintenance).toHaveBeenCalledWith("org", "repair", {
        revision: 2,
        assetRevision: 5,
        resolution: "Screen replaced",
        cost: "150.125",
        currency: "INR",
        condition: "GOOD",
        status: "AVAILABLE",
      }),
    );
  });
  it("starts a persisted stock session rather than pretending inventory was verified", async () => {
    mocks.createStock.mockResolvedValue({ id: "stock", name: "Quarterly check", revision: 1, status: "OPEN" });
    mocks.stockItems.mockResolvedValue({
      check: { id: "stock", name: "Quarterly check", revision: 1, status: "OPEN" },
      items: [],
      total: 0,
    });
    render(<AssetOperations organizationId="org" />);
    fireEvent.click(screen.getByRole("button", { name: "Stock" }));
    fireEvent.click(await screen.findByRole("button", { name: "Start stock check" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Stock check name/ }), {
      target: { value: "Quarterly check" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.createStock).toHaveBeenCalledWith("org", "Quarterly check"));
    expect(mocks.completeStock).not.toHaveBeenCalled();
  });
  it("validates purchase amounts and submits procurement as a request", async () => {
    render(<AssetOperations organizationId="org" />);
    fireEvent.click(screen.getByRole("button", { name: "Procurement" }));
    fireEvent.click(await screen.findByRole("button", { name: "Request purchase" }));
    for (const [label, value] of [
      ["Equipment", "Monitors"],
      ["Quantity", "2"],
      ["Estimated total cost", "-100"],
      ["Currency", "INR"],
      ["Business reason", "New team"],
    ]) {
      fireEvent.change(screen.getByRole("textbox", { name: new RegExp(label) }), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/nonnegative amount/)).toBeInTheDocument();
    expect(mocks.createProcurement).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: /Estimated total cost/ }), { target: { value: "200.000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mocks.createProcurement).toHaveBeenCalledWith("org", {
        name: "Monitors",
        quantity: 2,
        estimatedCost: "200.000",
        currency: "INR",
        reason: "New team",
      }),
    );
  });
  it("leaves depreciation disabled until finance configures it and exports a real CSV", async () => {
    mocks.accounting.mockResolvedValue({ csv: "Asset tag,Cost", rows: [] });
    render(<AssetOperations organizationId="org" />);
    fireEvent.click(screen.getByRole("button", { name: "Finance" }));
    expect(await screen.findByText("Disabled")).toBeInTheDocument();
    expect(mocks.configureDepreciation).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: /Accounting as-of date/ }), {
      target: { value: "2026-11-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Export accounting CSV" }));
    await waitFor(() => expect(mocks.accounting).toHaveBeenCalledWith("org", "2026-11-15"));
    expect(mocks.downloadAssetCsv).toHaveBeenCalledWith("Asset tag,Cost", "asset-accounting-2026-11-15.csv");
  });
  it("disables import application when preview contains errors", async () => {
    mocks.previewImport.mockResolvedValue({
      id: "preview",
      valid: 0,
      total: 1,
      rows: [{ row: 2, input: { assetTag: "DUP" }, errors: ["Asset tag already exists."] }],
    });
    render(<AssetOperations organizationId="org" />);
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    fireEvent.change(screen.getByLabelText("Inventory CSV"), {
      target: { files: [new File(["name,assetTag,type"], "assets.csv", { type: "text/csv" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
    expect(await screen.findByText("0 of 1 rows valid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply validated import" })).toBeDisabled();
    expect(mocks.applyImport).not.toHaveBeenCalled();
  });
  it("imports valid rows from a mixed server-owned preview and explicitly reports skipped errors", async () => {
    mocks.previewImport.mockResolvedValue({
      id: "preview",
      valid: 1,
      total: 2,
      rows: [
        { row: 2, input: { assetTag: "IT-001" }, errors: [] },
        { row: 3, input: null, errors: ["Name is required"] },
      ],
    });
    mocks.applyImport.mockResolvedValue({ count: 1, skipped: 1 });
    render(<AssetOperations organizationId="org" />);
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    fireEvent.change(screen.getByLabelText("Inventory CSV"), {
      target: { files: [new File(["name,assetTag,type"], "assets.csv")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview import" }));
    fireEvent.click(await screen.findByRole("button", { name: "Apply validated import" }));
    expect(await screen.findByText("Imported 1 assets. Skipped 1 invalid rows.")).toBeInTheDocument();
    expect(mocks.applyImport).toHaveBeenCalledWith("org", "preview");
  });
});
