import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import type { AttendanceCaptureInput } from "@dhriti/types";
import { distanceMeters, validateAttendanceCapture } from "./attendance-capture";
import { AttendancePunchDto, ClockInDto } from "./dto/hrms-attendance.dto";
import { CreateHrmsLocationDto } from "./dto/hrms-master-data.dto";
import { UpdateHrmsSettingsDto } from "../settings/dto/app-settings.dto";

const now = new Date("2026-11-15T09:00:00Z");
const rules = { attendanceGpsEnabled: true, attendanceGpsMaxAccuracyMeters: 100 };
const location = {
  id: "loc",
  organizationId: "org",
  name: "Office",
  isActive: true,
  geofenceLatitude: 0,
  geofenceLongitude: 0,
  geofenceRadiusMeters: 200,
};
const gps = { latitude: 0, longitude: 0, accuracy: 100, capturedAt: now.toISOString() };
const capture: AttendanceCaptureInput = {
  mode: "OFFICE",
  source: "MOBILE_WEB",
  device: "PHONE",
  position: gps,
};

describe("attendance GPS policy", () => {
  it("preserves legacy clocking only while enforcement is off", () => {
    expect(
      validateAttendanceCapture(undefined, { ...rules, attendanceGpsEnabled: false }, null, "org", now),
    ).toBeUndefined();
    expect(() => validateAttendanceCapture(undefined, rules, location, "org", now)).toThrow("GPS capture is required");
    expect(() => validateAttendanceCapture({ ...capture, position: undefined }, rules, location, "org", now)).toThrow(
      "GPS capture is required",
    );
  });

  it("accepts exact configured accuracy and stores both server and device timestamps", () => {
    expect(validateAttendanceCapture(capture, rules, location, "org", now)).toMatchObject({
      mode: "OFFICE",
      source: "MOBILE_WEB",
      device: "PHONE",
      receivedAt: now.toISOString(),
      position: capture.position,
      validation: "GEOFENCE_ACCEPTED",
      maxAccuracyMeters: 100,
      fence: { locationId: "loc", distanceMeters: 0, radiusMeters: 200 },
    });
  });

  it.each([0, 0.0009, 0.002])("enforces the complete accuracy circle at latitude %s", (latitude) => {
    const input = { ...capture, position: { ...gps, latitude } };
    const accepted = distanceMeters(latitude, 0, 0, 0) + 100 <= 200;
    if (accepted) {
      expect(validateAttendanceCapture(input, rules, location, "org", now)?.validation).toBe("GEOFENCE_ACCEPTED");
    } else {
      expect(() => validateAttendanceCapture(input, rules, location, "org", now)).toThrow("boundary");
    }
  });

  it("accepts exact fence boundaries and rejects uncertain boundary overlap", () => {
    const exactFence = { ...location, geofenceRadiusMeters: 100 };
    expect(validateAttendanceCapture(capture, rules, exactFence, "org", now)?.validation).toBe("GEOFENCE_ACCEPTED");
    expect(() =>
      validateAttendanceCapture(capture, rules, { ...exactFence, geofenceRadiusMeters: 99 }, "org", now),
    ).toThrow("boundary");
  });

  it.each(["REMOTE", "FIELD"] as const)("accepts %s GPS without any office fence", (mode) => {
    expect(validateAttendanceCapture({ ...capture, mode }, rules, null, "org", now)).toMatchObject({
      mode,
      validation: "GPS_ACCEPTED",
      fence: null,
    });
  });

  it.each([
    null,
    { ...location, isActive: false },
    { ...location, organizationId: "foreign" },
    { ...location, geofenceLatitude: null },
    { ...location, geofenceLongitude: null },
    { ...location, geofenceRadiusMeters: null },
  ])("rejects office capture without an active tenant-assigned fence", (fence) => {
    expect(() => validateAttendanceCapture(capture, rules, fence, "org", now)).toThrow("active geofence");
  });

  it.each([
    { accuracy: 100.001 },
    { accuracy: -1 },
    { accuracy: NaN },
    { latitude: 90.1 },
    { longitude: 180.1 },
    { latitude: Infinity },
    { capturedAt: "invalid" },
    { capturedAt: "2026-11-15T08:58:59.999Z" },
    { capturedAt: "2026-11-15T09:00:10.001Z" },
  ])("rejects invalid/stale/inaccurate position %p", (position) => {
    expect(() =>
      validateAttendanceCapture({ ...capture, position: { ...gps, ...position } }, rules, location, "org", now),
    ).toThrow();
  });

  it("honors configured accuracy and accepts the 60-second freshness boundary", () => {
    const input = { ...capture, position: { ...gps, capturedAt: "2026-11-15T08:59:00Z" } };
    expect(validateAttendanceCapture(input, rules, location, "org", now)).toBeDefined();
    expect(() =>
      validateAttendanceCapture(capture, { ...rules, attendanceGpsMaxAccuracyMeters: 99 }, location, "org", now),
    ).toThrow("99 meters");
  });

  it("does not enforce an office fence while rollout is disabled", () => {
    expect(
      validateAttendanceCapture(
        { ...capture, position: undefined },
        { ...rules, attendanceGpsEnabled: false },
        null,
        "org",
        now,
      ),
    ).toMatchObject({
      validation: "NOT_REQUIRED",
      position: null,
    });
  });

  it("handles the antimeridian and poles without invalid distances", () => {
    expect(distanceMeters(0, 179.999, 0, -179.999)).toBeCloseTo(222.39, 1);
    expect(distanceMeters(90, 0, 90, 180)).toBeCloseTo(0, 5);
    expect(distanceMeters(0, 0, 0, 180)).toBeCloseTo(20015086.8, 0);
  });
});

