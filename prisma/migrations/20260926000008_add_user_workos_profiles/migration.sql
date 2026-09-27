CREATE TABLE "user_workos_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID NOT NULL,
  "working_hours_start" TEXT, "working_hours_end" TEXT, "working_days" INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], "working_hours_per_week" INTEGER,
  "out_of_office" BOOLEAN NOT NULL DEFAULT false, "out_of_office_from" TIMESTAMP(3), "out_of_office_to" TIMESTAMP(3), "out_of_office_message" TEXT, "vacation_balance" DOUBLE PRECISION, "sick_leave_balance" DOUBLE PRECISION,
  "focus_mode_enabled" BOOLEAN NOT NULL DEFAULT false, "focus_mode_schedule" JSONB, "do_not_disturb_until" TIMESTAMP(3), "last_active_channel" TEXT, "last_active_at" TIMESTAMP(3),
  CONSTRAINT "user_workos_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_workos_profiles_userId_key" ON "user_workos_profiles"("userId");
CREATE INDEX "user_workos_profiles_userId_idx" ON "user_workos_profiles"("userId");
ALTER TABLE "user_workos_profiles" ADD CONSTRAINT "user_workos_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;