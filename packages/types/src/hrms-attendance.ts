export type AttendanceWorkMode = "OFFICE" | "REMOTE" | "FIELD";
export type AttendanceCaptureSource = "WEB" | "MOBILE_WEB" | "NATIVE";
export type AttendanceDevice = "DESKTOP" | "PHONE" | "TABLET" | "OTHER";

/** Client-reported location/device data is not device attestation or proof against GPS spoofing. */
export type AttendanceCaptureInput = {
  mode: AttendanceWorkMode;
  source: AttendanceCaptureSource;
  device: AttendanceDevice;
  position?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    capturedAt: string;
  };
};

/** Snapshot at the original punch; corrections to attendance times do not rewrite this evidence. */
export type AttendanceCapture = {
  mode: AttendanceWorkMode;
  source: AttendanceCaptureSource;
  device: AttendanceDevice;
  receivedAt: string;
  position: NonNullable<AttendanceCaptureInput["position"]> | null;
  validation: "NOT_REQUIRED" | "GPS_ACCEPTED" | "GEOFENCE_ACCEPTED";
  maxAccuracyMeters: number;
  fence: {
    locationId: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    distanceMeters: number;
  } | null;
};

export type AttendanceCapturePolicy = {
  enabled: boolean;
  maxAccuracyMeters: number;
  workLocation: {
    name: string;
    configured: boolean;
  } | null;
};
