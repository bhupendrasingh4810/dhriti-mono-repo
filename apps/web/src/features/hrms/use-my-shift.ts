"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { hrmsService } from "@/services/hrms.service";

export interface MyShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timeZone: string;
}

/** The signed-in user's assigned shift; shared by the Home attendance card and Pulse so both agree. */
export function useMyShift() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [state, setState] = useState<{ key: string | null; shift: MyShift | null }>({ key: null, shift: null });

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    hrmsService.employees
      .myShift(organizationId)
      .then((shift) => !cancelled && setState({ key: organizationId, shift }))
      .catch(() => !cancelled && setState({ key: organizationId, shift: null }));
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return {
    shift: state.key === organizationId ? state.shift : null,
    loading: Boolean(organizationId) && state.key !== organizationId,
  };
}
