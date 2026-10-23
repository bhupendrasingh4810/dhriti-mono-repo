"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ChevronDown,
  GripVertical,
  Hand,
  LayoutGrid,
  MessageCircle,
  Mic,
  MicOff,
  Minimize2,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  SmilePlus,
  UsersRound,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import type { DhritiWebSdk } from "@dhriti/web-sdk";
import { connectSidebarState, connectUsers, connectUsersById } from "@/mocks/connect";
import type { ActiveCall, CallLayout, CallPanel, SessionType } from "@/types/connect.types";
import { CallSidePanel } from "./CallSidePanel";
import { CallAction, DeviceSelect, ParticipantAvatar, RemoteVideoTarget } from "./CallUi";
import { IncomingCallCard, useRingtone } from "./IncomingCallCard";
import { OutgoingCallSurface } from "./OutgoingCallSurface";
const CALL_BACKGROUNDS = [
  {
    name: "Bright office",
    url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
  },
  {
    name: "Meeting room",
    url: "https://images.unsplash.com/photo-1706074740295-d7a79c079562?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
  },
  {
    name: "Window office",
    url: "https://images.unsplash.com/photo-1698653223247-09aaf01166fc?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=1200",
  },
];

interface CallSurfaceProps {
  call: ActiveCall;
  viewerId: string;
  autoJoin?: boolean;
  onMinimize: () => void;
  onRestore: () => void;
  onEnd: (durationSeconds?: number) => void;
  onJoin: () => void;
  onHoldChange: (onHold: boolean) => void;
}

