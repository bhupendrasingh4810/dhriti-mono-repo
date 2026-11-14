import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationBankAccounts } from "../../OrganizationBankAccounts";
import { organizationBankService, type OrganizationBankWorkspace } from "@/services/organization-bank.service";
import { COUNTRY_OPTIONS } from "@/lib/country-currency-options";
import { ApiRequestError } from "@/services/http.service";

const auth = vi.hoisted(() => ({ organizationId: "org-a", actorId: "reviewer", manage: true }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: auth.actorId, organization: { id: auth.organizationId } } }),
}));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ can: () => auth.manage }) }));
vi.mock("@/services/organization-bank.service", () => ({
  organizationBankService: {
    list: vi.fn(),
    create: vi.fn(),
    review: vi.fn(),
    reviewEvidence: vi.fn(),
    archive: vi.fn(),
    verify: vi.fn(),
  },
}));
vi.mock("@dhriti/ui/dialog", () => ({
  Dialog: ({
    open,
    title,
    children,
    primaryActionLabel,
    onPrimaryAction,
    onClose,
    isSubmitting,
    secondaryActionLabel = "Cancel",
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    primaryActionLabel?: string;
    onPrimaryAction: () => void;
    onClose: () => void;
    isSubmitting: boolean;
    secondaryActionLabel?: string;
  }) =>
    !open ? null : (
      <section role="dialog" aria-label={title}>
        {children}
        <button disabled={isSubmitting} onClick={onClose}>
          {secondaryActionLabel}
        </button>
        {primaryActionLabel && (
          <button disabled={isSubmitting} onClick={onPrimaryAction}>
            {primaryActionLabel}
          </button>
        )}
      </section>
    ),
}));
const account = {
  id: "bank-a",
  label: "Payroll funding",
  bankName: "Example Bank",
  accountHolder: "Example Organization",
  countryCode: "GB",
  currency: "GBP",
  accountType: "IBAN" as const,
  lastFour: "5432",
  formatCheck: "IBAN_CHECKSUM",
  reviewStatus: "PENDING" as const,
  createdById: "creator",
  reviewedById: null,
  reviewedAt: null,
  archivedAt: null,
  createdAt: "2026-11-14T00:00:00Z",
};
const workspace: OrganizationBankWorkspace = {
  accounts: [account],
  capabilities: {
    encryptedStorageAvailable: true,
    providerConnected: false,
    ownershipVerificationAvailable: false,
    paymentsAvailable: false,
    methods: [],
  },
};
beforeEach(() => {
  vi.resetAllMocks();
  auth.organizationId = "org-a";
  auth.actorId = "reviewer";
  auth.manage = true;
  vi.mocked(organizationBankService.list).mockResolvedValue(workspace);
});
afterEach(cleanup);

async function openCreate() {
  render(<OrganizationBankAccounts />);
  await screen.findByText("Payroll funding");
  fireEvent.click(screen.getByRole("button", { name: "Add bank account" }));
  return screen.getByRole("dialog", { name: "Add organization bank account" });
}
function fillAccount(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText("Account label"), { target: { value: "New funding" } });
  fireEvent.change(within(dialog).getByLabelText("Account holder / legal name"), {
    target: { value: "Example Organization" },
  });
  fireEvent.change(within(dialog).getByLabelText("Bank name"), { target: { value: "Example Bank" } });
  fireEvent.change(within(dialog).getByLabelText("Bank country"), { target: { value: "GB" } });
  fireEvent.change(within(dialog).getByLabelText("Account currency"), { target: { value: "GBP" } });
  fireEvent.change(within(dialog).getByLabelText("Account format"), { target: { value: "IBAN" } });
  fireEvent.change(within(dialog).getByLabelText("IBAN"), { target: { value: "GB82WEST12345698765432" } });
  fireEvent.change(within(dialog).getByLabelText("Confirm account number / IBAN"), {
    target: { value: "GB82WEST12345698765432" },
  });
}

