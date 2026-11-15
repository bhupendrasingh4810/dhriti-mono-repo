import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HrmsAssets, MyAssets } from "../../assets";
import { AssetEditor } from "../../asset-editor";
import { AssetCustodyDialog } from "../../asset-custody";
import { AssetEmployeePicker } from "../../asset-employee-picker";
import type { HrmsAsset } from "@/services/hrms.service";

const mocks = vi.hoisted(() => ({
  permissions: ["hrms.asset.read", "hrms.asset.manage"] as string[],
  list: vi.fn(),
  categories: vi.fn(),
  saveCategory: vi.fn(),
  employees: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  issue: vi.fn(),
  returnAsset: vi.fn(),
  history: vi.fn(),
  mine: vi.fn(),
  acknowledge: vi.fn(),
  clearance: vi.fn(),
  remove: vi.fn(),
  export: vi.fn(),
  requestReplacement: vi.fn(),
  requests: vi.fn(),
  decideRequest: vi.fn(),
}));
vi.mock("@/services/hrms-assets.service", () => ({
  hrmsAssetsService: {
    requestReplacement: mocks.requestReplacement,
    requests: mocks.requests,
    decideRequest: mocks.decideRequest,
  },
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org" } } }) }));
vi.mock("@/hooks/use-permissions", () => ({
  usePermissions: () => ({ can: (key: string) => mocks.permissions.includes(key), loading: false }),
}));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { assets: mocks } }));
const asset: HrmsAsset = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Developer laptop",
  assetTag: "DEV-001",
  serialNumber: null,
  type: "LAPTOP",
  condition: "GOOD",
  status: "AVAILABLE",
  revision: 1,
  category: null,
  categoryId: null,
  customCategory: null,
  brand: "Example",
  model: null,
  specifications: null,
  location: null,
  custodianEmployeeId: null,
  purchaseDate: null,
  purchaseCost: "1000.000",
  currency: "INR",
  vendor: null,
  warrantyExpiresOn: null,
  expectedReturnDate: null,
  acknowledgedAt: null,
  archivedAt: null,
  notes: null,
  assignedEmployeeId: null,
  assignedEmployee: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.permissions = ["hrms.asset.read", "hrms.asset.manage"];
  mocks.list.mockResolvedValue({
    items: [asset],
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    summary: { total: 1, assigned: 0, available: 1, maintenance: 0 },
  });
  mocks.categories.mockResolvedValue([]);
  mocks.employees.mockResolvedValue({ items: [], total: 0 });
  mocks.mine.mockResolvedValue({ items: [], total: 0 });
  mocks.requests.mockResolvedValue({ items: [], total: 0 });
  mocks.history.mockResolvedValue({ items: [], total: 0 });
  mocks.clearance.mockResolvedValue({ clear: true, outstanding: [], scope: "ASSETS_ONLY" });
});
afterEach(cleanup);
describe("asset workspace", () => {
  it("loads real inventory without fetching the employee directory and keeps query input mounted", async () => {
    render(<HrmsAssets onToast={vi.fn()} />);
    expect(await screen.findByText("Developer laptop")).toBeInTheDocument();
    expect(screen.getByText("Not recorded")).toBeInTheDocument();
    expect(mocks.employees).not.toHaveBeenCalled();
    const search = screen.getByRole("textbox", { name: "Search inventory" });
    fireEvent.change(search, { target: { value: "DEV" } });
    expect(screen.getByRole("textbox", { name: "Search inventory" })).toBe(search);
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith("org", expect.objectContaining({ search: "DEV" })));
    fireEvent.click(screen.getByRole("button", { name: "Sort by Asset" }));
    await waitFor(() =>
      expect(mocks.list).toHaveBeenLastCalledWith(
        "org",
        expect.objectContaining({ sortBy: "name", sortOrder: "desc" }),
      ),
    );
  });
  it("shows self-service without requiring inventory read permissions", async () => {
    mocks.permissions = [];
    mocks.mine.mockResolvedValue({ items: [{ ...asset, acknowledgedAt: null }], total: 1 });
    render(<MyAssets organizationId="org" />);
    expect(await screen.findByText("Developer laptop")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inventory" })).not.toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.employees).not.toHaveBeenCalled();
    expect(screen.queryByText("1000.000")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge receipt" }));
    const dialog = screen.getByRole("dialog", { name: "Acknowledge asset receipt?" });
    expect(mocks.acknowledge).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Acknowledge" }));
    await waitFor(() => expect(mocks.acknowledge).toHaveBeenCalledWith("org", asset.id, 1));
  });
  it("blocks direct management-page access for users without asset.manage", async () => {
    mocks.permissions = ["hrms.asset.read"];
    render(<HrmsAssets onToast={vi.fn()} />);
    expect(screen.getByText(/Asset management is restricted/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add asset" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit DEV-001" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archive DEV-001" })).not.toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it("submits replacement requests only from the employee asset card with the current revision", async () => {
    mocks.mine.mockResolvedValue({ items: [asset], total: 1 });
    const request = {
      id: "request",
      assetId: asset.id,
      isOwn: true,
      reason: "Battery fails",
      status: "PENDING",
      canDecide: false,
      canFulfil: false,
      asset: { assetTag: asset.assetTag, name: asset.name },
      managerUserId: "manager",
    };
    mocks.requestReplacement.mockImplementation(async () => {
      mocks.requests.mockResolvedValue({ items: [request], total: 1 });
      return request;
    });
    render(<MyAssets organizationId="org" />);
    fireEvent.click(await screen.findByRole("button", { name: "Request replacement" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
    expect(screen.getByRole("textbox", { name: /Reason/ })).toHaveAttribute("aria-invalid", "true");
    expect(mocks.requestReplacement).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: /Reason/ }), { target: { value: "Battery fails" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
    await waitFor(() =>
      expect(mocks.requestReplacement).toHaveBeenCalledWith("org", {
        assetId: asset.id,
        revision: 1,
        reason: "Battery fails",
      }),
    );
    fireEvent.click(await screen.findByRole("button", { name: "Replacement requested" }));
    const details = screen.getByRole("dialog", { name: "Replacement request details" });
    expect(within(details).getByText("Battery fails")).toBeInTheDocument();
    expect(within(details).getByText("Awaiting reporting manager approval.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request replacement" })).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Rows per page:")).not.toBeInTheDocument();
    expect(screen.queryByText("View all")).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "My assets" })).toHaveLength(1);
  });
  it("keeps an approved request visible after the original equipment is returned", async () => {
    mocks.requests.mockResolvedValue({
      items: [
        {
          id: "request",
          assetId: asset.id,
          isOwn: true,
          reason: "Battery fails",
          status: "APPROVED",
          canFulfil: false,
          canDecide: false,
          asset: { name: asset.name, assetTag: asset.assetTag },
        },
      ],
      total: 1,
    });
    render(<MyAssets organizationId="org" />);
    fireEvent.click(await screen.findByRole("button", { name: "Replacement requested" }));
    expect(screen.getByText("Original equipment returned · awaiting replacement")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Replacement request details" })).toHaveTextContent(
      "Manager review approved",
    );
    expect(screen.queryByRole("button", { name: "Send new asset" })).not.toBeInTheDocument();
  });
  it("offers approved replacements to authorized HR/Admin in the same compact card", async () => {
    mocks.requests.mockResolvedValue({
      items: [
        {
          id: "request",
          assetId: asset.id,
          isOwn: false,
          reason: "Battery fails",
          status: "APPROVED",
          canFulfil: true,
          canDecide: false,
          asset: { name: asset.name, assetTag: asset.assetTag },
          requestedFor: { user: { name: "Priya Verma" }, employeeNumber: "EMP-7" },
        },
      ],
      total: 1,
    });
    render(<MyAssets organizationId="org" />);
    fireEvent.click(await screen.findByRole("button", { name: "Send new asset" }));
    const details = screen.getByRole("dialog", { name: "Replacement request details" });
    expect(details).toHaveTextContent("Priya Verma");
    fireEvent.click(within(details).getByRole("button", { name: "Send new asset" }));
    expect(screen.getByRole("dialog", { name: "Select replacement equipment" })).toHaveTextContent(
      "First verify return",
    );
    expect(mocks.decideRequest).not.toHaveBeenCalled();
  });
  it("surfaces request-loading failures without allowing a duplicate request", async () => {
    mocks.mine.mockResolvedValue({ items: [asset], total: 1 });
    mocks.requests.mockRejectedValueOnce(new Error("Requests unavailable"));
    render(<MyAssets organizationId="org" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Requests unavailable");
    expect(screen.queryByRole("button", { name: "Request replacement" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry replacement requests" }));
    expect(await screen.findByRole("button", { name: "Request replacement" })).toBeInTheDocument();
  });
  it("loads every asset page without exposing table pagination", async () => {
    mocks.mine.mockImplementation(async (_org, page) =>
      page === 1 ? { items: [asset], total: 2 } : { items: [{ ...asset, id: "second", name: "Work phone" }], total: 2 },
    );
    render(<MyAssets organizationId="org" />);
    expect(await screen.findByText("Work phone")).toBeInTheDocument();
    expect(mocks.mine).toHaveBeenCalledWith("org", 2, 100);
    expect(screen.queryByText("Rows per page:")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("archives only after confirmation and sends the current revision", async () => {
    const toast = vi.fn();
    render(<HrmsAssets onToast={toast} />);
    await screen.findByText("Developer laptop");
    fireEvent.click(screen.getByRole("button", { name: "Archive DEV-001" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Archive asset?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("org", asset.id, 1));
    expect(toast).toHaveBeenCalledWith("Asset archived; history retained.");
  });
  it("surfaces stale archive failures without reporting success", async () => {
    mocks.remove.mockRejectedValue(new Error("Asset changed. Reload before saving."));
    const toast = vi.fn();
    render(<HrmsAssets onToast={toast} />);
    await screen.findByText("Developer laptop");
    fireEvent.click(screen.getByRole("button", { name: "Archive DEV-001" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Archive asset?" })).getByRole("button", { name: "Archive" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Asset changed");
    expect(toast).not.toHaveBeenCalled();
  });
  it("surfaces inventory failure with a working retry", async () => {
    mocks.list.mockRejectedValueOnce(new Error("Inventory unavailable"));
    render(<HrmsAssets onToast={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Inventory unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry inventory" }));
    expect(await screen.findByText("Developer laptop")).toBeInTheDocument();
  });
});
describe("asset register editor", () => {
  it("validates required fields inline, then creates inventory without requiring serial", async () => {
    const done = vi.fn();
    render(<AssetEditor organizationId="org" asset={null} categories={[]} onClose={vi.fn()} onDone={done} />);
    fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
    expect(screen.getByRole("textbox", { name: /Asset name/ })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: /Asset tag/ })).toHaveAttribute("aria-invalid", "true");
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: /Asset name/ }), { target: { value: "Desk" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Asset tag/ }), { target: { value: "DESK-001" } });
    fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        "org",
        expect.objectContaining({ name: "Desk", assetTag: "DESK-001", serialNumber: "" }),
      ),
    );
    expect(done).toHaveBeenCalled();
  });
  it("sends edit revision and retains values on a stale-write error", async () => {
    mocks.update.mockRejectedValue(new Error("Asset changed. Reload before saving."));
    render(<AssetEditor organizationId="org" asset={asset} categories={[]} onClose={vi.fn()} onDone={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: /Asset name/ }), { target: { value: "New name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save asset" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Asset changed");
    expect(mocks.update).toHaveBeenCalledWith(
      "org",
      asset.id,
      expect.objectContaining({ name: "New name", revision: 1 }),
    );
    expect(screen.getByRole("textbox", { name: /Asset name/ })).toHaveValue("New name");
  });
});
describe("asset handover", () => {
  it("requires the issue employee and notes inline rather than sending invalid requests", () => {
    render(<AssetCustodyDialog organizationId="org" asset={asset} action="ISSUE" onClose={vi.fn()} onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Issue asset" }));
    expect(screen.getByText("Choose an employee.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Handover notes/ })).toHaveAttribute("aria-invalid", "true");
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("records verified return with condition, notes, disposition and revision", async () => {
    render(
      <AssetCustodyDialog
        organizationId="org"
        asset={{ ...asset, status: "ASSIGNED", assignedEmployeeId: "employee" }}
        action="RETURN"
        onClose={vi.fn()}
        onDone={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: /Handover notes/ }), {
      target: { value: "Returned with charger" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify return" }));
    await waitFor(() =>
      expect(mocks.returnAsset).toHaveBeenCalledWith("org", asset.id, {
        revision: 1,
        condition: "GOOD",
        notes: "Returned with charger",
        status: "AVAILABLE",
      }),
    );
    expect(mocks.employees).not.toHaveBeenCalled();
  });
});
describe("asset employee search", () => {
  it("loads beyond the first 100 and retains the selected chip across remote searches", async () => {
    let selected: { id: string; label: string } | null = null;
    const employee = (index: number) => ({
      id: `employee-${index}`,
      employeeNumber: `EMP-${index}`,
      user: { name: `Employee ${index}` },
    });
    mocks.employees.mockImplementation((_org, query) =>
      Promise.resolve({
        items: query.query
          ? [employee(151)]
          : Array.from({ length: 50 }, (_, index) => employee((query.page - 1) * 50 + index + 1)),
        total: query.query ? 1 : 151,
      }),
    );
    const change = vi.fn((value) => {
      selected = value;
    });
    const panel = render(<AssetEmployeePicker organizationId="org" value={null} onChange={change} label="Employee" />);
    fireEvent.click(screen.getByRole("combobox", { name: /Employee/ }));
    await waitFor(() => expect(mocks.employees).toHaveBeenCalledWith("org", expect.objectContaining({ page: 1 })));
    fireEvent.click(await screen.findByRole("button", { name: "Load more employees" }));
    await waitFor(() => expect(mocks.employees).toHaveBeenLastCalledWith("org", expect.objectContaining({ page: 2 })));
    await waitFor(() => expect(screen.getByRole("button", { name: "Load more employees" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Load more employees" }));
    await waitFor(() => expect(mocks.employees).toHaveBeenLastCalledWith("org", expect.objectContaining({ page: 3 })));
    const search = screen.getByPlaceholderText("Search by name or employee number");
    fireEvent.change(search, { target: { value: "Employee 151" } });
    fireEvent.click(await screen.findByRole("option", { name: /Employee 151/ }));
    expect(change).toHaveBeenCalledWith({ id: "employee-151", label: "Employee 151 (EMP-151)" });
    panel.rerender(<AssetEmployeePicker organizationId="org" value={selected} onChange={change} label="Employee" />);
    expect(screen.getByRole("button", { name: "Remove Employee 151 (EMP-151)" })).toBeInTheDocument();
  });
});
