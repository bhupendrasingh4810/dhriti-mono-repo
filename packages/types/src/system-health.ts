export type SystemHealthStatus = "operational" | "degraded" | "outage" | "unavailable";

export interface SystemHealthService {
  id: string;
  name: string;
  status: SystemHealthStatus;
  uptimePercent: number | null;
  latencyMs: number | null;
  checkedAt: string;
  detail: string;
  samples: number;
}

export interface SystemHealthResource {
  id: "cpu" | "memory" | "disk" | "network";
  label: string;
  value: number | null;
  detail: string;
}

/** Snapshot is local to one API instance. Availability is sampled, not a historical infrastructure SLA. */
export interface SystemHealthSnapshot {
  timestamp: string;
  instanceId: string;
  processStartedAt: string;
  sampleIntervalSeconds: number;
  availabilityWindowStartedAt: string;
  summary: { operational: number; degraded: number; outage: number; unavailable: number };
  services: SystemHealthService[];
  resources: SystemHealthResource[];
  connections: { active: number; changeLast5m: number | null; detail: string };
}
