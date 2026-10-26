CREATE TYPE "CalendarEventKind" AS ENUM ('EVENT', 'MEETING');
CREATE TYPE "EventAvailability" AS ENUM ('FREE', 'BUSY');
CREATE TYPE "EventPrivacy" AS ENUM ('DEFAULT', 'PRIVATE');

ALTER TABLE "calendar_events"
  ADD COLUMN "kind" "CalendarEventKind" NOT NULL DEFAULT 'EVENT',
  ADD COLUMN "availability" "EventAvailability" NOT NULL DEFAULT 'BUSY',
  ADD COLUMN "privacy" "EventPrivacy" NOT NULL DEFAULT 'DEFAULT',
  ADD COLUMN "reminderMinutes" INTEGER,
  ADD COLUMN "isOnlineMeeting" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "connectChannelId" UUID;

CREATE UNIQUE INDEX "calendar_events_connectChannelId_key"
  ON "calendar_events"("connectChannelId");
CREATE INDEX "calendar_events_organizationId_kind_startsAt_idx"
  ON "calendar_events"("organizationId", "kind", "startsAt");

ALTER TABLE "calendar_events"
  ADD CONSTRAINT "calendar_events_connectChannelId_fkey"
  FOREIGN KEY ("connectChannelId") REFERENCES "channels"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
