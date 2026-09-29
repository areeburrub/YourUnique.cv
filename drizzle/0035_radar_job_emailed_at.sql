ALTER TABLE "radar_user_jobs" ADD COLUMN IF NOT EXISTS "emailed_at" timestamp with time zone;--> statement-breakpoint
-- Roles already on the board were eligible for earlier radar emails.
-- Stamp them once so the next email only includes roles matched after this.
UPDATE "radar_user_jobs"
SET "emailed_at" = "created_at"
WHERE "emailed_at" IS NULL;
