import { HttpStatus } from "@nestjs/common";
import type { AttendanceCapture, AttendanceCaptureInput } from "@dhriti/types";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";

type WorkLocation = {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  geofenceLatitude: number | null;
  geofenceLongitude: number | null;
  geofenceRadiusMeters: number | null;
};

/** Great-circle distance, including coordinates across the antimeridian. */
export function distanceMeters(lat: number, lon: number, targetLat: number, targetLon: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const a =
    Math.sin(radians(targetLat - lat) / 2) ** 2 +
    Math.cos(radians(lat)) * Math.cos(radians(targetLat)) * Math.sin(radians(targetLon - lon) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}

export function validateAttendanceCapture(
  input: AttendanceCaptureInput | undefined,
  rules: { attendanceGpsEnabled: boolean; attendanceGpsMaxAccuracyMeters: number },
  location: WorkLocation | null,
  organizationId: string,
  now: Date,
): AttendanceCapture | undefined {
  function invalid(message: string): never {
    throw new AppError(ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST);
  }
  if (!input) {
    if (rules.attendanceGpsEnabled) {
      invalid("GPS capture is required. Allow location access and try again.");
    }
    return undefined;
  }
  const result: AttendanceCapture = {
    mode: input.mode,
    source: input.source,
    device: input.device,
    receivedAt: now.toISOString(),
    position: input.position ?? null,
    validation: "NOT_REQUIRED",
    maxAccuracyMeters: rules.attendanceGpsMaxAccuracyMeters,
    fence: null,
  };
  const position = input.position;
  if (!position) {
    if (rules.attendanceGpsEnabled) {
      invalid("GPS capture is required. Allow location access and try again.");
    }
    return result;
  }
  if (
    !Number.isFinite(position.latitude) ||
    Math.abs(position.latitude) > 90 ||
    !Number.isFinite(position.longitude) ||
    Math.abs(position.longitude) > 180 ||
    !Number.isFinite(position.accuracy) ||
    position.accuracy < 0
  ) {
    invalid("GPS coordinates or accuracy are invalid.");
  }
  const age = now.getTime() - Date.parse(position.capturedAt);
  if (!Number.isFinite(age) || age < -10000 || age > 60000) {
    invalid("Location has expired. Get a fresh GPS reading and try again.");
  }
  if (position.accuracy > rules.attendanceGpsMaxAccuracyMeters) {
    invalid(
      `GPS accuracy must be ${rules.attendanceGpsMaxAccuracyMeters} meters or better. Move to a clearer area and retry.`,
    );
  }
  result.validation = "GPS_ACCEPTED";
  if (!rules.attendanceGpsEnabled || input.mode !== "OFFICE") {
    return result;
  }
  if (
    !location ||
    location.organizationId !== organizationId ||
    !location.isActive ||
    typeof location.geofenceLatitude !== "number" ||
    typeof location.geofenceLongitude !== "number" ||
    typeof location.geofenceRadiusMeters !== "number"
  ) {
    invalid(
      "Your assigned work location has no active geofence. Contact HR or select your actual remote/field work mode.",
    );
  }
  // The entire reported accuracy circle must fit inside the fence, not just its center.
  const distance = distanceMeters(
    position.latitude,
    position.longitude,
    location.geofenceLatitude,
    location.geofenceLongitude,
  );
  if (distance + position.accuracy > location.geofenceRadiusMeters) {
    invalid(
      `Location is outside the ${location.name} geofence, or accuracy overlaps its boundary. Move inside and retry.`,
    );
  }
  result.validation = "GEOFENCE_ACCEPTED";
  result.fence = {
    locationId: location.id,
    name: location.name,
    latitude: location.geofenceLatitude,
    longitude: location.geofenceLongitude,
    radiusMeters: location.geofenceRadiusMeters,
    distanceMeters: distance,
  };
  return result;
}