describe("attendance capture DTOs", () => {
  const options = { whitelist: true, forbidNonWhitelisted: true };
  it("accepts both web and native capture without trusting server-derived fields", async () => {
    expect(await validate(plainToInstance(ClockInDto, { date: "2026-11-15", capture }), options)).toEqual([]);
    expect(
      await validate(plainToInstance(AttendancePunchDto, { capture: { ...capture, source: "NATIVE" } }), options),
    ).toEqual([]);
    expect(
      await validate(
        plainToInstance(AttendancePunchDto, { capture: { ...capture, validation: "GEOFENCE_ACCEPTED" } }),
        options,
      ),
    ).not.toEqual([]);
  });

  it.each([
    null,
    {},
    [capture],
    { ...capture, position: [gps] },
    { ...capture, mode: "OTHER" },
    { ...capture, source: "BIOMETRIC" },
    { ...capture, device: "forged-device" },
    { ...capture, position: null },
    { ...capture, position: { latitude: 91, longitude: 0, accuracy: 10, capturedAt: now.toISOString() } },
    { ...capture, position: { latitude: 0, longitude: 0, capturedAt: now.toISOString() } },
  ])("rejects malformed or forged capture %p", async (input) => {
    expect(await validate(plainToInstance(AttendancePunchDto, { capture: input }), options)).not.toEqual([]);
  });

  it("validates geofence ranges and integer settings", async () => {
    const input = { name: "Office", code: "OFFICE", countryCode: "IN", timezone: "Asia/Kolkata" };
    expect(
      await validate(
        plainToInstance(CreateHrmsLocationDto, {
          ...input,
          geofenceLatitude: 0,
          geofenceLongitude: 0,
          geofenceRadiusMeters: 1,
        }),
      ),
    ).toEqual([]);
    expect(await validate(plainToInstance(CreateHrmsLocationDto, { ...input, geofenceRadiusMeters: 0 }))).not.toEqual(
      [],
    );
    for (const value of [0, 1001, 1.5, "100"]) {
      expect(
        await validate(plainToInstance(UpdateHrmsSettingsDto, { attendanceGpsMaxAccuracyMeters: value })),
      ).not.toEqual([]);
    }
    expect(
      await validate(
        plainToInstance(UpdateHrmsSettingsDto, { attendanceGpsEnabled: true, attendanceGpsMaxAccuracyMeters: 100 }),
      ),
    ).toEqual([]);
  });
});
