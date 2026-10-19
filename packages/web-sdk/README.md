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