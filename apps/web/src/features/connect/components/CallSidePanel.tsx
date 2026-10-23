"use client";

import { connectSidebarState, connectUsers, connectUsersById } from "@/mocks/connect";
import type { CallChatMessage, CallPanel } from "@/types/connect.types";
import { DeviceSelect, ParticipantAvatar } from "./CallUi";

interface CallSidePanelProps {
  panel: Exclude<CallPanel, null>;
  close: () => void;
  participants: string[];
  availableUsers: typeof connectUsers;
  inviteSearch: string;
  setInviteSearch: (value: string) => void;
  toggleParticipant: (userId: string) => void;
  chatMessages: CallChatMessage[];
  chatDraft: string;
  setChatDraft: (value: string) => void;
  sendChat: () => void;
  notes: string;
  setNotes: (value: string) => void;
  devices: MediaDeviceInfo[];
  microphoneId: string;
  setMicrophoneId: (value: string) => void;
  speakerId: string;
  setSpeakerId: (value: string) => void;
  cameraId: string;
  setCameraId: (value: string) => void;
  setCaptions: (value: boolean | ((current: boolean) => boolean)) => void;
  captions: boolean;
  setTranscription: (value: boolean | ((current: boolean) => boolean)) => void;
  transcription: boolean;
}

export function CallSidePanel({
  panel,
  close,
  participants,
  availableUsers,
  inviteSearch,
  setInviteSearch,
  toggleParticipant,
  chatMessages,
  chatDraft,
  setChatDraft,
  sendChat,
  notes,
  setNotes,
  devices,
  microphoneId,
  setMicrophoneId,
  speakerId,
  setSpeakerId,
  cameraId,
  setCameraId,
  setCaptions,
  captions,
  setTranscription,
  transcription,
}: CallSidePanelProps) {
  const titles: Record<Exclude<CallPanel, null>, string> = {
    people: "People",
    chat: "Call chat",
    settings: "Device settings",
    notes: "Meeting notes",
    apps: "More options",
  };

  return (
    <aside className="flex w-[min(22rem,88vw)] shrink-0 flex-col border-l border-border bg-surface">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <h3 className="text-sm font-semibold">{titles[panel]}</h3>
        <button
          type="button"
          onClick={close}
          aria-label={`Close ${titles[panel]}`}
          className="rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-raised"
        >
          Close
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {panel === "people" ? (
          <>
            <p className="text-xs text-text-secondary">In this call · {participants.length}</p>
            <div className="mt-2 space-y-1">
              {participants.map((userId, index) => (
                <div key={userId} className="flex items-center gap-2 rounded p-2 hover:bg-surface-raised">
                  <ParticipantAvatar userId={userId} className="h-9 w-9 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {connectUsersById[userId]?.displayName ?? "Guest"}
                    {userId === connectSidebarState.currentUser ? " (You)" : ""}
                    <span className="block text-[10px] text-text-secondary">
                      {index === 0 ? "Organizer" : "In call"}
                    </span>
                  </span>
                  {userId !== connectSidebarState.currentUser ? (
                    <button
                      type="button"
                      onClick={() => toggleParticipant(userId)}
                      aria-label={`Remove ${connectUsersById[userId]?.displayName ?? "participant"}`}
                      className="rounded px-2 py-1 text-xs text-text-secondary hover:bg-surface-raised"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <label className="mt-5 block text-xs font-semibold text-text-secondary">
              Invite someone
              <input
                value={inviteSearch}
                onChange={(event) => setInviteSearch(event.target.value)}
                placeholder="Search name or email"
                className="mt-2 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-normal text-text-primary"
              />
            </label>
            <div className="mt-2 space-y-1">
              {availableUsers.slice(0, 8).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleParticipant(user.id)}
                  className="flex w-full items-center gap-2 rounded p-2 text-left hover:bg-surface-raised"
                >
                  <ParticipantAvatar userId={user.id} className="h-8 w-8 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    {user.displayName}
                    <span className="block truncate text-[10px] text-text-secondary">{user.email}</span>
                  </span>
                  <span className="text-xs text-brand">Invite</span>
                </button>
              ))}
            </div>
          </>
        ) : null}
        {panel === "chat" ? (
          <div className="flex min-h-80 flex-col">
            <div className="flex-1 space-y-3">
              {chatMessages.length ? (
                chatMessages.map((message, index) => (
                  <div key={`${message.time}-${index}`}>
                    <div className="flex gap-2 text-xs">
                      <strong>{message.author}</strong>
                      <span className="text-text-muted">{message.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-primary">{message.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-secondary">No messages yet.</p>
              )}
            </div>
            <div className="mt-4">
              <textarea
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                rows={3}
                placeholder="Write a message"
                className="w-full resize-none rounded-md border border-border-strong bg-surface p-2 text-sm text-text-primary"
              />
              <button
                type="button"
                onClick={sendChat}
                className="mt-2 w-full rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
              >
                Send
              </button>
            </div>
          </div>
        ) : null}
        {panel === "settings" ? (
          <div className="space-y-4">
            <DeviceSelect
              label="Microphone"
              devices={devices.filter((device) => device.kind === "audioinput")}
              value={microphoneId}
              onChange={setMicrophoneId}
            />
            <DeviceSelect
              label="Speaker"
              devices={devices.filter((device) => device.kind === "audiooutput")}
              value={speakerId}
              onChange={setSpeakerId}
            />
            <DeviceSelect
              label="Camera"
              devices={devices.filter((device) => device.kind === "videoinput")}
              value={cameraId}
              onChange={setCameraId}
            />
            <div className="border-t border-border pt-4">
              <SettingToggle label="Live captions" checked={captions} onChange={() => setCaptions((value) => !value)} />
              <SettingToggle
                label="Transcription"
                checked={transcription}
                onChange={() => setTranscription((value) => !value)}
              />
            </div>
          </div>
        ) : null}
        {panel === "notes" ? (
          <>
            <div className="rounded-md bg-surface-raised p-3 text-xs leading-5 text-text-secondary">
              <strong className="block text-text-primary">Meeting notes</strong>Capture decisions and follow-ups during
              the conversation.
            </div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add notes and follow-ups"
              className="mt-3 min-h-72 w-full resize-y rounded-md border border-border-strong bg-surface p-3 text-sm leading-6 text-text-primary"
            />
            <p className="mt-2 text-[10px] text-text-secondary">Notes are kept for this call session.</p>
          </>
        ) : null}
        {panel === "apps" ? (
          <div className="space-y-2">
            <SettingToggle label="Live captions" checked={captions} onChange={() => setCaptions((value) => !value)} />
            <SettingToggle
              label="Transcription"
              checked={transcription}
              onChange={() => setTranscription((value) => !value)}
            />
            <button
              type="button"
              onClick={() => setCaptions((value) => !value)}
              className="w-full rounded-md border border-border p-3 text-left text-sm hover:bg-surface-raised"
            >
              Captions<span className="mt-1 block text-xs text-text-secondary">Show live text during this call.</span>
            </button>
            <button
              type="button"
              onClick={() => setTranscription((value) => !value)}
              className="w-full rounded-md border border-border p-3 text-left text-sm hover:bg-surface-raised"
            >
              Transcription<span className="mt-1 block text-xs text-text-secondary">Toggle call transcription.</span>
            </button>
            <button
              type="button"
              onClick={() => alert("Whiteboard is not connected in this workspace yet.")}
              className="w-full rounded-md border border-border p-3 text-left text-sm hover:bg-surface-raised"
            >
              Whiteboard<span className="mt-1 block text-xs text-text-secondary">Open a collaborative whiteboard.</span>
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-emerald-600" />
    </label>
  );
}
