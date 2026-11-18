"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SystemHealthSnapshot } from "@dhriti/types";
import { controlPlatformService } from "@/services/control.service";

/** Fetch once per mount, then only on explicit refresh. Keep the last snapshot mounted while refreshing. */
export function useSystemHealth() {
  const [snapshot, setSnapshot] = useState<SystemHealthSnapshot | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const snapshotRef = useRef<SystemHealthSnapshot | null>(null);
  const inFlight = useRef(false);
  const [refreshing, setRefreshing] = useState(true);
  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      controller = new AbortController();
      inFlight.current = true;
      timeout = setTimeout(() => controller?.abort(), 15000);
      try {
        const result = await controlPlatformService.systemHealth(controller.signal);
        if (!active) return;
        // A load balancer may serve an older sample from another process. Never replace newer data with older data.
        if (!snapshotRef.current || Date.parse(result.timestamp) >= Date.parse(snapshotRef.current.timestamp)) {
          snapshotRef.current = result;
          setSnapshot(result);
        }
        setError("");
      } catch (reason) {
        if (active)
          setError(
            controller.signal.aborted
              ? "System Health request timed out. Please retry."
              : reason instanceof Error
                ? reason.message
                : "Unable to load System Health",
          );
      } finally {
        if (timeout) clearTimeout(timeout);
        if (active) {
          inFlight.current = false;
          setRefreshing(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
      controller?.abort();
      inFlight.current = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [attempt]);
  const retry = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    setAttempt((value) => value + 1);
  }, []);
  return { snapshot, error, retry, refreshing, initialLoading: !snapshot && !error };
}
