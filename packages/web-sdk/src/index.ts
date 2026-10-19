import AgoraRTC, {
  type CameraVideoTrackInitConfig,
  type ClientConfig,
  type ConnectionState,
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteAudioTrack,
  type IRemoteVideoTrack,
  type MicrophoneAudioTrackInitConfig,
  type UID,
} from "agora-rtc-sdk-ng";

export type DhritiRtcConfig = {
  appId: string;
  mode?: ClientConfig["mode"];
  codec?: ClientConfig["codec"];
};

export type JoinChannelOptions = {
  channel: string;
  token: string | null;
  uid?: UID | null;
};

export type MediaElementTarget = HTMLElement | string;
export type MediaKind = "audio" | "video";

export type RemoteParticipant = {
  uid: UID;
  audioTrack?: IRemoteAudioTrack;
  videoTrack?: IRemoteVideoTrack;
};

type DhritiRtcEventMap = {
  "connection-state-change": {
    current: ConnectionState;
    previous: ConnectionState;
    reason?: string;
  };
  "remote-track": {
    participant: RemoteParticipant;
    mediaType: MediaKind;
  };
  "remote-user-left": {
    uid: UID;
  };
  error: Error;
};

type EventListener<EventName extends keyof DhritiRtcEventMap> = (payload: DhritiRtcEventMap[EventName]) => void;
type AnyEventListener = (payload: DhritiRtcEventMap[keyof DhritiRtcEventMap]) => void;

/**
 * Browser-only audio/video session wrapper built on the Agora Web SDK.
 * Applications obtain Agora tokens from their own trusted backend.
 */
export class DhritiWebSdk {
  private readonly client: IAgoraRTCClient;
  private readonly config: DhritiRtcConfig;
  private readonly listeners = new Map<keyof DhritiRtcEventMap, Set<AnyEventListener>>();
  private readonly participants = new Map<UID, RemoteParticipant>();
  private microphoneTrack?: IMicrophoneAudioTrack;
  private cameraTrack?: ICameraVideoTrack;
  private joined = false;

  constructor(config: DhritiRtcConfig) {
    const { appId, mode = "rtc", codec = "vp8" } = config;

    if (!appId) throw new Error("An Agora app ID is required.");

    this.config = config;
    this.client = AgoraRTC.createClient({ mode, codec });
    this.bindClientEvents();
  }

  on<EventName extends keyof DhritiRtcEventMap>(eventName: EventName, listener: EventListener<EventName>) {
    const listeners = this.listeners.get(eventName) ?? new Set<AnyEventListener>();
    this.listeners.set(eventName, listeners);
    listeners.add(listener as AnyEventListener);

    return () => listeners.delete(listener as AnyEventListener);
  }

  async join({ channel, token, uid = null }: JoinChannelOptions): Promise<UID> {
    if (this.joined) throw new Error("Already joined to an Agora channel. Leave the current channel before joining another.");
    if (!channel) throw new Error("A channel name is required.");

    const joinedUid = await this.client.join(this.appId, channel, token, uid);
    this.joined = true;

    await Promise.all(
      this.client.remoteUsers.flatMap((user) => [
        ...(user.hasAudio ? [this.subscribeToRemoteTrack(user, "audio")] : []),
        ...(user.hasVideo ? [this.subscribeToRemoteTrack(user, "video")] : []),
      ]),
    );

    return joinedUid;
  }

  async startMicrophone(config?: MicrophoneAudioTrackInitConfig) {
    this.requireJoined();

    if (!this.microphoneTrack) {
      this.microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack(config);
      await this.client.publish(this.microphoneTrack);
    }

    await this.microphoneTrack.setEnabled(true);
    return this.microphoneTrack;
  }

  async stopMicrophone() {
    if (!this.microphoneTrack) return;

    if (this.joined) await this.client.unpublish(this.microphoneTrack);
    this.microphoneTrack.close();
    this.microphoneTrack = undefined;
  }

