-- Participant heartbeat lets the API end calls abandoned by a closed tab or lost network.
ALTER TABLE "connect_call_participants" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE INDEX "connect_calls_status_startedAt_idx" ON "connect_calls"("status", "startedAt");
