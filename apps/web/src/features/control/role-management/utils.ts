import type { Permission } from "./types";

const applicationLabels: Record<string, string> = {
  atlas: "Atlas",
  cadence: "Cadence",
  connect: "Connect",
  flow: "Flow",
  hrms: "HRMS",
  nexus: "Nexus",
  pulse: "Pulse",
};

export function applicationFor(permission: Permission) {
  const productKey = permission.productKey?.trim().toLowerCase();
  if (!productKey) return "Organization & Platform";

  return applicationLabels[productKey] ?? `${productKey.charAt(0).toUpperCase()}${productKey.slice(1)}`;
}

export function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
