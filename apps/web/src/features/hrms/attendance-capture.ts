import type { AttendanceCapture, AttendanceCaptureInput, AttendanceWorkMode } from "@dhriti/types";

/** Requested only by a punch action; never watches location or persists a browser location cache. */
export function getPunchPosition(): Promise<NonNullable<AttendanceCaptureInput["position"]>> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      reject(new Error("Location capture requires HTTPS and a browser with location support."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          capturedAt: new Date(timestamp).toISOString(),
        }),
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? "Location permission denied. Allow location access in your browser and retry."
              : error.code === 3
                ? "Location request timed out. Move to a clearer area and retry."
                : "Location is unavailable. Check your device location settings and retry.",
          ),
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  });
}

/** Device labels are client-reported hints, not trusted device identity. No raw user-agent is stored. */
export async function collectAttendanceCapture(
  mode: AttendanceWorkMode,
  gpsEnabled: boolean,
): Promise<AttendanceCaptureInput> {
  const tablet =
    /iPad|Tablet/i.test(navigator.userAgent) ||
    (/Android/i.test(navigator.userAgent) && !/Mobi/i.test(navigator.userAgent)) ||
    (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const phone = /Mobi|Android|iPhone/i.test(navigator.userAgent) && !tablet;
  return {
    mode,
    source: tablet || phone ? "MOBILE_WEB" : "WEB",
    device: tablet ? "TABLET" : phone ? "PHONE" : "DESKTOP",
    ...(gpsEnabled ? { position: await getPunchPosition() } : {}),
  };
}

export function captureSummary(capture: AttendanceCapture | null | undefined) {
  if (!capture) return "No capture evidence";
  const mode = { OFFICE: "Office", REMOTE: "Remote", FIELD: "Field" }[capture.mode];
  const source = { WEB: "Web", MOBILE_WEB: "Mobile web", NATIVE: "Native" }[capture.source];
  const validation = {
    NOT_REQUIRED: "GPS not required",
    GPS_ACCEPTED: "GPS accepted",
    GEOFENCE_ACCEPTED: "Office fence accepted",
  }[capture.validation];
  return `${mode} · ${source} · ${capture.device.toLowerCase()} · ${validation}${capture.position ? ` · accuracy ${Math.ceil(capture.position.accuracy)} m` : ""}`;
}
