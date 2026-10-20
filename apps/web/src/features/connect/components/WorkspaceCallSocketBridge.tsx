"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";

type WorkspaceCallSocketBridgeProps = {
  registerSocket: (socket: Socket | null) => void;
};

export function WorkspaceCallSocketBridge({ registerSocket }: WorkspaceCallSocketBridgeProps) {
  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const response = await fetch("/api/connect/socket", { method: "POST", cache: "no-store" });
        if (!response.ok) return;

        const credentials = await response.json() as { token: string; url: string };
        if (cancelled) return;

        socket = io(credentials.url, { auth: { token: credentials.token }, autoConnect: false });
        registerSocket(socket);
        socket.connect();
      } catch {
        // Call invitations remain unavailable until the next workspace mount.
      }
    }

    void connect();
    return () => {
      cancelled = true;
      registerSocket(null);
      socket?.disconnect();
    };
  }, [registerSocket]);

  return null;
}