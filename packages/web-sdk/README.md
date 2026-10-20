# Dhriti Web SDK

`@dhriti/web-sdk` is a browser-only wrapper for Agora audio and video sessions. It has no UI framework dependency.

Each consuming application must obtain an Agora token from its trusted backend. Do not expose an Agora App Certificate in the browser.

```ts
import { DhritiWebSdk } from "@dhriti/web-sdk";

const rtc = new DhritiWebSdk({ appId: process.env.NEXT_PUBLIC_AGORA_APP_ID! });

rtc.on("remote-track", ({ participant, mediaType }) => {
  if (mediaType === "video") {
    rtc.playRemoteVideo(participant.uid, "remote-video");
  }
});

await rtc.join({ channel: "team-room", token });
await rtc.startMicrophone();
await rtc.startCamera();
rtc.playLocalCamera("local-video");

await rtc.leave();
```

Use `setMicrophoneEnabled` and `setCameraEnabled` to toggle local tracks. Call `leave` when the call view closes to unpublish and release camera and microphone devices.

## Media Security

Agora tokens must be issued by a trusted backend only after it authorizes the caller for the specific application call. Tokens should be short-lived and scoped to a single RTC channel.

Agora provides encrypted media transport. Application-level end-to-end encryption is a separate product and provider capability: it requires an approved key-management and rotation design, compatible Agora configuration, and recovery behavior for late joiners. Do not claim E2EE protection until those controls are implemented and validated in the deployed Agora project.

Recording requires explicit participant consent, server-side authorization, encrypted storage, access audit records, retention limits, and deletion handling. The SDK does not provide those policy controls.