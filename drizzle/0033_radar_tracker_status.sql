ALTER TABLE "radar_user_jobs" ADD COLUMN IF NOT EXISTS "tracker_status" text DEFAULT 'new' NOT NULL;

