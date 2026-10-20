"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";
import { connectUsersById } from "@/mocks/connect";

export function DeviceSelect({
  label,
  devices,
  value,
  onChange,
}: {
  label: string;
  devices: MediaDeviceInfo[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-text-secondary">
      <span className="mb-1 block">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-normal text-text-primary">
        <option value="">Default device</option>
        {devices.map((device, index) => <option key={device.deviceId || `${device.kind}-${index}`} value={device.deviceId}>{device.label || `${label} ${index + 1}`}</option>)}
      </select>
    </label>
  );
}

export function ParticipantAvatar({ userId, className = "h-12 w-12 text-base" }: { userId: string; className?: string }) {
  const user = connectUsersById[userId];
  const initials = user ? `${user.firstName.slice(0, 1)}${user.lastName.slice(0, 1)}` : "G";
  return user?.avatar
    ? <img src={user.avatar} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />
    : <span className={`grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white ${className}`}>{initials}</span>;
}

export function CallAction({ label, active, icon, onClick }: { label: string; active: boolean; icon: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={label} aria-pressed={active} title={label} className={`grid h-10 w-10 place-items-center rounded-md border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${active ? "border-brand bg-brand-muted text-brand" : "border-border bg-surface text-text-secondary hover:bg-surface-raised hover:text-text-primary"}`}>{icon}</button>;
}

export function RemoteVideoTarget({
  participantId,
  targets,
}: {
  participantId: string;
  targets: MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const targetMap = targets.current;
    targetMap.set(participantId, target);
    return () => {
      targetMap.delete(participantId);
    };
  }, [participantId, targets]);

  return <div ref={targetRef} className="h-full w-full" />;
}