type RecordingConsentState = {
  status: "PENDING_CONSENT" | "READY" | "RECORDING" | "PROCESSING" | "COMPLETE" | "DELETED";
  participants: string[];
  consents: Record<string, boolean>;
};
export function CallSurface({
  call,
  viewerId,
  autoJoin = false,
  onMinimize,
  onRestore,
  onEnd,
  onJoin,
  onHoldChange,
}: CallSurfaceProps) {
  const [phase, setPhase] = useState<"lobby" | "call">("lobby");
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(call.type === "video");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screen, setScreen] = useState<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [joinedAt, setJoinedAt] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>("call");
  const [background, setBackground] = useState("None");
  const [customBackground, setCustomBackground] = useState("");
  const [devicesOpen, setDevicesOpen] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [microphoneId, setMicrophoneId] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [cameraId, setCameraId] = useState("");
  const [permissions, setPermissions] = useState({ mic: "Checking", camera: "Checking" });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unavailable">(
    "default",
  );
  const [panel, setPanel] = useState<CallPanel>(null);
  const [layout, setLayout] = useState<CallLayout>("Spotlight");
  const [handRaised, setHandRaised] = useState(false);
  const [reaction, setReaction] = useState("");
  const [captions, setCaptions] = useState(false);
  const [transcription, setTranscription] = useState(false);
  const onHold = call.onHold;
  const [recordingConsentReady, setRecordingConsentReady] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState<RecordingConsentState | null>(null);
  const [recordConfirmOpen, setRecordConfirmOpen] = useState(false);
  const [participants, setParticipants] = useState(() =>
    Array.from(new Set([connectSidebarState.currentUser, ...call.participantIds])),
  );
  const [inviteSearch, setInviteSearch] = useState("");
  const [chatMessages, setChatMessages] = useState<{ author: string; text: string; time: string }[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [minimizedPosition, setMinimizedPosition] = useState<{ x: number; y: number } | null>(null);
  const minimizedWindowRef = useRef<HTMLDivElement>(null);
  const minimizedDragOffset = useRef<{ x: number; y: number } | null>(null);
  const rtcRef = useRef<DhritiWebSdk | null>(null);
  const [remoteParticipantIds, setRemoteParticipantIds] = useState<string[]>([]);
  const remoteVideoTargetsRef = useRef(new Map<string, HTMLDivElement>());
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localCallVideoRef = useRef<HTMLDivElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const autoJoinStartedRef = useRef(false);
  useRingtone(call.direction === "outgoing" && call.status === "ringing" && phase === "lobby");

  useEffect(() => {
    let cancelled = false;

    async function requestMedia() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera and microphone access requires a supported browser and secure connection.");
        return;
      }

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: microphoneId ? { deviceId: { exact: microphoneId } } : true,
          video: call.type === "video" ? (cameraId ? { deviceId: { exact: cameraId } } : true) : false,
        });
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = media;
        setStream(media);
        setPermissions((current) => ({ mic: "Allowed", camera: call.type === "video" ? "Allowed" : current.camera }));
        setError("");
      } catch {
        if (!cancelled) {
          setPermissions({ mic: "Unavailable", camera: "Unavailable" });
          setError("Device access was denied or unavailable. Check browser permissions and try again.");
        }
      }
    }

    void requestMedia();
    return () => {
      cancelled = true;
    };
  }, [call.conversationId, call.type, cameraId, microphoneId]);

  useEffect(() => {
    let active = true;
    async function refreshDevices() {
      const mediaDevices = navigator.mediaDevices;
      if (!mediaDevices?.enumerateDevices) return;
      try {
        const available = await mediaDevices.enumerateDevices();
        if (active) setDevices(available);
      } catch {
        if (active) setDevices([]);
      }
    }
    void refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => {
      active = false;
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
    };
  }, [permissions.mic, permissions.camera]);

  useEffect(() => {
    stream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted && !onHold;
    });
    stream?.getVideoTracks().forEach((track) => {
      track.enabled = cameraOn && !onHold;
    });
    if (onHold && screenRef.current) {
      screenRef.current.getTracks().forEach((track) => track.stop());
      screenRef.current = null;
      setScreen(null);
    }
  }, [cameraOn, muted, onHold, stream]);

  useEffect(() => {
    if (phase !== "call" || !rtcRef.current) return;

    void Promise.all([
      rtcRef.current.setMicrophoneEnabled(!onHold && !muted, microphoneId ? { microphoneId } : undefined),
      rtcRef.current.setCameraEnabled(!onHold && cameraOn, cameraId ? { cameraId } : undefined),
    ]).catch(() => setError("Your microphone or camera could not be updated."));
  }, [cameraId, cameraOn, microphoneId, muted, onHold, phase]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = screen;
  }, [call.minimized, phase, screen, stream]);

  useEffect(() => {
    if (phase !== "call" || !cameraOn || !localCallVideoRef.current) return;

    try {
      rtcRef.current?.playLocalCamera(localCallVideoRef.current);
    } catch {
      // The camera can be toggled off before the render target is mounted.
    }
  }, [cameraOn, phase]);

  useEffect(() => {
    if (phase !== "call") return;

    for (const uid of remoteParticipantIds) {
      const target = remoteVideoTargetsRef.current.get(uid);
      if (!target) continue;

      try {
        rtcRef.current?.playRemoteVideo(uid, target);
      } catch {
        // A remote user may unpublish before its tile commits.
      }
    }
  }, [phase, remoteParticipantIds]);

  useEffect(() => {
    if (joinedAt === null) return;
    if (onHold) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [joinedAt, onHold]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      screenRef.current?.getTracks().forEach((track) => track.stop());
      void rtcRef.current?.leave();
    },
    [],
  );

  useEffect(() => {
    if (phase !== "call") return;
    let cancelled = false;

    const loadRecordingConsent = async () => {
      const response = await fetch(`/api/organization/connect/calls/${call.id}/recording`, { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const next = (await response.json()) as RecordingConsentState | null;
      if (cancelled) return;
      setRecordingConsent(next);
      setRecordingConsentReady(next?.status === "READY");
    };

    void loadRecordingConsent();
    const interval = window.setInterval(() => void loadRecordingConsent(), 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [call.id, phase]);

  useEffect(() => {
    const objectUrl = customBackground;
    return () => {
      if (objectUrl.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
    };
  }, [customBackground]);

  async function toggleScreenShare() {
    if (screenRef.current) {
      screenRef.current.getTracks().forEach((track) => track.stop());
      screenRef.current = null;
      setScreen(null);
      return;
    }

    try {
      const nextScreen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenRef.current = nextScreen;
      setScreen(nextScreen);
      nextScreen.getVideoTracks()[0]?.addEventListener("ended", () => {
        screenRef.current = null;
        setScreen(null);
      });
    } catch {
      setError("Screen sharing could not be started.");
    }
  }

  async function requestVideo() {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: microphoneId ? { deviceId: { exact: microphoneId } } : true,
        video: cameraId ? { deviceId: { exact: cameraId } } : true,
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = media;
      setStream(media);
      setCameraOn(true);
      setPermissions({ mic: "Allowed", camera: "Allowed" });
      setError("");
    } catch {
      setPermissions({ mic: "Unavailable", camera: "Unavailable" });
      setError("Camera or microphone access is blocked or unavailable. Check browser permissions and retry.");
    }
  }

  async function changeInputDevice(kind: "audio" | "video", deviceId: string) {
    if (kind === "audio") setMicrophoneId(deviceId);
    else setCameraId(deviceId);

    if (rtcRef.current) {
      try {
        if (kind === "audio") {
          await rtcRef.current.stopMicrophone();
          if (!muted && !onHold)
            await rtcRef.current.startMicrophone(deviceId ? { microphoneId: deviceId } : undefined);
        } else {
          await rtcRef.current.stopCamera();
          if (cameraOn && !onHold) await rtcRef.current.startCamera(deviceId ? { cameraId: deviceId } : undefined);
        }
        setError("");
      } catch {
        setError(`The selected ${kind === "audio" ? "microphone" : "camera"} could not be started.`);
      }
      return;
    }

    if (!streamRef.current || (kind === "video" && !cameraOn)) return;

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: (kind === "audio" ? deviceId : microphoneId)
          ? { deviceId: { exact: kind === "audio" ? deviceId : microphoneId } }
          : true,
        video:
          call.type === "video" && cameraOn
            ? (kind === "video" ? deviceId : cameraId)
              ? { deviceId: { exact: kind === "video" ? deviceId : cameraId } }
              : true
            : false,
      });
      media.getAudioTracks().forEach((track) => {
        track.enabled = !muted && !onHold;
      });
      media.getVideoTracks().forEach((track) => {
        track.enabled = cameraOn && !onHold;
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = media;
      setStream(media);
      setError("");
    } catch {
      setError(`The selected ${kind === "audio" ? "microphone" : "camera"} could not be started.`);
    }
  }

  async function toggleCamera() {
    if (rtcRef.current) {
      const nextCameraOn = !cameraOn;

      try {
        await rtcRef.current.setCameraEnabled(nextCameraOn, cameraId ? { cameraId } : undefined);
        setCameraOn(nextCameraOn);
        setError("");
      } catch {
        setError("The selected camera could not be started.");
      }
      return;
    }

    if (!cameraOn) {
      if (!streamRef.current?.getVideoTracks().length) {
        await requestVideo();
        return;
      }
      setCameraOn(true);
      return;
    }
    setCameraOn(false);
  }

  async function toggleMicrophone() {
    const nextMuted = !muted;

    if (rtcRef.current) {
      try {
        await rtcRef.current.setMicrophoneEnabled(!nextMuted, microphoneId ? { microphoneId } : undefined);
        setError("");
      } catch {
        setError("The selected microphone could not be started.");
        return;
      }
    }

    setMuted(nextMuted);
  }

  async function joinCall() {
    try {
      const response = await fetch("/api/connect/calls/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id }),
      });
      const payload = (await response.json().catch(() => null)) as {
        appId?: string;
        token?: string;
        uid?: string;
        channel?: string;
        message?: string;
      } | null;

      if (!response.ok || !payload?.appId || !payload.token || !payload.uid || !payload.channel) {
        throw new Error(payload?.message ?? "Unable to join the call.");
      }

      const { DhritiWebSdk } = await import("@dhriti/web-sdk");
      const rtc = new DhritiWebSdk({ appId: payload.appId });
      rtcRef.current = rtc;
      rtc.on("remote-track", ({ participant }) => {
        setRemoteParticipantIds((current) => Array.from(new Set([...current, String(participant.uid)])));
      });
      rtc.on("remote-user-left", ({ uid }) => {
        setRemoteParticipantIds((current) => current.filter((participantId) => participantId !== String(uid)));
        remoteVideoTargetsRef.current.delete(String(uid));
      });
      rtc.on("error", (nextError) => setError(nextError.message));

      await rtc.join({ channel: payload.channel, token: payload.token, uid: payload.uid });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);

      await rtc.startMicrophone(microphoneId ? { microphoneId } : undefined);
      if (call.type === "video" && cameraOn) {
        await rtc.startCamera(cameraId ? { cameraId } : undefined);
      }

      onJoin();
      setPhase("call");
      setJoinedAt(Date.now());
      setError("");
    } catch (nextError) {
      await rtcRef.current?.leave();
      rtcRef.current = null;
      setError(nextError instanceof Error ? nextError.message : "Unable to join the call.");
    }
  }

  const joinAcceptedCall = useEffectEvent(() => {
    void joinCall();
  });

  useEffect(() => {
    if (!autoJoin || autoJoinStartedRef.current || phase === "call") return;

    autoJoinStartedRef.current = true;
    joinAcceptedCall();
  }, [autoJoin, phase]);

  async function endCall() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    screenRef.current?.getTracks().forEach((track) => track.stop());
    screenRef.current = null;
    setScreen(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;

    try {
      await rtcRef.current?.leave();
    } finally {
      rtcRef.current = null;
      onEnd(joinedAt === null ? undefined : Math.max(0, Math.round((Date.now() - joinedAt) / 1000)));
    }
  }

  const leaveLabel = call.scope === "one-to-one" ? "End call" : "Leave call";

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      setNotificationPermission("unavailable");
      return;
    }

    if (Notification.permission === "default") {
      setNotificationPermission(await Notification.requestPermission());
      return;
    }

    setNotificationPermission(Notification.permission);
  }

  function toggleParticipant(userId: string) {
    setParticipants((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  async function submitRecordingConsent() {
    const requester = call.callerId === viewerId;
    const response = await fetch(
      requester
        ? `/api/organization/connect/calls/${call.id}/recording/request`
        : `/api/organization/connect/calls/${call.id}/recording/consent`,
      requester
        ? { method: "POST" }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consent: true }) },
    );
    const payload = (await response.json().catch(() => null)) as { status?: string; message?: string } | null;
    if (!response.ok) throw new Error(payload?.message ?? "Unable to update recording consent.");

    setRecordingConsentReady(payload?.status === "READY");
    void fetch(`/api/organization/connect/calls/${call.id}/recording`, { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<RecordingConsentState | null>) : null))
      .then((next) => {
        if (next) setRecordingConsent(next);
      });
    setRecordConfirmOpen(false);
    setError(
      payload?.status === "READY"
        ? "Recording consent is complete. Server-side media capture is not configured yet."
        : requester
          ? "Recording consent has been requested from all call participants."
          : "Your recording consent has been recorded.",
    );
  }

  const currentUser = connectUsersById[connectSidebarState.currentUser];
  const directParticipantId = call.participantIds.find((participantId) => participantId !== viewerId);
  const directParticipant = directParticipantId ? connectUsersById[directParticipantId] : undefined;
  const callTitle = call.peerName ?? directParticipant?.displayName ?? call.conversationName;
  const availableUsers = connectUsers.filter(
    (user) =>
      !participants.includes(user.id) &&
      `${user.displayName} ${user.email}`.toLowerCase().includes(inviteSearch.toLowerCase()),
  );
  const backgroundUrl =
    background === "Custom" ? customBackground : CALL_BACKGROUNDS.find((item) => item.name === background)?.url;

  const time = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const participantLabel = participants.length === 1 ? "1 participant" : `${participants.length} participants`;
  const mediaParticipantIds = Array.from(new Set([connectSidebarState.currentUser, ...remoteParticipantIds]));
  const visibleParticipants =
    layout === "Spotlight"
      ? mediaParticipantIds.filter((userId) => userId !== connectSidebarState.currentUser).slice(0, 1)
      : mediaParticipantIds.slice(0, layout === "Gallery" ? 4 : 6);

  if (call.direction === "outgoing" && call.status !== "accepted" && phase === "lobby") {
    return (
      <OutgoingCallSurface
        call={call}
        viewerId={viewerId}
        muted={muted}
        cameraOn={cameraOn}
        hasVideoPreview={Boolean(stream?.getVideoTracks().length)}
        videoRef={videoRef}
        onToggleMicrophone={() => void toggleMicrophone()}
        onToggleCamera={() => void toggleCamera()}
        onShare={() => void toggleScreenShare()}
        onLeave={() => void endCall()}
      />
    );
  }

  if (call.minimized) {
    return (
      <div
        ref={minimizedWindowRef}
        style={
          minimizedPosition
            ? { left: minimizedPosition.x, top: minimizedPosition.y, right: "auto", bottom: "auto" }
            : undefined
        }
        className="fixed bottom-4 right-4 z-[140] flex w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-lg border border-brand bg-brand p-3 pt-5 text-white shadow-2xl"
      >
        <button
          type="button"
          aria-label="Move minimized call window"
          title="Drag to move; use arrow keys to reposition"
          className="absolute left-1/2 top-0 grid h-5 w-10 -translate-x-1/2 cursor-move touch-none place-items-center rounded-b text-white/70 hover:bg-white/15 hover:text-white"
          onPointerDown={(event) => {
            const bounds = minimizedWindowRef.current?.getBoundingClientRect();
            if (!bounds) return;
            minimizedDragOffset.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
            event.currentTarget.setPointerCapture(event.pointerId);
            setMinimizedPosition({ x: bounds.left, y: bounds.top });
          }}
          onPointerMove={(event) => {
            const offset = minimizedDragOffset.current;
            const element = minimizedWindowRef.current;
            if (!offset || !element) return;
            setMinimizedPosition({
              x: Math.max(0, Math.min(window.innerWidth - element.offsetWidth, event.clientX - offset.x)),
              y: Math.max(0, Math.min(window.innerHeight - element.offsetHeight, event.clientY - offset.y)),
            });
          }}
          onPointerUp={() => {
            minimizedDragOffset.current = null;
          }}
          onPointerCancel={() => {
            minimizedDragOffset.current = null;
          }}
          onKeyDown={(event) => {
            const bounds = minimizedWindowRef.current?.getBoundingClientRect();
            if (!bounds || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
            event.preventDefault();
            const deltaX = event.key === "ArrowLeft" ? -24 : event.key === "ArrowRight" ? 24 : 0;
            const deltaY = event.key === "ArrowUp" ? -24 : event.key === "ArrowDown" ? 24 : 0;
            setMinimizedPosition({
              x: Math.max(0, Math.min(window.innerWidth - bounds.width, bounds.left + deltaX)),
              y: Math.max(0, Math.min(window.innerHeight - bounds.height, bounds.top + deltaY)),
            });
          }}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${phase === "call" ? "bg-emerald-400" : "bg-amber-400"}`} />
        <button type="button" onClick={onRestore} className="min-w-0 flex-1 text-left" aria-label="Restore call window">
          <span className="block truncate text-sm font-semibold">{call.conversationName}</span>
          <span className="block text-xs text-white/80">{phase === "call" ? time : "Connecting devices"}</span>
        </button>
        {phase === "call" ? (
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/15"
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            title={muted ? "Unmute microphone" : "Mute microphone"}
          >
            {muted ? <MicOff className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRestore}
          className="grid h-9 w-9 place-items-center rounded-md text-white hover:bg-white/15"
          aria-label="Expand call"
          title="Expand call"
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => void endCall()}
          className="grid h-9 w-9 place-items-center rounded-md bg-error text-white hover:bg-error/90"
          aria-label={leaveLabel}
          title={leaveLabel}
        >
          <PhoneOff className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-text-primary/35 p-2 sm:p-3"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${call.type} call with ${callTitle}`}
        className="flex h-[97dvh] w-[97vw] max-w-[1720px] flex-col overflow-hidden rounded-xl border border-border bg-background text-text-primary shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-semibold">{callTitle}</h2>
              {recordingConsentReady ? (
                <span className="shrink-0 text-xs font-medium text-warning" role="status">
                  Recording consent ready
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-text-secondary">
              {phase === "call"
                ? `${time} · ${participantLabel}`
                : call.direction === "incoming"
                  ? `Incoming ${call.type} call`
                  : call.status === "accepted"
                    ? "Call accepted"
                    : `Calling · ${call.type === "video" ? "Video" : "Audio"}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMinimize}
              className="grid h-9 w-9 place-items-center rounded-md text-text-secondary hover:bg-surface-raised"
              aria-label="Minimize call"
              title="Minimize call"
            >
              <Minimize2 className="size-4" aria-hidden="true" />
            </button>
            {
              phase === "lobby" && (
                <button
                  type="button"
                  onClick={() => void endCall()}
                  className="grid h-9 w-9 place-items-center rounded-md text-text-secondary hover:bg-surface-raised"
                  aria-label="Cancel call"
                  title="Cancel call"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )
              // : (
              //   <button type="button" onClick={onEnd} className="rounded-md px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-raised" aria-label="End call">End</button>
              // )
            }
          </div>
        </header>

        {phase === "lobby" ? (
          <div className="grid min-h-0 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.8fr)]">
            <div className="space-y-4">
              <div
                className="relative flex h-[min(56dvh,480px)] w-full flex-none items-center justify-center overflow-hidden rounded-lg bg-slate-800"
                style={
                  backgroundUrl
                    ? {
                        backgroundImage: `linear-gradient(rgb(0 0 0 / 0.08), rgb(0 0 0 / 0.08)), url(${backgroundUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {call.type === "video" && cameraOn && stream?.getVideoTracks().length ? (
                  <div className="h-full w-full -scale-x-100">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`h-full w-full object-cover ${background === "Blur" ? "scale-105 blur-sm" : ""}`}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-700 text-2xl font-semibold text-white">
                      {currentUser?.displayName.slice(0, 1) ?? "Y"}
                    </span>
                    <p className="mt-3 text-sm text-slate-300">
                      {call.type === "video" ? "Camera is off" : "Audio call"}
                    </p>
                  </div>
                )}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-slate-950/90 p-2">
                  <button
                    type="button"
                    onClick={() => void toggleMicrophone()}
                    title={muted ? "Unmute microphone" : "Mute microphone"}
                    aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                    className={`grid h-10 w-10 place-items-center rounded-md text-white ${muted ? "bg-error" : "bg-slate-800 hover:bg-slate-700"}`}
                  >
                    {muted ? (
                      <MicOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Mic className="size-4" aria-hidden="true" />
                    )}
                  </button>
                  {call.type === "video" ? (
                    <button
                      type="button"
                      onClick={toggleCamera}
                      title={cameraOn ? "Turn camera off" : "Turn camera on"}
                      aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
                      className={`grid h-10 w-10 place-items-center rounded-md text-white ${cameraOn ? "bg-slate-800 hover:bg-slate-700" : "bg-error"}`}
                    >
                      {cameraOn ? (
                        <Video className="size-4" aria-hidden="true" />
                      ) : (
                        <VideoOff className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setDevicesOpen((value) => !value)}
                    className="rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    {devicesOpen ? "Hide devices" : "Device settings"}
                  </button>
                </div>
                <div className="absolute left-3 top-3 rounded bg-black/80 px-2 py-1 text-[11px] font-medium text-white shadow-sm">
                  {background === "None" ? "No background effect" : `${background} background`}
                </div>
                {error ? (
                  <p
                    role="alert"
                    className="absolute inset-x-3 top-11 rounded-md bg-rose-950/90 px-3 py-2 text-xs text-white"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
              <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">Background and effects</h3>
                    <p className="mt-1 text-xs text-text-secondary">Your selection is kept for this call.</p>
                  </div>
                  <label className="cursor-pointer rounded-md border border-border-strong px-3 py-2 text-xs font-semibold hover:bg-surface-raised">
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (customBackground.startsWith("blob:")) URL.revokeObjectURL(customBackground);
                        setCustomBackground(URL.createObjectURL(file));
                        setBackground("Custom");
                      }}
                    />
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {[
                    "None",
                    "Blur",
                    ...CALL_BACKGROUNDS.map((item) => item.name),
                    ...(customBackground ? ["Custom"] : []),
                  ].map((item) => {
                    const image =
                      item === "Custom" ? customBackground : CALL_BACKGROUNDS.find((entry) => entry.name === item)?.url;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setBackground(item)}
                        aria-pressed={background === item}
                        className={`relative aspect-video overflow-hidden rounded border-2 bg-surface-raised text-[10px] font-semibold ${background === item ? "border-brand" : "border-transparent"}`}
                        style={image ? { backgroundImage: `url(${image})`, backgroundSize: "cover" } : undefined}
                      >
                        <span className="absolute inset-x-0 bottom-0 bg-text-primary/70 px-1 py-1 text-white">
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
            <div className="flex flex-col justify-center rounded-lg border border-border bg-surface p-5">
              <p className="text-lg font-semibold">Ready to join?</p>
              <p className="mt-1 text-sm text-text-secondary">{call.conversationName}</p>
              <div className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-surface-raised p-1">
                {(["call", "meeting"] as SessionType[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSessionType(item)}
                    className={`rounded px-3 py-2 text-xs font-semibold ${sessionType === item ? "bg-surface text-brand shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    {item === "call" ? "Direct call" : "Meet now"}
                  </button>
                ))}
              </div>
              <p className="mt-3 rounded-md bg-surface-raised p-3 text-xs leading-5 text-text-secondary">
                {sessionType === "call"
                  ? "A chat call with this conversation."
                  : "A meeting session with chat, participants, notes, and organizer tools."}
              </p>
              {call.direction === "outgoing" && call.status === "ringing" ? (
                <p className="mt-3 text-xs font-medium text-brand">Calling participants...</p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2">
                <p className="w-full text-xs text-text-secondary">
                  {participantLabel} · {currentUser?.displayName ?? "You"}
                </p>
              </div>
              {devicesOpen ? (
                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <DeviceSelect
                    label="Microphone"
                    devices={devices.filter((device) => device.kind === "audioinput")}
                    value={microphoneId}
                    onChange={setMicrophoneId}
                  />
                  <DeviceSelect
                    label="Microphone"
                    devices={devices.filter((device) => device.kind === "audioinput")}
                    value={microphoneId}
                    onChange={(value) => void changeInputDevice("audio", value)}
                  />
                  <DeviceSelect
                    label="Speaker"
                    devices={devices.filter((device) => device.kind === "audiooutput")}
                    value={speakerId}
                    onChange={setSpeakerId}
                  />
                  {call.type === "video" ? (
                    <DeviceSelect
                      label="Camera"
                      devices={devices.filter((device) => device.kind === "videoinput")}
                      value={cameraId}
                      onChange={(value) => void changeInputDevice("video", value)}
                    />
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <p className="rounded bg-surface-raised px-2 py-2">Microphone: {permissions.mic}</p>
                    <p className="rounded bg-surface-raised px-2 py-2">Camera: {permissions.camera}</p>
                    <p className="col-span-2 rounded bg-surface-raised px-2 py-2">
                      Notifications:{" "}
                      {notificationPermission === "default"
                        ? "Not requested"
                        : notificationPermission === "granted"
                          ? "Allowed"
                          : notificationPermission === "denied"
                            ? "Blocked"
                            : "Unavailable"}
                    </p>
                  </div>
                </div>
              ) : null}
              {error ? (
                <button
                  type="button"
                  onClick={() => void requestVideo()}
                  className="mt-3 text-left text-xs font-semibold text-error underline"
                >
                  Retry device access
                </button>
              ) : null}
              <div className="mt-6 flex gap-2">
                {call.direction === "incoming" ? (
                  <button
                    type="button"
                    onClick={() => void endCall()}
                    className="rounded-md border border-border px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-surface-raised"
                  >
                    Reject
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    void requestNotificationPermission();
                    void joinCall();
                  }}
                  className="rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  {call.direction === "incoming"
                    ? "Accept call"
                    : `Join ${sessionType === "meeting" ? "meeting" : "call"}`}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <main className="flex min-w-0 flex-1 flex-col p-3 sm:p-5">
              {onHold ? (
                <div className="mb-3 flex items-center justify-between rounded-md bg-warning/10 px-4 py-3 text-sm text-text-primary">
                  <span>Call on hold. Your microphone and camera are paused.</span>
                  <button type="button" onClick={() => onHoldChange(false)} className="font-semibold text-text-primary">
                    Resume
                  </button>
                </div>
              ) : null}
              {error ? (
                <div
                  role="alert"
                  className="mb-3 flex items-center justify-between rounded-md bg-error/10 px-3 py-2 text-xs text-error"
                >
                  <span>{error}</span>
                  <button type="button" onClick={() => setError("")} className="font-semibold">
                    Dismiss
                  </button>
                </div>
              ) : null}
              <div
                className={`grid min-h-0 flex-1 gap-2 ${layout === "Gallery" ? "grid-cols-2 grid-rows-2" : "grid-cols-1 grid-rows-1"}`}
              >
                {screen ? (
                  <div className="relative col-span-2 row-span-2 min-h-64 overflow-hidden rounded-lg bg-slate-900">
                    <video ref={screenVideoRef} autoPlay playsInline className="h-full w-full object-contain" />
                    <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">
                      {currentUser?.displayName ?? "You"} is presenting
                    </span>
                    <button
                      type="button"
                      onClick={toggleScreenShare}
                      className="absolute right-3 top-3 rounded bg-rose-700 px-3 py-2 text-xs font-semibold"
                    >
                      Stop presenting
                    </button>
                  </div>
                ) : layout === "Together" ? (
                  <div className="relative col-span-2 row-span-2 flex min-h-64 items-end justify-center gap-3 overflow-hidden rounded-lg bg-gradient-to-b from-sky-900 to-slate-800 p-5 sm:gap-6">
                    {participants.slice(0, 6).map((userId) => (
                      <div key={userId} className="flex flex-col items-center">
                        <ParticipantAvatar userId={userId} />
                        <span className="mt-2 max-w-24 truncate rounded bg-slate-950/70 px-2 py-1 text-[10px] text-white">
                          {connectUsersById[userId]?.displayName ?? "Guest"}
                        </span>
                      </div>
                    ))}
                    <span className="absolute left-3 top-3 rounded bg-slate-950/70 px-2 py-1 text-xs text-white">
                      Together mode
                    </span>
                  </div>
                ) : (
                  visibleParticipants.map((userId, index) => (
                    <div
                      key={userId}
                      className={`relative min-h-32 overflow-hidden rounded-lg bg-slate-900 ${layout === "Spotlight" ? "col-span-1 row-span-1" : ""}`}
                    >
                      {userId === connectSidebarState.currentUser && cameraOn ? (
                        <div className="h-full w-full -scale-x-100">
                          <div
                            ref={localCallVideoRef}
                            className={`h-full w-full ${background === "Blur" ? "scale-105 blur-sm" : ""}`}
                          />
                        </div>
                      ) : remoteParticipantIds.includes(userId) ? (
                        <RemoteVideoTarget participantId={userId} targets={remoteVideoTargetsRef} />
                      ) : (
                        <div className="flex h-full min-h-32 items-center justify-center">
                          {userId === connectSidebarState.currentUser && backgroundUrl && background !== "Blur" ? (
                            <div
                              className="absolute inset-0 bg-cover bg-center opacity-50"
                              style={{ backgroundImage: `url(${backgroundUrl})` }}
                            />
                          ) : null}
                          <ParticipantAvatar userId={userId} className="relative h-20 w-20 text-2xl" />
                        </div>
                      )}
                      <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
                        {userId === connectSidebarState.currentUser
                          ? "You"
                          : (connectUsersById[userId]?.displayName ?? "Guest")}
                      </span>
                      {index === 1 ? (
                        <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
                          Speaking
                        </span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
              {captions ? (
                <div className="mx-auto mt-3 max-w-2xl rounded bg-surface-raised px-4 py-2 text-center text-sm text-text-primary">
                  <strong>{connectUsers[1]?.displayName ?? "Participant"}:</strong> Live captions are enabled for this
                  call.
                </div>
              ) : null}
              {reaction ? (
                <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-2xl text-slate-900 shadow-xl">
                  {reaction}
                </div>
              ) : null}
              <footer className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border bg-surface px-2 py-3">
                <CallAction
                  label={muted ? "Unmute microphone" : "Mute microphone"}
                  active={muted}
                  icon={muted ? <MicOff /> : <Mic />}
                  onClick={() => void toggleMicrophone()}
                />
                <CallAction
                  label={cameraOn ? "Turn camera off" : "Turn camera on"}
                  active={!cameraOn}
                  icon={cameraOn ? <Video /> : <VideoOff />}
                  onClick={() => void toggleCamera()}
                />
                <CallAction
                  label={screen ? "Stop screen sharing" : "Share screen"}
                  active={Boolean(screen)}
                  icon={<MonitorUp />}
                  onClick={() => void toggleScreenShare()}
                />
                <CallAction
                  label={handRaised ? "Lower hand" : "Raise hand"}
                  active={handRaised}
                  icon={<Hand />}
                  onClick={() => {
                    setHandRaised((value) => !value);
                    setReaction(handRaised ? "" : "✋");
                  }}
                />
                <CallAction
                  label="React"
                  active={false}
                  icon={<SmilePlus />}
                  onClick={() => setReaction((value) => (value ? "" : "👍"))}
                />
                <CallAction
                  label="People"
                  active={panel === "people"}
                  icon={<UsersRound />}
                  onClick={() => setPanel(panel === "people" ? null : "people")}
                />
                <CallAction
                  label="Chat"
                  active={panel === "chat"}
                  icon={<MessageCircle />}
                  onClick={() => setPanel(panel === "chat" ? null : "chat")}
                />
                <CallAction
                  label={`Change layout, currently ${layout}`}
                  active={false}
                  icon={<LayoutGrid />}
                  onClick={() =>
                    setLayout((value) =>
                      value === "Gallery" ? "Spotlight" : value === "Spotlight" ? "Together" : "Gallery",
                    )
                  }
                />
                <CallAction
                  label="More call options"
                  active={panel === "apps"}
                  icon={<MoreHorizontal />}
                  onClick={() => setPanel(panel === "apps" ? null : "apps")}
                />
                <button
                  type="button"
                  onClick={() => void endCall()}
                  className="flex h-10 items-center gap-2 rounded-md bg-error px-3 text-sm font-semibold text-white hover:bg-error/90"
                  aria-label={leaveLabel}
                  title={leaveLabel}
                >
                  <PhoneOff className="size-4" aria-hidden="true" />
                  <span>{leaveLabel}</span>
                </button>
              </footer>
              <div className="flex flex-wrap justify-center gap-2 border-t border-border bg-surface px-2 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPanel(panel === "settings" ? null : "settings")}
                  className="rounded px-2 py-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => setCaptions((value) => !value)}
                  className="rounded px-2 py-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  {captions ? "Turn captions off" : "Live captions"}
                </button>
                <button
                  type="button"
                  onClick={() => setTranscription((value) => !value)}
                  className="rounded px-2 py-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  {transcription ? "Stop transcription" : "Transcription"}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordConfirmOpen(true)}
                  className="rounded px-2 py-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  {call.callerId === viewerId ? "Request recording" : "Consent to recording"}
                </button>
                <button
                  type="button"
                  onClick={() => onHoldChange(!onHold)}
                  className="rounded px-2 py-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  {onHold ? "Resume call" : "Put on hold"}
                </button>
                <button
                  type="button"
                  onClick={() => setPanel(panel === "notes" ? null : "notes")}
                  className="rounded px-2 py-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  Meeting notes
                </button>
                <button
                  type="button"
                  onClick={() => setTransferOpen(true)}
                  className="rounded px-2 py-1 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  Transfer call
                </button>
              </div>
            </main>
            {panel ? (
              <CallSidePanel
                panel={panel}
                close={() => setPanel(null)}
                participants={participants}
                availableUsers={availableUsers}
                inviteSearch={inviteSearch}
                setInviteSearch={setInviteSearch}
                toggleParticipant={toggleParticipant}
                chatMessages={chatMessages}
                chatDraft={chatDraft}
                setChatDraft={setChatDraft}
                sendChat={() => {
                  if (!chatDraft.trim()) return;
                  setChatMessages((items) => [
                    ...items,
                    {
                      author: currentUser?.displayName ?? "You",
                      text: chatDraft.trim(),
                      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    },
                  ]);
                  setChatDraft("");
                }}
                notes={notes}
                setNotes={setNotes}
                devices={devices}
                microphoneId={microphoneId}
                setMicrophoneId={(value) => void changeInputDevice("audio", value)}
                speakerId={speakerId}
                setSpeakerId={setSpeakerId}
                cameraId={cameraId}
                setCameraId={(value) => void changeInputDevice("video", value)}
                setCaptions={setCaptions}
                captions={captions}
                setTranscription={setTranscription}
                transcription={transcription}
              />
            ) : null}
          </div>
        )}
      </section>
      {recordConfirmOpen ? (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={() => setRecordConfirmOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-confirm-title"
            className="w-full max-w-md rounded-lg bg-white p-5 text-slate-900 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="record-confirm-title" className="text-lg font-semibold">
              {call.callerId === viewerId ? "Request recording consent?" : "Consent to recording?"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Media capture remains unavailable until every participant has explicitly consented and a server-side
              recording provider is configured.
            </p>
            {recordingConsent ? (
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {recordingConsent.participants.map((participantId) => (
                  <li key={participantId} className="flex items-center justify-between">
                    <span>{connectUsersById[participantId]?.displayName ?? "Participant"}</span>
                    <span
                      className={
                        recordingConsent.consents[participantId] ? "font-medium text-emerald-700" : "text-slate-500"
                      }
                    >
                      {recordingConsent.consents[participantId] ? "Consented" : "Awaiting consent"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRecordConfirmOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitRecordingConsent()}
                className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {transferOpen ? (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
          onMouseDown={() => setTransferOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-title"
            className="w-full max-w-md rounded-lg bg-white p-5 text-slate-900 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 id="transfer-title" className="text-lg font-semibold">
                Transfer this call
              </h3>
              <button type="button" onClick={() => setTransferOpen(false)} aria-label="Close transfer dialog">
                Close
              </button>
            </div>
            <input
              value={transferSearch}
              onChange={(event) => setTransferSearch(event.target.value)}
              placeholder="Search colleagues"
              className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {connectUsers
                .filter(
                  (user) =>
                    user.id !== connectSidebarState.currentUser &&
                    `${user.displayName} ${user.email}`.toLowerCase().includes(transferSearch.toLowerCase()),
                )
                .map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setParticipants((items) => Array.from(new Set([...items, user.id])));
                      setTransferOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-slate-100"
                  >
                    <ParticipantAvatar userId={user.id} className="h-9 w-9 text-sm" />
                    <span>
                      <span className="block text-sm font-semibold">{user.displayName}</span>
                      <span className="block text-xs text-slate-500">Consult and transfer to this person</span>
                    </span>
                  </button>
                ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
