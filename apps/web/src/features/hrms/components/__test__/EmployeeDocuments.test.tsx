import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmployeeDocuments } from "../../workforce/employee-documents";
import { EmployeeProfileDrawer } from "../../workforce/employee-profile-drawer";
import { HrmsDocuments } from "../../documents";
import type { HrmsEmployee } from "@/services/hrms.service";
import { hrmsEmployeeProfileSchema } from "@dhriti/validation";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  library: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
  archive: vi.fn(),
  profile: vi.fn(),
  can: vi.fn(),
}));
vi.mock("@/services/hrms.service", () => ({
  hrmsService: {
    employees: {
      documents: mocks,
      profile: mocks.profile,
    },
  },
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org-a" } } }) }));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ loading: false, can: mocks.can }) }));
vi.mock("next/navigation", () => ({ useParams: () => ({ organizationSlug: "acme" }) }));
const document = {
  id: "doc-a",
  title: "Employment contract",
  category: "EMPLOYMENT",
  originalName: "contract.pdf",
  contentType: "application/pdf",
  sizeBytes: 123,
  createdAt: "2026-11-15T00:00:00Z",
  employee: { id: "employee-a", employeeNumber: "EMP-1", name: "Alex" },
};
const employee: HrmsEmployee = {
  id: "employee-a",
  employeeNumber: "EMP-1",
  status: "ACTIVE",
  createdAt: "",
  updatedAt: "",
  employmentType: null,
  startDate: null,
  endDate: null,
  biometricId: null,
  workLocationId: null,
  shiftId: null,
  departmentId: null,
  designationId: null,
  reportingManagerId: null,
  user: { id: "user-a", name: "Alex", email: "alex@example.test", avatarUrl: null },
  workLocation: null,
  shift: null,
  department: null,
  designation: null,
  reportingManager: null,
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.can.mockReturnValue(true);
  mocks.list.mockResolvedValue({ items: [document], total: 25, page: 1, pageSize: 20 });
  mocks.library.mockResolvedValue({ items: [document], total: 1, page: 1, pageSize: 20 });
  mocks.upload.mockResolvedValue(document);
  mocks.archive.mockResolvedValue(undefined);
  mocks.download.mockResolvedValue({ url: "https://storage.example.test/private", expiresIn: 900 });
  mocks.profile.mockResolvedValue({
    profile: hrmsEmployeeProfileSchema.parse({}),
    version: 0,
    catalog: { definitions: [], version: 0 },
  });
});

async function fillForm(file = new File(["%PDF-fixture"], "contract.pdf", { type: "application/pdf" })) {
  fireEvent.change(screen.getByRole("textbox", { name: "Document title" }), { target: { value: " Contract " } });
  fireEvent.change(screen.getByLabelText("Document file *"), { target: { files: [file] } });
}
describe("employee documents", () => {
  it("loads real document metadata and paginates in the employee scope", async () => {
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    await screen.findByText("Employment contract");
    expect(mocks.list).toHaveBeenCalledWith("org-a", "employee-a", 1, 20);
    expect(screen.getByText("contract.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous document page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next document page" }));
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith("org-a", "employee-a", 2, 20));
    await screen.findByText("Employment contract");
    fireEvent.change(screen.getByRole("combobox", { name: "Document rows per page" }), { target: { value: "10" } });
    await waitFor(() => expect(mocks.list).toHaveBeenLastCalledWith("org-a", "employee-a", 1, 10));
  });
  it("shows required field errors immediately below fields and uploads typed normalized metadata", async () => {
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    expect(screen.getByRole("textbox", { name: "Document title" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Document file *")).toHaveClass("border-error");
    expect(screen.getByText("Document title is required.")).toBeInTheDocument();
    expect(screen.getByText("A non-empty document file is required.")).toBeInTheDocument();
    const file = new File(["%PDF-fixture"], "contract.pdf", { type: "application/pdf" });
    await fillForm(file);
    fireEvent.click(screen.getByRole("button", { name: "Document category" }));
    fireEvent.click(screen.getByRole("option", { name: "Employment" }));
    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    await waitFor(() =>
      expect(mocks.upload).toHaveBeenCalledWith(
        "org-a",
        "employee-a",
        { title: "Contract", category: "EMPLOYMENT" },
        file,
      ),
    );
    await screen.findByText("Employee document uploaded.");
    expect(screen.getByRole("textbox", { name: "Document title" })).toHaveValue("");
    expect(screen.getByLabelText("Document file *")).toHaveValue("");
  });
  it("preserves drafts when uploads fail and exposes the API error", async () => {
    mocks.upload.mockRejectedValue(new Error("Storage unavailable"));
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable");
    expect(screen.getByRole("textbox", { name: "Document title" })).toHaveValue(" Contract ");
    expect(screen.getByRole("button", { name: "Upload document" })).toBeEnabled();
    expect(screen.queryByText("Employee document uploaded.")).not.toBeInTheDocument();
  });
  it.each([
    new File(["bad"], "file.zip", { type: "application/zip" }),
    new File([], "empty.pdf", { type: "application/pdf" }),
  ])("rejects empty/unsupported files before upload: %#", async (file) => {
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    await fillForm(file);
    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    expect(screen.getByLabelText("Document file *")).toHaveAttribute("aria-invalid", "true");
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("rejects files above the exact 10 MB limit", async () => {
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    const large = new File(["pdf"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(large, "size", { value: 10 * 1024 * 1024 + 1 });
    await fillForm(large);
    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    expect(screen.getByText("Employee documents must not exceed 10 MB.")).toBeInTheDocument();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("downloads through the employee route instead of the generic file API", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    fireEvent.click(await screen.findByRole("button", { name: "Download Employment contract" }));
    await waitFor(() => expect(mocks.download).toHaveBeenCalledWith("org-a", "employee-a", "doc-a"));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
  });
  it("confirms archive, retains the draft, and refreshes only after success", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    const archive = await screen.findByRole("button", { name: "Archive Employment contract" });
    fireEvent.click(archive);
    expect(mocks.archive).not.toHaveBeenCalled();
    expect(await screen.findByRole("dialog", { name: "Archive document?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Archive document?" })).not.toBeInTheDocument());
    fireEvent.click(archive);
    fireEvent.click(await screen.findByRole("button", { name: "Archive document", exact: true }));
    expect(confirm).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.archive).toHaveBeenCalledWith("org-a", "employee-a", "doc-a"));
    await screen.findByText("Employee document archived.");
    expect(mocks.list).toHaveBeenCalledTimes(2);
  });
  it("does not claim successful archive when the API fails", async () => {
    mocks.archive.mockRejectedValue(new Error("Document changed"));
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    fireEvent.click(await screen.findByRole("button", { name: "Archive Employment contract" }));
    fireEvent.click(await screen.findByRole("button", { name: "Archive document", exact: true }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Document changed");
    expect(screen.getByText("Employment contract")).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledTimes(1);
  });
  it("renders empty/error states and retries real loading", async () => {
    mocks.list
      .mockRejectedValueOnce(new Error("Documents unavailable"))
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20 });
    render(<EmployeeDocuments organizationId="org-a" employeeId="employee-a" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Documents unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry documents" }));
    await screen.findByText("No active employee documents on this page.");
    expect(screen.getByText("0–0 of 0")).toBeInTheDocument();
  });
  it("keeps document drafts across profile tabs and confirms closing with unsaved data", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const close = vi.fn();
    render(<EmployeeProfileDrawer organizationId="org-a" employee={employee} onClose={close} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    await screen.findByText("Employment contract");
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    expect(screen.getByRole("textbox", { name: "Document title" })).toHaveValue(" Contract ");
    fireEvent.click(screen.getByRole("button", { name: "Close profile" }));
    expect(await screen.findByRole("dialog", { name: "Discard unsaved changes?" })).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument());
    expect(screen.getByRole("textbox", { name: "Document title" })).toHaveValue(" Contract ");
    fireEvent.click(screen.getByRole("button", { name: "Close profile" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard changes" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it("uses live organization documents and does not render old demo metrics or upload to an unspecified employee", async () => {
    render(<HrmsDocuments />);
    await screen.findByText("Employment contract");
    expect(mocks.library).toHaveBeenCalledWith("org-a", 1, 20);
    expect(screen.getByText("Alex (EMP-1)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "employee directory" })).toHaveAttribute(
      "href",
      "/acme/hrms/employees/directory",
    );
    expect(screen.queryByText("8,426")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload document" })).not.toBeInTheDocument();
  });
  it("prevents closing a profile while its document upload is in progress", async () => {
    let finish: (value: unknown) => void = () => {};
    mocks.upload.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const close = vi.fn();
    render(<EmployeeProfileDrawer organizationId="org-a" employee={employee} onClose={close} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Documents" }));
    await fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Upload document" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Close profile" })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Edit job details" })).toBeDisabled();
    finish(document);
    await waitFor(() => expect(screen.getByRole("button", { name: "Close profile" })).toBeEnabled());
    expect(close).not.toHaveBeenCalled();
  });
  it("does not load the library without workforce permission", async () => {
    mocks.can.mockReturnValue(false);
    render(<HrmsDocuments />);
    expect(screen.getByRole("alert")).toHaveTextContent("Workforce management permission is required");
    expect(mocks.library).not.toHaveBeenCalled();
  });
});
