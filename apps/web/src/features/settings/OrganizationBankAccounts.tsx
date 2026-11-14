"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@dhriti/ui/dialog";
import { Archive, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  organizationBankService,
  type OrganizationBankAccount,
  type OrganizationBankInput,
  type OrganizationBankWorkspace,
} from "@/services/organization-bank.service";
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from "@/lib/country-currency-options";
import { ApiRequestError } from "@/services/http.service";

const inputClass =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const buttonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-text-primary hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50";
const emptyInput: OrganizationBankInput = {
  label: "",
  accountHolder: "",
  bankName: "",
  countryCode: "",
  currency: "",
  accountType: "LOCAL",
  accountNumber: "",
  routingCode: "",
  swiftCode: "",
};
const reviewLabel = {
  PENDING: "Awaiting independent review",
  MANUALLY_REVIEWED: "Manually reviewed",
  REJECTED: "Review rejected",
};
const formatLabel: Record<string, string> = {
  IBAN_CHECKSUM: "IBAN structure and checksum checked; national length/branch not certified",
  IN_ACCOUNT_IFSC_FORMAT: "Account and IFSC format checked; bank existence not checked",
  US_ABA_CHECKSUM: "Account format and ABA checksum checked; bank existence not checked",
  GB_ACCOUNT_SORT_CODE_FORMAT: "Account and sort-code format checked; modulus/bank existence not checked",
  BASIC_FORMAT_ONLY: "Basic format only; country-specific bank rules not configured",
};

/** Remount on tenant changes so bank metadata and unsaved financial details never cross organizations. */
export function OrganizationBankAccounts() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const organizationId = user?.organization?.id;
  if (!organizationId || !can("organization.settings.manage")) return null;
  return <BankWorkspace key={organizationId} organizationId={organizationId} actorId={user.id} />;
}

