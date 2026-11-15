ALTER TABLE "hrms_organization_settings"
  ADD COLUMN "attendanceGpsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "attendanceGpsMaxAccuracyMeters" INTEGER NOT NULL DEFAULT 100,
  ADD CONSTRAINT "hrms_attendance_gps_accuracy_check"
    CHECK ("attendanceGpsMaxAccuracyMeters" BETWEEN 1 AND 1000);

ALTER TABLE "hrms_locations"
  ADD COLUMN "geofenceLatitude" DOUBLE PRECISION,
  ADD COLUMN "geofenceLongitude" DOUBLE PRECISION,
  ADD COLUMN "geofenceRadiusMeters" INTEGER,
  ADD CONSTRAINT "hrms_location_geofence_check" CHECK (
    ("geofenceLatitude" IS NULL AND "geofenceLongitude" IS NULL AND "geofenceRadiusMeters" IS NULL)
    OR (
      "geofenceLatitude" IS NOT NULL AND "geofenceLongitude" IS NOT NULL AND "geofenceRadiusMeters" IS NOT NULL
      AND "geofenceLatitude" BETWEEN -90 AND 90
      AND "geofenceLongitude" BETWEEN -180 AND 180
      AND "geofenceRadiusMeters" BETWEEN 1 AND 100000
    )
  );

ALTER TABLE "hrms_attendance_records"
  ADD COLUMN "checkInCapture" JSONB,
  ADD COLUMN "checkOutCapture" JSONB;
