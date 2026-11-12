import type { HrmsEmployee } from "@/services/hrms.service";

export const statusLabels: Record<string, string> = { ACTIVE: "Active", ON_LEAVE: "On leave", INACTIVE: "Inactive" };

export const statusTone = (status: string) =>
  status === "ACTIVE" ? "success" : status === "ON_LEAVE" ? "warning" : "danger";

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export type EmployeeRecord = HrmsEmployee;