function BankWorkspace({ organizationId, actorId }: { organizationId: string; actorId: string }) {
  const [data, setData] = useState<OrganizationBankWorkspace | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [values, setValues] = useState<OrganizationBankInput>(emptyInput);
  const [confirmAccount, setConfirmAccount] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [dialogError, setDialogError] = useState("");
  const [selection, setSelection] = useState<{
    account: OrganizationBankAccount;
    action: "ACCEPT" | "REJECT" | "ARCHIVE" | "VIEW";
  } | null>(null);
  const [evidence, setEvidence] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(
    () =>
      organizationBankService
        .list(organizationId)
        .then((result) => {
          setData(result);
          setError("");
        })
        .catch((failure: unknown) => {
          setError(failure instanceof Error ? failure.message : "Unable to load bank accounts");
        }),
    [organizationId],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const close = () => {
    if (busy) return;
    setCreateOpen(false);
    setSelection(null);
    setValues(emptyInput);
    setConfirmAccount("");
    setFields({});
    setDialogError("");
    setEvidence("");
    setNote("");
  };
  function field(
    key: keyof OrganizationBankInput | "confirmAccount",
    label: string,
    options?: { value: string; label: string }[],
  ) {
    const id = `organization-bank-${key}`;
    return (
      <div key={key}>
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-text-secondary">
          {label}
        </label>
        {options ? (
          <select
            id={id}
            value={key === "confirmAccount" ? confirmAccount : values[key]}
            disabled={busy}
            className={`${inputClass} cursor-pointer ${fields[key] ? "border-error" : ""}`}
            aria-invalid={Boolean(fields[key])}
            aria-describedby={fields[key] ? `${id}-error` : undefined}
            onChange={(event) => {
              const value = event.target.value;
              if (key === "accountType") {
                setValues((current) => ({
                  ...current,
                  accountType: value === "IBAN" ? "IBAN" : "LOCAL",
                  accountNumber: "",
                  routingCode: "",
                }));
                setConfirmAccount("");
              } else if (key !== "confirmAccount") setValues((current) => ({ ...current, [key]: value }));
              setFields((current) => ({ ...current, [key]: "" }));
            }}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            value={key === "confirmAccount" ? confirmAccount : values[key]}
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
            maxLength={
              key === "accountNumber" || key === "confirmAccount" || key === "routingCode"
                ? 64
                : key === "swiftCode"
                  ? 11
                  : key === "label"
                    ? 100
                    : 160
            }
            className={`${inputClass} ${fields[key] ? "border-error" : ""}`}
            aria-invalid={Boolean(fields[key])}
            aria-describedby={fields[key] ? `${id}-error` : undefined}
            onChange={(event) => {
              if (key === "confirmAccount") setConfirmAccount(event.target.value);
              else setValues((current) => ({ ...current, [key]: event.target.value }));
              setFields((current) => ({ ...current, [key]: "" }));
            }}
          />
        )}
        {fields[key] && (
          <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-error">
            {fields[key]}
          </p>
        )}
      </div>
    );
  }
  async function create() {
    const errors: Record<string, string> = {};
    for (const key of ["label", "accountHolder", "bankName", "countryCode", "currency", "accountNumber"] as const) {
      if (!values[key].trim()) errors[key] = "This field is required.";
    }
    if (values.accountType === "LOCAL" && !values.routingCode.trim())
      errors.routingCode = "Routing / branch code is required.";
    if (!confirmAccount.trim()) errors.confirmAccount = "Confirm the account number.";
    else if (
      confirmAccount.replace(/\s/g, "").toUpperCase() !== values.accountNumber.replace(/\s/g, "").toUpperCase()
    ) {
      errors.confirmAccount = "Account numbers must match.";
    }
    setFields(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setDialogError("");
    setNotice("");
    try {
      await organizationBankService.create(organizationId, values);
      setCreateOpen(false);
      setValues(emptyInput);
      setConfirmAccount("");
      setNotice(
        "Bank account saved with masked display. Independent manual review is still required; ownership is not verified.",
      );
      await load();
    } catch (failure) {
      if (failure instanceof ApiRequestError) {
        const body = failure.body;
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          body.error &&
          typeof body.error === "object" &&
          "details" in body.error &&
          body.error.details &&
          typeof body.error.details === "object" &&
          "fieldErrors" in body.error.details &&
          body.error.details.fieldErrors &&
          typeof body.error.details.fieldErrors === "object"
        ) {
          const errors = Object.fromEntries(
            Object.entries(body.error.details.fieldErrors)
              .filter(([key, value]) => key in emptyInput && typeof value === "string")
              .map(([key, value]) => [key, String(value)]),
          );
          if (Object.keys(errors).length) {
            setFields(errors);
            return;
          }
        }
      }
      setDialogError(failure instanceof Error ? failure.message : "Unable to save bank account");
    } finally {
      setBusy(false);
    }
  }
  async function decide() {
    if (!selection || selection.action === "VIEW") return;
    const errors: Record<string, string> = {};
    if (selection.action !== "ARCHIVE") {
      if (evidence.trim().length < 3) errors.evidence = "Enter an evidence reference (at least 3 characters).";
      if (note.trim().length < 3) errors.note = "Enter a review note (at least 3 characters).";
    }
    setFields(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    setDialogError("");
    setNotice("");
    try {
      if (selection.action === "ARCHIVE") await organizationBankService.archive(organizationId, selection.account.id);
      else
        await organizationBankService.review(organizationId, selection.account.id, {
          decision: selection.action,
          evidenceReference: evidence.trim(),
          note: note.trim(),
        });
      setSelection(null);
      setEvidence("");
      setNote("");
      setNotice("Bank account record updated. No ownership verification or bank transfer was performed.");
      await load();
    } catch (failure) {
      setDialogError(failure instanceof Error ? failure.message : "Unable to update bank account");
    } finally {
      setBusy(false);
    }
  }
  const openAction = (account: OrganizationBankAccount, action: "ACCEPT" | "REJECT" | "ARCHIVE") => {
    setSelection({ account, action });
    setFields({});
    setDialogError("");
    setEvidence("");
    setNote("");
  };
  async function viewReview(account: OrganizationBankAccount) {
    setSelection({ account, action: "VIEW" });
    setEvidence("");
    setNote("");
    setFields({});
    setDialogError("");
    setBusy(true);
    try {
      const evidence = await organizationBankService.reviewEvidence(organizationId, account.id);
      setEvidence(evidence.evidenceReference);
      setNote(evidence.note);
    } catch (failure) {
      setDialogError(failure instanceof Error ? failure.message : "Unable to load review evidence");
    } finally {
      setBusy(false);
    }
  }
  const accounts = data?.accounts.filter((account) => showArchived || !account.archivedAt) ?? [];
  return (
    <section
      aria-labelledby="organization-banks-title"
      className="rounded-xl border border-border bg-surface p-6 text-text-primary [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_[role=dialog]]:max-h-full [&_[role=dialog]]:overflow-y-auto"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="organization-banks-title" className="text-base font-semibold">
            Organization bank accounts
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Organization-owned funding accounts, not employee payout destinations.
          </p>
        </div>
        <button
          type="button"
          className={buttonClass}
          disabled={!data?.capabilities.encryptedStorageAvailable || busy}
          onClick={() => {
            setCreateOpen(true);
            setDialogError("");
            setFields({});
          }}
        >
          <Plus aria-hidden="true" size={16} /> Add bank account
        </button>
      </div>
      <p className="mt-3 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
        No bank provider connected. Format checks and manual document review do not verify account ownership. Live
        verification, microdeposits, and payments are unavailable.
      </p>
      {data && !data.capabilities.encryptedStorageAvailable && (
        <p role="alert" className="mt-3 text-sm text-error">
          Encrypted storage is unavailable. An operator must configure SECRETS_ENCRYPTION_KEY before adding or reviewing
          accounts.
        </p>
      )}
      {error && (
        <div role="alert" className="mt-3 text-sm text-error">
          {error}{" "}
          <button type="button" className={buttonClass} onClick={() => void load()}>
            Retry bank accounts
          </button>
        </div>
      )}
      {!data && !error && (
        <p role="status" className="mt-3 text-sm text-text-secondary">
          Loading bank accounts...
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-text-secondary">
          {notice}
        </p>
      )}
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          className="cursor-pointer accent-brand"
          checked={showArchived}
          onChange={(event) => setShowArchived(event.target.checked)}
        />
        Show archived accounts
      </label>
      {data && !accounts.length && <p className="mt-4 text-sm text-text-secondary">No bank accounts to display.</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {accounts.map((account) => (
          <article
            key={account.id}
            aria-label={`${account.label} ending ${account.lastFour}`}
            className="flex min-w-0 flex-col gap-2 rounded-lg border border-border p-4"
          >
            <h3 className="break-words text-sm font-semibold">{account.label}</h3>
            <p className="break-words text-sm">
              {account.bankName} · {account.countryCode} · {account.currency}
            </p>
            <p className="break-words text-sm text-text-secondary">{account.accountHolder}</p>
            <p className="font-mono text-sm">
              {account.accountType} **** {account.lastFour}
            </p>
            <p className="text-xs text-text-secondary">
              {formatLabel[account.formatCheck] ?? "Format review required"}
            </p>
            <p className="text-xs font-semibold">
              {account.archivedAt ? "Archived" : reviewLabel[account.reviewStatus]}
            </p>
            {account.reviewedAt && (
              <p className="text-xs text-text-muted">Reviewed {new Date(account.reviewedAt).toLocaleDateString()}</p>
            )}
            <p className="text-xs text-warning">Bank ownership: not verified</p>
            {account.reviewStatus !== "PENDING" && (
              <button
                type="button"
                className={buttonClass}
                disabled={busy || !data?.capabilities.encryptedStorageAvailable}
                onClick={() => void viewReview(account)}
              >
                View review evidence
              </button>
            )}
            {!account.archivedAt && (
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                {account.reviewStatus === "PENDING" && account.createdById !== actorId && (
                  <>
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={busy || !data?.capabilities.encryptedStorageAvailable}
                      onClick={() => openAction(account, "ACCEPT")}
                    >
                      Review documents
                    </button>
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={busy || !data?.capabilities.encryptedStorageAvailable}
                      onClick={() => openAction(account, "REJECT")}
                    >
                      Reject
                    </button>
                  </>
                )}
                {account.reviewStatus === "PENDING" && account.createdById === actorId && (
                  <p className="text-xs text-text-muted">Another administrator must review this account.</p>
                )}
                <button
                  type="button"
                  className={buttonClass}
                  disabled={busy}
                  aria-label={`Archive ${account.label}`}
                  onClick={() => openAction(account, "ARCHIVE")}
                >
                  <Archive size={16} aria-hidden="true" />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      <Dialog
        open={createOpen}
        onClose={close}
        title="Add organization bank account"
        primaryActionLabel="Save bank account"
        onPrimaryAction={create}
        isSubmitting={busy}
        maxWidth="md"
        fullScreenOnMobile
      >
        <p className="mb-4 text-sm text-text-secondary">
          Details cannot be edited after saving. Archive and replace an account to change it. Full account and routing
          details are encrypted and never returned by these APIs.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("label", "Account label")}
          {field("accountHolder", "Account holder / legal name")}
          {field("bankName", "Bank name")}
          {field("countryCode", "Bank country", [
            { value: "", label: "Select country" },
            ...COUNTRY_OPTIONS.map((country) => ({ value: country.code, label: country.name })),
          ])}
          {field("currency", "Account currency", [
            { value: "", label: "Select currency" },
            ...CURRENCY_OPTIONS.map((currency) => ({ value: currency.code, label: currency.name })),
          ])}
          {field("accountType", "Account format", [
            { value: "LOCAL", label: "Local account + routing" },
            { value: "IBAN", label: "IBAN" },
          ])}
          {field("accountNumber", values.accountType === "IBAN" ? "IBAN" : "Account number")}
          {field("confirmAccount", "Confirm account number / IBAN")}
          {field(
            "routingCode",
            values.countryCode === "IN"
              ? "IFSC"
              : values.countryCode === "US"
                ? "ABA routing number"
                : values.countryCode === "GB"
                  ? "Sort code"
                  : "Routing / branch code",
          )}
          {field("swiftCode", "SWIFT / BIC (optional)")}
        </div>
        <p className="mt-3 text-xs text-text-muted">
          IBAN checks cover general structure and checksum only. Local checks support India, US and UK formats; other
          countries receive basic format checks only. These are not ownership checks.
        </p>
        {dialogError && (
          <p role="alert" className="mt-3 text-sm text-error">
            {dialogError}
          </p>
        )}
      </Dialog>
      <Dialog
        open={Boolean(selection)}
        onClose={close}
        title={
          selection?.action === "VIEW"
            ? "Bank review evidence"
            : selection?.action === "ARCHIVE"
              ? "Archive bank account"
              : selection?.action === "REJECT"
                ? "Reject bank document review"
                : "Manual bank document review"
        }
        primaryActionLabel={
          selection?.action === "VIEW"
            ? undefined
            : selection?.action === "ARCHIVE"
              ? "Archive account"
              : selection?.action === "REJECT"
                ? "Reject review"
                : "Record manual review"
        }
        secondaryActionLabel={selection?.action === "VIEW" ? "Close" : "Cancel"}
        onPrimaryAction={decide}
        isSubmitting={busy}
        maxWidth="sm"
        fullScreenOnMobile
      >
        <p className="mb-3 break-words text-sm">
          {selection?.account.label} · ending {selection?.account.lastFour}
        </p>
        {selection?.action === "ARCHIVE" ? (
          <p className="text-sm text-text-secondary">
            This hides the account from the active list and preserves its history. No funds move.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-warning">
              Independently inspect a bank-issued document for the legal name and account ending. Record a secure
              evidence reference, not full account details. This is a manual attestation only, not bank-confirmed
              ownership.
            </p>
            <div>
              <label htmlFor="bank-review-evidence" className="mb-1 block text-xs font-medium text-text-secondary">
                Evidence reference
              </label>
              <input
                id="bank-review-evidence"
                value={evidence}
                disabled={busy}
                readOnly={selection?.action === "VIEW"}
                maxLength={500}
                autoComplete="off"
                aria-invalid={Boolean(fields.evidence)}
                aria-describedby={fields.evidence ? "bank-evidence-error" : undefined}
                onChange={(event) => setEvidence(event.target.value)}
                className={`${inputClass} ${fields.evidence ? "border-error" : ""}`}
              />
              {fields.evidence && (
                <p id="bank-evidence-error" role="alert" className="mt-1 text-xs text-error">
                  {fields.evidence}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="bank-review-note" className="mb-1 block text-xs font-medium text-text-secondary">
                Review note
              </label>
              <textarea
                id="bank-review-note"
                value={note}
                disabled={busy}
                readOnly={selection?.action === "VIEW"}
                maxLength={1000}
                aria-invalid={Boolean(fields.note)}
                aria-describedby={fields.note ? "bank-note-error" : undefined}
                onChange={(event) => setNote(event.target.value)}
                className={`${inputClass} ${fields.note ? "border-error" : ""}`}
              />
              {fields.note && (
                <p id="bank-note-error" role="alert" className="mt-1 text-xs text-error">
                  {fields.note}
                </p>
              )}
            </div>
          </div>
        )}
        {dialogError && (
          <p role="alert" className="mt-3 text-sm text-error">
            {dialogError}
          </p>
        )}
      </Dialog>
    </section>
  );
}
