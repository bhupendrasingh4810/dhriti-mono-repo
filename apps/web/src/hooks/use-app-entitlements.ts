"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { pathSegment, tenantRequest } from "@/services/request.service";

export const APP_ENTITLEMENTS_CHANGED = "app-entitlements-changed";

type Feature = { key: string; enabled: boolean };
type Access = { features: Feature[]; isOrganizationAdministrator: boolean };
type State = Access & { organizationId: string; error: string };
const pending = new Map<string, Promise<Access>>();

function load(organizationId: string) {
  let request = pending.get(organizationId);
  if (!request) {
    const base = `/api/organizations/${pathSegment(organizationId)}/me`;
    request = Promise.all([
      tenantRequest<Feature[]>(organizationId, `${base}/entitlements`),
      tenantRequest<{ isOrganizationAdministrator: boolean }>(organizationId, `${base}/control-access`),
    ]).then(([features, access]) => ({
      features, isOrganizationAdministrator: access.isOrganizationAdministrator,
    })).finally(() => pending.delete(organizationId));
    pending.set(organizationId, request);
  }
  return request;
}

/** Fail closed until this tenant's features load; share only in-flight requests so grants cannot stay cached indefinitely. */
export function useAppEntitlements() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    let generation = 0;
    const refresh = () => {
      const current = ++generation;
      void load(organizationId).then(
        (access) => {
          if (active && current === generation) setState({ organizationId, ...access, error: "" });
        },
        (failure: unknown) => {
          if (active && current === generation) {
            setState({
              organizationId,
              features: [],
              isOrganizationAdministrator: false,
              error: failure instanceof Error ? failure.message : "Unable to load app access",
            });
          }
        },
      );
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener(APP_ENTITLEMENTS_CHANGED, refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(APP_ENTITLEMENTS_CHANGED, refresh);
    };
  }, [organizationId]);

  const current = state?.organizationId === organizationId ? state : null;
  return {
    isEnabled: (key: string) => current?.features.some((feature) => feature.key === key && feature.enabled) ?? false,
    error: current?.error ?? "",
    isOrganizationAdministrator: current?.isOrganizationAdministrator === true,
  };
}
