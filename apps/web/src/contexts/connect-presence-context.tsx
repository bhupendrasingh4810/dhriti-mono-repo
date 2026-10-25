"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";

export type ConnectPresenceStatus = "online" | "away" | "offline" | "in-meeting" | "sharing";

const AWAY_AFTER_MS = 10 * 60 * 1000;
const OFFLINE_AFTER_MS = 15 * 60 * 1000;
const PRESENCE_HEARTBEAT_MS = 30 * 1000;

type ConnectPresenceContextValue = {
  presence: ConnectPresenceStatus;
  setPresence: (presence: ConnectPresenceStatus) => void;
};

const ConnectPresenceContext = createContext<ConnectPresenceContextValue | undefined>(undefined);

export function ConnectPresenceProvider({ children }: { children: ReactNode }) {
  const [presence, setPresence] = useState<ConnectPresenceStatus>("online");
  const presenceRef = useRef<ConnectPresenceStatus>("online");
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const setCurrentPresence = useCallback((status: ConnectPresenceStatus) => {
    presenceRef.current = status;
    setPresence(status);
  }, []);
  const publishCurrentPresence = useCallback((status: ConnectPresenceStatus) => {
    setCurrentPresence(status);
    socketRef.current?.emit("presence:set", { status });
  }, [setCurrentPresence]);

  useEffect(() => {
    if (!user?.organization?.id) {
      setCurrentPresence("online");
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;
    let lastActivityAt = Date.now();
    let transitionTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    const publishPresence = (status: ConnectPresenceStatus) => {
      publishCurrentPresence(status);
    };
    const scheduleTransition = () => {
      if (transitionTimer) clearTimeout(transitionTimer);
      const elapsed = Date.now() - lastActivityAt;
      const delay = elapsed < AWAY_AFTER_MS ? AWAY_AFTER_MS - elapsed : Math.max(OFFLINE_AFTER_MS - elapsed, 0);
      transitionTimer = setTimeout(synchronizePresence, delay);
    };
    const synchronizePresence = () => {
      if (presenceRef.current === "in-meeting" || presenceRef.current === "sharing") return;
      const inactiveFor = Date.now() - lastActivityAt;
      if (inactiveFor >= OFFLINE_AFTER_MS) {
        if (presenceRef.current !== "offline") publishPresence("offline");
        return;
      }
      if (inactiveFor >= AWAY_AFTER_MS && presenceRef.current !== "away") publishPresence("away");
      scheduleTransition();
    };
    const recordActivity = () => {
      lastActivityAt = Date.now();
      if (
        presenceRef.current !== "in-meeting" &&
        presenceRef.current !== "sharing" &&
        presenceRef.current !== "online"
      ) {
        publishPresence("online");
      }
      if (presenceRef.current === "in-meeting" || presenceRef.current === "sharing") return;
      scheduleTransition();
    };
    const activityEvents: Array<keyof DocumentEventMap> = ["mousemove", "keydown", "pointerdown", "touchstart"];
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (presenceRef.current !== "in-meeting" && presenceRef.current !== "sharing") publishPresence("offline");
        return;
      }
      synchronizePresence();
    };
    const connect = async () => {
      try {
        const response = await fetch("/api/connect/socket", { method: "POST", cache: "no-store" });
        if (!response.ok) throw new Error("Unable to authenticate presence updates.");
        const credentials: { token: string; url: string } = await response.json();
        if (cancelled) return;
        socket = io(credentials.url, { auth: { token: credentials.token }, autoConnect: false });
        socketRef.current = socket;
        socket.on("connect", () => {
          lastActivityAt = Date.now();
          publishPresence(presenceRef.current);
          if (presenceRef.current !== "in-meeting" && presenceRef.current !== "sharing") scheduleTransition();
          heartbeatTimer = setInterval(() => {
            synchronizePresence();
            if (presenceRef.current !== "offline") publishPresence(presenceRef.current);
          }, PRESENCE_HEARTBEAT_MS);
        });
        socket.on("presence:changed", (payload: { userId: string; status: ConnectPresenceStatus }) => {
          if (payload.userId !== user.id) return;
          if (payload.status === "online") lastActivityAt = Date.now();
          setCurrentPresence(payload.status);
          if (payload.status !== "in-meeting" && payload.status !== "sharing") scheduleTransition();
        });
        socket.on("connect_error", (error) => console.error("Unable to connect presence updates.", error));
        socket.connect();
      } catch (error) {
        console.error("Unable to start presence updates.", error);
      }
    };

    for (const eventName of activityEvents) {
      document.addEventListener(eventName, recordActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    void connect();

    return () => {
      cancelled = true;
      if (transitionTimer) clearTimeout(transitionTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      for (const eventName of activityEvents) {
        document.removeEventListener(eventName, recordActivity);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      socket?.off("presence:changed");
      socket?.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [publishCurrentPresence, setCurrentPresence, user?.id, user?.organization?.id]);

  return <ConnectPresenceContext.Provider value={{ presence, setPresence: publishCurrentPresence }}>{children}</ConnectPresenceContext.Provider>;
}

export function useConnectPresence() {
  const context = useContext(ConnectPresenceContext);

  if (!context) {
    throw new Error("useConnectPresence must be used within a ConnectPresenceProvider.");
  }

  return context;
}
