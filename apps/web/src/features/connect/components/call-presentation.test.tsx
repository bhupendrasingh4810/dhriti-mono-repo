import assert from "node:assert/strict";
import { test } from "node:test";
import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ActiveCall } from "@/types/connect.types";
import { CallAvailableCard } from "./CallAvailableCard";
import { CallAction, DeviceSelect, ParticipantAvatar } from "./CallUi";
import { OutgoingCallSurface } from "./OutgoingCallSurface";

const activeAudioCall: ActiveCall = {
  id: "call-1",
  conversationId: "conversation-1",
  conversationName: "Priya Verma",
  participantIds: ["usr_001", "usr_002"],
  type: "audio",
  scope: "one-to-one",
  direction: "outgoing",
  status: "ringing",
  minimized: false,
  onHold: false,
  joined: false,
};

test("renders group call availability with join and dismiss controls", () => {
  const html = renderToStaticMarkup(
    <CallAvailableCard
      call={{ ...activeAudioCall, direction: "incoming", scope: "group", type: "video", peerName: "Aarav Sharma" }}
      onJoin={() => undefined}
      onDismiss={() => undefined}
    />,
  );

  assert.match(html, /Aarav Sharma started a video call/);
  assert.match(html, /Priya Verma/);
  assert.match(html, />Join</);
  assert.match(html, />Dismiss</);
});

test("renders an unavailable outgoing call outcome with a dismiss action", () => {
  const html = renderToStaticMarkup(
    <OutgoingCallSurface
      call={{ ...activeAudioCall, status: "unavailable" }}
      viewerId="usr_001"
      muted={false}
      cameraOn={false}
      hasVideoPreview={false}
      videoRef={createRef<HTMLVideoElement>()}
      onToggleMicrophone={() => undefined}
      onToggleCamera={() => undefined}
      onShare={() => undefined}
      onLeave={() => undefined}
    />,
  );

  assert.match(html, /Call ended/);
  assert.match(html, /not available to receive your call/);
  assert.match(html, />Dismiss</);
});

test("renders outgoing call media controls with their accessible labels", () => {
  const html = renderToStaticMarkup(
    <OutgoingCallSurface
      call={{ ...activeAudioCall, type: "video" }}
      viewerId="usr_001"
      muted
      cameraOn
      hasVideoPreview={false}
      videoRef={createRef<HTMLVideoElement>()}
      onToggleMicrophone={() => undefined}
      onToggleCamera={() => undefined}
      onShare={() => undefined}
      onLeave={() => undefined}
    />,
  );

  assert.match(html, /aria-label="Turn camera off"/);
  assert.match(html, /aria-label="Unmute microphone"/);
  assert.match(html, /aria-label="Share screen"/);
  assert.match(html, /aria-label="Cancel call"/);
});

test("renders device selection, participant fallback, and active call actions", () => {
  const html = renderToStaticMarkup(
    <>
      <DeviceSelect
        label="Microphone"
        devices={[
          {
            deviceId: "mic-1",
            kind: "audioinput",
            label: "Desk Mic",
            groupId: "group-1",
            toJSON: () => ({}),
          },
        ]}
        value="mic-1"
        onChange={() => undefined}
      />
      <ParticipantAvatar userId="unknown-user" />
      <CallAction label="Mute microphone" active icon={<span>mic</span>} onClick={() => undefined} />
    </>,
  );

  assert.match(html, />Default device</);
  assert.match(html, />Desk Mic</);
  assert.match(html, />G</);
  assert.match(html, /aria-label="Mute microphone"/);
  assert.match(html, /aria-pressed="true"/);
});
