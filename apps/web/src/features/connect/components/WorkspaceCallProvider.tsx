"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { connectSidebarState, connectUsersById } from "@/mocks/connect";
import { useAuth } from "@/hooks/use-auth";
import { CallSurface } from "./CallSurface";
import { CallAvailableCard } from "./CallAvailableCard";
import { CallSwitchDialog } from "./CallSwitchDialog";
import { IncomingCallCard } from "./IncomingCallCard";
import { WorkspaceCallSocketBridge } from "./WorkspaceCallSocketBridge";
import type { ActiveCall, CallContext, CallControls, CallInvitation, CallStatusEvent, CallType } from "@/types/connect.types";

const RING_TIMEOUT_MS = 30_000;

const WorkspaceCallContext = createContext<CallControls | null>(null);

export function useWorkspaceCall() {
  const context = useContext(WorkspaceCallContext);

  if (!context) {
    throw new Error("useWorkspaceCall must be used inside WorkspaceCallProvider");
  }

  return context;
}

export function WorkspaceCallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const [pendingCall, setPendingCall] = useState<CallContext | null>(null);
  const [switchingCallId, setSwitchingCallId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const socketCleanupRef = useRef<(() => void) | null>(null);
  const ringTimeoutsRef = useRef(new Map<string, number>());

  function createCall(context: CallContext, direction: ActiveCall["direction"]): ActiveCall {
    return {
      ...context,
      id: crypto.randomUUID(),
      callerId: direction === "outgoing" ? user?.id : undefined,
      peerName: direction === "outgoing" ? context.conversationName : undefined,
      direction,
      status: "ringing",
      minimized: false,
      onHold: false,
      joined: false,
    };
  }

  function isDirectRecipientOffline(context: CallContext) {
    const recipientId = context.participantIds.find((participantId) => participantId !== user?.id);
    return Boolean(recipientId && connectUsersById[recipientId]?.presence === "offline");
  }

  function clearRingTimeout(callId: string) {
    const timeout = ringTimeoutsRef.current.get(callId);
    if (timeout !== undefined) window.clearTimeout(timeout as unknown as ReturnType<typeof setTimeout>);
    ringTimeoutsRef.current.delete(callId);
  }

  function scheduleRingTimeout(call: ActiveCall) {
    if (ringTimeoutsRef.current.has(call.id)) return;

    const timeout = window.setTimeout(() => {
      ringTimeoutsRef.current.delete(call.id);
      socketRef.current?.emit("call:respond", {
        channelId: call.conversationId,
        callId: call.id,
        action: call.direction === "incoming" ? "miss" : "cancel",
      });
      setCalls((current) => current.flatMap((item) => {
        if (item.id !== call.id || item.status !== "ringing") return [item];
        return call.direction === "outgoing" ? [{ ...item, status: "unanswered" as const }] : [];
      }));
    }, RING_TIMEOUT_MS);

    ringTimeoutsRef.current.set(call.id, timeout);
  }

  function startCall(context: CallContext) {
    const currentCall = calls.find((item) => item.joined && !item.onHold)
      ?? calls.find((item) => !item.minimized);
    if (currentCall?.joined) {
      setSwitchingCallId(currentCall.id);
      setPendingCall(context);
      return;
    }

    const call = {
      ...createCall(context, "outgoing"),
      status: isDirectRecipientOffline(context) ? "unavailable" as const : "ringing" as const,
    };
    setCalls((current) => [
      ...current.filter((item) => item.id !== currentCall?.id),
      call,
    ]);
    if (call.status === "unavailable") return;
    if (call.scope === "one-to-one" || call.scope === "meeting") scheduleRingTimeout(call);
    const callerName = context.callerName?.trim() || user?.name.trim() || user?.email || "Someone";
    socketRef.current?.emit("call:invite", {
      channelId: context.conversationId,
      callId: call.id,
      conversationName: context.conversationName,
      receiverName: context.scope === "one-to-one" ? context.conversationName : undefined,
      callerName,
      type: context.type,
      kind: context.type,
    });
  }

  function minimizeCall(callId: string) {
    setCalls((current) => current.map((item) => item.id === callId ? { ...item, minimized: true } : item));
  }

  function restoreCall(callId: string) {
    setCalls((current) => current.map((item) => item.id === callId
      ? { ...item, minimized: false, onHold: false }
      : !item.minimized ? { ...item, minimized: true, onHold: true } : item));
  }

  function endCall(callId: string, durationSeconds?: number) {
    const call = calls.find((item) => item.id === callId);
    clearRingTimeout(callId);
    if (call && (call.status === "ringing" || call.status === "accepted")) {
      const sharedCall = call.scope !== "one-to-one";
      const dismissingSharedInvitation = sharedCall && call.direction === "incoming" && !call.joined;
      if (!dismissingSharedInvitation) {
        socketRef.current?.emit("call:respond", {
          channelId: call.conversationId,
          callId,
          action: sharedCall ? "leave" : call.direction === "incoming" && call.status === "ringing" ? "reject" : call.joined ? "end" : "cancel",
          ...(call.joined && durationSeconds !== undefined ? { durationSeconds } : {}),
        });
      }
    }
    setCalls((current) => {
      const remaining = current.filter((item) => item.id !== callId);
      if (remaining.some((item) => !item.minimized) || remaining.length === 0) return remaining;
      const resume = remaining[remaining.length - 1];
      return remaining.map((item) => item.id === resume.id ? { ...item, minimized: false, onHold: false } : item);
    });
  }

  function setCallOnHold(callId: string, onHold: boolean) {
    setCalls((current) => current.map((item) => item.id === callId ? { ...item, onHold } : item));
  }

  function launchPendingCall(keepCurrentOnHold: boolean) {
    if (!pendingCall) return;
    const nextCall = {
      ...createCall(pendingCall, "outgoing"),
      status: isDirectRecipientOffline(pendingCall) ? "unavailable" as const : "ringing" as const,
    };
    setCalls((current) => {
      const withoutCurrent = current.filter((item) => keepCurrentOnHold || item.id !== switchingCallId);
      const callsWithCurrentOnHold = keepCurrentOnHold
        ? withoutCurrent.map((item) => item.id === switchingCallId ? { ...item, minimized: true, onHold: true } : item)
        : withoutCurrent;
      return [...callsWithCurrentOnHold, nextCall];
    });
    if (nextCall.status === "unavailable") {
      setPendingCall(null);
      setSwitchingCallId(null);
      return;
    }
    if (nextCall.scope === "one-to-one" || nextCall.scope === "meeting") scheduleRingTimeout(nextCall);
    const callerName = pendingCall.callerName?.trim() || user?.name.trim() || user?.email || "Someone";
    socketRef.current?.emit("call:invite", {
      channelId: pendingCall.conversationId,
      callId: nextCall.id,
      conversationName: pendingCall.conversationName,
      receiverName: pendingCall.scope === "one-to-one" ? pendingCall.conversationName : undefined,
      callerName,
      type: pendingCall.type,
      kind: pendingCall.type,
    });
    setPendingCall(null);
    setSwitchingCallId(null);
  }

  function acceptCall(callId: string) {
    const call = calls.find((item) => item.id === callId);
    if (!call) return;

    clearRingTimeout(callId);
    socketRef.current?.emit("call:respond", { channelId: call.conversationId, callId, action: "accept" });
    setCalls((current) => current.map((item) => item.id === callId ? { ...item, status: "accepted", autoJoin: true } : item));
  }

  function markCallJoined(callId: string) {
    const call = calls.find((item) => item.id === callId);
    if (!call) return;
    clearRingTimeout(callId);
    if (call.status === "ringing") {
      socketRef.current?.emit("call:respond", { channelId: call.conversationId, callId, action: "accept" });
    }
    setCalls((current) => current.map((item) => item.id === callId ? { ...item, status: "accepted", joined: true } : item));
  }

  function acceptVideoCall(callId: string) {
    setCalls((current) => current.map((item) => item.id === callId ? { ...item, type: "video" } : item));
    acceptCall(callId);
  }

  const registerSocket = useCallback((socket: Socket | null) => {
    if (socketRef.current === socket) return;

    socketCleanupRef.current?.();
    socketCleanupRef.current = null;
    socketRef.current = socket;
    if (!socket) return;

    const receiveInvitation = (invitation: CallInvitation) => {
      const callerName = invitation.callerName?.trim()
        || connectUsersById[invitation.callerId]?.displayName
        || "Someone";
      const call: ActiveCall = {
        id: invitation.callId,
        callerId: invitation.callerId,
        callerName,
        peerName: callerName,
        conversationId: invitation.channelId,
        conversationName: invitation.conversationName,
        participantIds: invitation.participantIds?.length ? invitation.participantIds : [invitation.callerId],
        type: invitation.type ?? invitation.kind ?? "audio",
        scope: invitation.scope ?? "one-to-one",
        direction: "incoming",
        status: "ringing",
        minimized: false,
        onHold: false,
        joined: false,
      };
      setCalls((current) => current.some((item) => item.id === call.id) ? current : [...current, call]);
      if (call.scope === "one-to-one" || call.scope === "meeting") scheduleRingTimeout(call);
    };
    const acceptInvitation = (event: CallStatusEvent) => {
      clearRingTimeout(event.callId);
      setCalls((current) => current.map((call) => call.id === event.callId
        ? { ...call, status: "accepted", autoJoin: call.direction === "outgoing" ? true : call.autoJoin }
        : call));
    };
    const rejectCall = (event: CallStatusEvent) => {
      clearRingTimeout(event.callId);
      setCalls((current) => current.flatMap((call) => {
        if (call.id !== event.callId) return [call];
        return call.direction === "outgoing" && call.status === "ringing"
          ? [{ ...call, status: "declined" as const }]
          : [];
      }));
    };
    const cancelCall = (event: CallStatusEvent) => {
      clearRingTimeout(event.callId);
      setCalls((current) => current.flatMap((call) => {
        if (call.id !== event.callId) return [call];
        return call.direction === "outgoing" && call.status === "ringing"
          ? [{ ...call, status: "unanswered" as const }]
          : [];
      }));
    };
    const removeCall = (event: CallStatusEvent) => {
      clearRingTimeout(event.callId);
      setCalls((current) => current.filter((call) => call.id !== event.callId));
    };

    socket.on("call:incoming", receiveInvitation);
    socket.on("call:available", receiveInvitation);
    socket.on("call:accepted", acceptInvitation);
    socket.on("call:rejected", rejectCall);
    socket.on("call:cancelled", cancelCall);
    socket.on("call:ended", removeCall);
    socketCleanupRef.current = () => {
      socket.off("call:incoming", receiveInvitation);
      socket.off("call:accepted", acceptInvitation);
      socket.off("call:rejected", rejectCall);
      socket.off("call:cancelled", cancelCall);
      socket.off("call:ended", removeCall);
    };
  }, []);

  useEffect(() => () => {
    socketCleanupRef.current?.();
    ringTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout as unknown as ReturnType<typeof setTimeout>));
    ringTimeoutsRef.current.clear();
  }, []);

  return (
    <WorkspaceCallContext.Provider value={{ startCall, registerSocket }}>
      {children}
      <WorkspaceCallSocketBridge registerSocket={registerSocket} />
      {calls.map((call) => call.direction === "incoming" && call.status === "ringing" && (call.scope === "group" || call.scope === "channel") ? (
        <CallAvailableCard key={call.id} call={call} onJoin={() => acceptCall(call.id)} onDismiss={() => endCall(call.id)} />
      ) : call.direction === "incoming" && call.status === "ringing" ? (
        <IncomingCallCard
          key={call.id}
          call={call}
          onAccept={() => acceptCall(call.id)}
          onDecline={() => endCall(call.id)}
          onAcceptVideo={() => acceptVideoCall(call.id)}
        />
      ) : (
        <CallSurface
            key={call.id}
            call={call}
            viewerId={user?.id ?? connectSidebarState.currentUser}
            autoJoin={call.autoJoin}
            onMinimize={() => minimizeCall(call.id)}
            onRestore={() => restoreCall(call.id)}
            onEnd={(durationSeconds) => endCall(call.id, durationSeconds)}
            onJoin={() => markCallJoined(call.id)}
            onHoldChange={(onHold) => setCallOnHold(call.id, onHold)}
        />
      ))}
      <CallSwitchDialog
        open={Boolean(pendingCall)}
        onCancel={() => { setPendingCall(null); setSwitchingCallId(null); }}
        onDisconnectCurrent={() => launchPendingCall(false)}
        onKeepOnHold={() => launchPendingCall(true)}
      />
    </WorkspaceCallContext.Provider>
  );
}

