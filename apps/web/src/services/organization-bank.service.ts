import { pathSegment, tenantJsonRequest, tenantRequest } from "./request.service";

export type OrganizationBankAccount = {
  id: string;
  label: string;
  accountHolder: string;
  bankName: string;
  countryCode: string;
  currency: string;
  accountType: "IBAN" | "LOCAL";
  lastFour: string;
  formatCheck: string;
  reviewStatus: "PENDING" | "MANUALLY_REVIEWED" | "REJECTED";
  createdById: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
};
export type OrganizationBankInput = Pick<
  OrganizationBankAccount,
  "label" | "accountHolder" | "bankName" | "countryCode" | "currency" | "accountType"
> & { accountNumber: string; routingCode: string; swiftCode: string };
export type OrganizationBankWorkspace = {
  accounts: OrganizationBankAccount[];
  capabilities: {
    encryptedStorageAvailable: boolean;
    providerConnected: false;
    ownershipVerificationAvailable: false;
    paymentsAvailable: false;
    methods: { key: string; available: boolean; establishesOwnership: boolean }[];
  };
};
export type OrganizationBankReview = { decision: "ACCEPT" | "REJECT"; evidenceReference: string; note: string };

const base = "/api/control/organization/bank-accounts";
export const organizationBankService = {
  list: (org: string) => tenantRequest<OrganizationBankWorkspace>(org, base, { cache: "no-store" }),
  create: (org: string, input: OrganizationBankInput) =>
    tenantJsonRequest<OrganizationBankAccount, OrganizationBankInput>(org, base, "POST", input),
  review: (org: string, id: string, input: OrganizationBankReview) =>
    tenantJsonRequest<OrganizationBankAccount, OrganizationBankReview>(
      org,
      `${base}/${pathSegment(id)}/review`,
      "POST",
      input,
    ),
  reviewEvidence: (org: string, id: string) =>
    tenantRequest<{ evidenceReference: string; note: string; reviewedAt: string; reviewedById: string }>(
      org,
      `${base}/${pathSegment(id)}/review`,
      { cache: "no-store" },
    ),
  archive: (org: string, id: string) => tenantJsonRequest(org, `${base}/${pathSegment(id)}/archive`, "POST", {}),
  verify: (org: string, id: string) => tenantJsonRequest(org, `${base}/${pathSegment(id)}/verify`, "POST", {}),
};