describe("organization bank settings", () => {
  it("uses the complete shared country catalog without changing HRMS options", () => {
    expect(COUNTRY_OPTIONS).toHaveLength(249);
    expect(COUNTRY_OPTIONS.find((country) => country.code === "PH")?.name).toBe("Philippines");
  });
  it("shows masked accounts and honest verification limits without calling a provider", async () => {
    render(<OrganizationBankAccounts />);
    const card = await screen.findByRole("article", { name: "Payroll funding ending 5432" });
    expect(card).toHaveTextContent("IBAN **** 5432");
    expect(card).toHaveTextContent("Bank ownership: not verified");
    expect(card).toHaveTextContent("national length/branch not certified");
    expect(screen.getByText(/No bank provider connected/)).toBeInTheDocument();
    expect(organizationBankService.verify).not.toHaveBeenCalled();
    expect(organizationBankService.list).toHaveBeenCalledWith("org-a");
  });
  it("marks every missing required field red with an inline error and never submits invalid details", async () => {
    const dialog = await openCreate();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save bank account" }));
    for (const label of [
      "Account label",
      "Account holder / legal name",
      "Bank name",
      "Bank country",
      "Account currency",
      "Account number",
      "Routing / branch code",
      "Confirm account number / IBAN",
    ]) {
      const field = within(dialog).getByLabelText(label);
      expect(field).toHaveAttribute("aria-invalid", "true");
      expect(field).toHaveClass("border-error");
      expect(field.parentElement?.querySelector('[role="alert"]')).toBeInTheDocument();
    }
    expect(organizationBankService.create).not.toHaveBeenCalled();
  });
  it("requires matching account confirmation and saves via the tenant API, clearing entered financial details", async () => {
    const dialog = await openCreate();
    fillAccount(dialog);
    fireEvent.change(within(dialog).getByLabelText("Confirm account number / IBAN"), { target: { value: "wrong" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save bank account" }));
    expect(within(dialog).getByText("Account numbers must match.")).toBeInTheDocument();
    expect(organizationBankService.create).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText("Confirm account number / IBAN"), {
      target: { value: "GB82 WEST 1234 5698 7654 32" },
    });
    vi.mocked(organizationBankService.create).mockResolvedValue(account);
    fireEvent.click(within(dialog).getByRole("button", { name: "Save bank account" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(organizationBankService.create).toHaveBeenCalledWith(
      "org-a",
      expect.objectContaining({
        countryCode: "GB",
        currency: "GBP",
        accountType: "IBAN",
        accountNumber: "GB82WEST12345698765432",
      }),
    );
    expect(vi.mocked(organizationBankService.create).mock.calls[0][1]).not.toHaveProperty("confirmAccount");
    expect(organizationBankService.list).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "Add bank account" }));
    expect(screen.getByLabelText("Account number")).toHaveValue("");
    expect(screen.getByLabelText("Confirm account number / IBAN")).toHaveValue("");
  });
  it("shows API failures without a success-shaped response", async () => {
    const dialog = await openCreate();
    fillAccount(dialog);
    vi.mocked(organizationBankService.create).mockRejectedValue(
      new ApiRequestError("IBAN checksum is invalid", 400, {
        error: { details: { fieldErrors: { accountNumber: "IBAN checksum is invalid" } } },
      }),
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Save bank account" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("IBAN checksum is invalid");
    expect(within(dialog).getByLabelText("IBAN")).toHaveClass("border-error");
    expect(within(dialog).getByLabelText("IBAN").parentElement?.querySelector('[role="alert"]')).toHaveTextContent(
      "IBAN checksum is invalid",
    );
    expect(screen.queryByText(/Bank account saved/)).not.toBeInTheDocument();
  });
  it.each(["ACCEPT", "REJECT"] as const)(
    "requires evidence and notes for independent %s and records only manual status",
    async (decision) => {
      render(<OrganizationBankAccounts />);
      await screen.findByText("Payroll funding");
      fireEvent.click(screen.getByRole("button", { name: decision === "ACCEPT" ? "Review documents" : "Reject" }));
      const dialog = screen.getByRole("dialog");
      const action = within(dialog).getByRole("button", {
        name: decision === "ACCEPT" ? "Record manual review" : "Reject review",
      });
      fireEvent.click(action);
      expect(within(dialog).getByLabelText("Evidence reference")).toHaveClass("border-error");
      expect(within(dialog).getByLabelText("Review note")).toHaveClass("border-error");
      expect(organizationBankService.review).not.toHaveBeenCalled();
      fireEvent.change(within(dialog).getByLabelText("Evidence reference"), { target: { value: "secure-doc-ref" } });
      fireEvent.change(within(dialog).getByLabelText("Review note"), {
        target: { value: "Checked legal name and account ending" },
      });
      vi.mocked(organizationBankService.review).mockResolvedValue({
        ...account,
        reviewStatus: decision === "ACCEPT" ? "MANUALLY_REVIEWED" : "REJECTED",
      });
      fireEvent.click(action);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(organizationBankService.review).toHaveBeenCalledWith("org-a", "bank-a", {
        decision,
        evidenceReference: "secure-doc-ref",
        note: "Checked legal name and account ending",
      });
      expect(screen.getByRole("status")).toHaveTextContent("No ownership verification or bank transfer was performed");
    },
  );
  it("does not offer self-review, missing-encryption writes, or unauthorized banking access", async () => {
    auth.actorId = "creator";
    const { rerender } = render(<OrganizationBankAccounts />);
    await screen.findByText("Payroll funding");
    expect(screen.queryByRole("button", { name: "Review documents" })).not.toBeInTheDocument();
    expect(screen.getByText(/Another administrator/)).toBeInTheDocument();
    auth.organizationId = "org-b";
    vi.mocked(organizationBankService.list).mockResolvedValue({
      ...workspace,
      capabilities: { ...workspace.capabilities, encryptedStorageAvailable: false },
    });
    rerender(<OrganizationBankAccounts />);
    expect(await screen.findByRole("alert")).toHaveTextContent("SECRETS_ENCRYPTION_KEY");
    expect(screen.getByRole("button", { name: "Add bank account" })).toBeDisabled();
    auth.manage = false;
    rerender(<OrganizationBankAccounts />);
    expect(screen.queryByText("Organization bank accounts")).not.toBeInTheDocument();
    expect(organizationBankService.list).toHaveBeenCalledTimes(2);
  });
  it("explicitly loads read-only review evidence instead of returning it in account lists", async () => {
    vi.mocked(organizationBankService.list).mockResolvedValue({
      ...workspace,
      accounts: [{ ...account, reviewStatus: "REJECTED" }],
    });
    vi.mocked(organizationBankService.reviewEvidence).mockResolvedValue({
      evidenceReference: "secure-ref",
      note: "Legal name mismatch",
      reviewedById: "reviewer",
      reviewedAt: "2026-11-14",
    });
    render(<OrganizationBankAccounts />);
    await screen.findByText("Review rejected");
    expect(organizationBankService.reviewEvidence).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "View review evidence" }));
    await waitFor(() => expect(screen.getByLabelText("Review note")).toHaveValue("Legal name mismatch"));
    expect(screen.getByLabelText("Review note")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Evidence reference")).toHaveValue("secure-ref");
    expect(organizationBankService.reviewEvidence).toHaveBeenCalledWith("org-a", "bank-a");
    expect(screen.queryByRole("button", { name: "Record manual review" })).not.toBeInTheDocument();
  });
  it("confirms archive, retains archived history and surfaces loading failures with retry", async () => {
    vi.mocked(organizationBankService.list).mockRejectedValueOnce(new Error("Bank settings unavailable"));
    render(<OrganizationBankAccounts />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Bank settings unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry bank accounts" }));
    await screen.findByText("Payroll funding");
    fireEvent.click(screen.getByRole("button", { name: "Archive Payroll funding" }));
    expect(organizationBankService.archive).not.toHaveBeenCalled();
    vi.mocked(organizationBankService.list).mockResolvedValue({
      ...workspace,
      accounts: [{ ...account, archivedAt: "2026-11-14" }],
    });
    vi.mocked(organizationBankService.archive).mockResolvedValue({});
    fireEvent.click(screen.getByRole("button", { name: "Archive account" }));
    await screen.findByText("No bank accounts to display.");
    expect(organizationBankService.archive).toHaveBeenCalledWith("org-a", "bank-a");
    fireEvent.click(screen.getByRole("checkbox", { name: "Show archived accounts" }));
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archive Payroll funding" })).not.toBeInTheDocument();
  });
  it("clears unsaved bank details and previous tenant records immediately on organization change", async () => {
    const { rerender } = render(<OrganizationBankAccounts />);
    await screen.findByText("Payroll funding");
    fireEvent.click(screen.getByRole("button", { name: "Add bank account" }));
    fireEvent.change(screen.getByLabelText("Account number"), { target: { value: "123456789" } });
    vi.mocked(organizationBankService.list).mockResolvedValue({ ...workspace, accounts: [] });
    auth.organizationId = "org-b";
    rerender(<OrganizationBankAccounts />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Payroll funding")).not.toBeInTheDocument();
    await screen.findByText("No bank accounts to display.");
    expect(organizationBankService.list).toHaveBeenLastCalledWith("org-b");
    fireEvent.click(screen.getByRole("button", { name: "Add bank account" }));
    expect(screen.getByLabelText("Account number")).toHaveValue("");
  });
});