  async setMicrophoneEnabled(enabled: boolean, config?: MicrophoneAudioTrackInitConfig) {
    if (enabled) return this.startMicrophone(config);
    await this.stopMicrophone();
  }

  async startCamera(config?: CameraVideoTrackInitConfig) {
    this.requireJoined();

    if (!this.cameraTrack) {
      this.cameraTrack = await AgoraRTC.createCameraVideoTrack(config);
      await this.client.publish(this.cameraTrack);
    }

    await this.cameraTrack.setEnabled(true);
    return this.cameraTrack;
  }

  async stopCamera() {
    if (!this.cameraTrack) return;

    if (this.joined) await this.client.unpublish(this.cameraTrack);
    this.cameraTrack.stop();
    this.cameraTrack.close();
    this.cameraTrack = undefined;
  }

  async setCameraEnabled(enabled: boolean, config?: CameraVideoTrackInitConfig) {
    if (enabled) return this.startCamera(config);
    await this.stopCamera();
  }

  playLocalCamera(target: MediaElementTarget) {
    if (!this.cameraTrack) throw new Error("Camera is not active.");
    this.cameraTrack.play(target);
  }

  stopLocalCameraPlayback() {
    this.cameraTrack?.stop();
  }

  playRemoteVideo(uid: UID, target: MediaElementTarget) {
    const track = this.participants.get(uid)?.videoTrack;
    if (!track) throw new Error(`No remote video track is available for ${uid}.`);
    track.play(target);
  }

  stopRemoteVideoPlayback(uid: UID) {
    this.participants.get(uid)?.videoTrack?.stop();
  }

  getLocalTracks() {
    return {
      microphone: this.microphoneTrack,
      camera: this.cameraTrack,
    };
  }

  getRemoteParticipants(): RemoteParticipant[] {
    return [...this.participants.values()];
  }

  async leave() {
    await this.stopCamera();
    await this.stopMicrophone();

    if (this.joined) await this.client.leave();

    this.participants.forEach((participant) => {
      participant.audioTrack?.stop();
      participant.videoTrack?.stop();
    });
    this.participants.clear();
    this.joined = false;
  }

  private get appId() {
    return this.config.appId;
  }

  private requireJoined() {
    if (!this.joined) throw new Error("Join an Agora channel before starting audio or video.");
  }

  private bindClientEvents() {
    this.client.on("connection-state-change", (current, previous, reason) => {
      this.emit("connection-state-change", { current, previous, reason });
    });

    this.client.on("user-published", (user, mediaType) => {
      if (mediaType === "audio" || mediaType === "video") {
        void this.subscribeToRemoteTrack(user, mediaType);
      }
    });

    this.client.on("user-left", (user) => {
      const participant = this.participants.get(user.uid);
      participant?.audioTrack?.stop();
      participant?.videoTrack?.stop();
      this.participants.delete(user.uid);
      this.emit("remote-user-left", { uid: user.uid });
    });
  }

  private async subscribeToRemoteTrack(user: IAgoraRTCRemoteUser, mediaType: MediaKind) {
    try {
      await this.client.subscribe(user, mediaType);
      const participant = this.participants.get(user.uid) ?? { uid: user.uid };

      if (mediaType === "audio" && user.audioTrack) {
        participant.audioTrack = user.audioTrack;
        user.audioTrack.play();
      }

      if (mediaType === "video" && user.videoTrack) {
        participant.videoTrack = user.videoTrack;
      }

      this.participants.set(user.uid, participant);
      this.emit("remote-track", { participant, mediaType });
    } catch (error) {
      this.emit("error", error instanceof Error ? error : new Error("Unable to subscribe to a remote media track."));
    }
  }

  private emit<EventName extends keyof DhritiRtcEventMap>(eventName: EventName, payload: DhritiRtcEventMap[EventName]) {
    this.listeners.get(eventName)?.forEach((listener) => listener(payload));
  }
}