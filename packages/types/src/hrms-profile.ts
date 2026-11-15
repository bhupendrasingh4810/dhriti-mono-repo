/** Tenant-local HR data, deliberately separate from the user's cross-organization account profile. */
export interface HrmsEmployeeProfile {
  preferredName: string;
  personalEmail: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  skills: string[];
  customFields: { name: string; value: string }[];
  organizationFields?: Record<string, string | number | boolean | null>;
}

export interface HrmsProfileFieldDefinition {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  required: boolean;
  archived: boolean;
  options: string[];
}
export interface HrmsProfileFieldCatalog {
  definitions: HrmsProfileFieldDefinition[];
  version: number;
}
export interface HrmsEmployeeProfileResponse {
  profile: HrmsEmployeeProfile;
  version: number;
  catalog: HrmsProfileFieldCatalog;
}
export interface HrmsEmployeeLifecycle {
  probationEndDate: string | null;
  probationConfirmedOn: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  noticePeriodDays: number | null;
  approvedLastWorkingDate: string | null;
}
export type HrmsLifecycleAction =
  | { action: "CONFIGURE"; data: Pick<HrmsEmployeeLifecycle, "probationEndDate" | "contractStartDate" | "contractEndDate" | "noticePeriodDays"> }
  | { action: "CONFIRM_PROBATION" | "EXTEND_PROBATION" | "RENEW_CONTRACT" | "APPROVE_LAST_WORKING_DATE"; date: string };
export type UpdateHrmsLifecycleInput = HrmsLifecycleAction & { version: number; reason: string };
export interface HrmsEmployeeLifecycleResponse {
  data: HrmsEmployeeLifecycle;
  version: number;
  asOf: string;
  proposedLastWorkingDate: string | null;
  probationStatus: "UNCONFIGURED" | "ONGOING" | "DUE" | "OVERDUE" | "CONFIRMED";
  contractStatus: "UNCONFIGURED" | "UPCOMING" | "ACTIVE" | "EXPIRED";
  history: { id: string; action: string; recordedAt: string; actor: { id: string; name: string } | null; reason: string }[];
}
export interface HrmsEmployeeReadiness {
  checks: { key: string; label: string; status: "COMPLETE" | "ATTENTION"; message: string }[];
  complete: number;
  total: number;
}
export interface UpdateHrmsEmployeeProfileInput {
  profile: HrmsEmployeeProfile;
  version: number;
  catalogVersion: number;
}

/** Recorded job edits, not scheduled effective dates or reconstructed pre-rollout history. */
export interface HrmsEmployeeTimelineEvent {
  id: string;
  action: string;
  recordedAt: string;
  actor: { id: string; name: string } | null;
  changes: { field: string; label: string; before: string | null; after: string | null }[];
  hasChangeDetails: boolean;
}

export interface HrmsEmployeeTimelinePage {
  items: HrmsEmployeeTimelineEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export type HrmsDocumentCategory = "PERSONAL" | "EMPLOYMENT" | "EDUCATION" | "COMPLIANCE" | "OTHER";

/** File identifiers/storage keys are intentionally not exposed by the employee-document API. */
export interface HrmsEmployeeDocument {
  id: string;
  title: string;
  category: HrmsDocumentCategory;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  employee: { id: string; employeeNumber: string; name: string };
}
export interface HrmsEmployeeDocumentPage {
  items: HrmsEmployeeDocument[];
  total: number;
  page: number;
  pageSize: number;
}
