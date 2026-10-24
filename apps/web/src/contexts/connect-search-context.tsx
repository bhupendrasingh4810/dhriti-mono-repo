"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { connectService } from "@/services/connect.service";

export type ConnectSearchUser = {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string | null;
};

type ConnectSearchContextValue = {
  recentUsers: ConnectSearchUser[];
  recentUsersError: string;
  selectUser: (user: ConnectSearchUser) => void;
  registerUserSelection: (handler: (user: ConnectSearchUser) => void) => () => void;
};

const ConnectSearchContext = createContext<ConnectSearchContextValue | null>(null);

export function ConnectSearchProvider({ children, organizationId }: { children: ReactNode; organizationId: string }) {
  const selectionHandlerRef = useRef<((user: ConnectSearchUser) => void) | null>(null);
  const [recentUsers, setRecentUsers] = useState<ConnectSearchUser[]>([]);
  const [recentUsersError, setRecentUsersError] = useState("");

  useEffect(() => {
    if (!organizationId) return;

    let cancelled = false;
    void connectService
      .listRecentUserSearches(organizationId)
      .then((users) => {
        if (!cancelled) {
          setRecentUsers(users.map((user) => ({ id: user.id, name: user.name, description: user.email, avatarUrl: user.avatarUrl })));
          setRecentUsersError("");
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setRecentUsersError(reason instanceof Error ? reason.message : "Unable to load recent users.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const selectUser = useCallback((user: ConnectSearchUser) => {
    setRecentUsers((previous) => [user, ...previous.filter((item) => item.id !== user.id)].slice(0, 10));
    selectionHandlerRef.current?.(user);
    void connectService
      .recordUserSearch(organizationId, user.id)
      .then((savedUser) => {
        setRecentUsers((previous) => [
          { id: savedUser.id, name: savedUser.name, description: savedUser.email, avatarUrl: savedUser.avatarUrl },
          ...previous.filter((item) => item.id !== savedUser.id),
        ].slice(0, 10));
        setRecentUsersError("");
      })
      .catch((reason: unknown) => {
        setRecentUsersError(reason instanceof Error ? reason.message : "Unable to save recent user.");
      });
  }, [organizationId]);

  const registerUserSelection = useCallback((handler: (user: ConnectSearchUser) => void) => {
    selectionHandlerRef.current = handler;
    return () => {
      if (selectionHandlerRef.current === handler) selectionHandlerRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({ recentUsers, recentUsersError, selectUser, registerUserSelection }),
    [recentUsers, recentUsersError, registerUserSelection, selectUser],
  );

  return <ConnectSearchContext.Provider value={value}>{children}</ConnectSearchContext.Provider>;
}

export function useConnectSearch() {
  const context = useContext(ConnectSearchContext);
  if (!context) throw new Error("useConnectSearch must be used within ConnectSearchProvider.");
  return context;
}
