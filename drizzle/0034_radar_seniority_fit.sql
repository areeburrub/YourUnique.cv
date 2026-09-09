ALTER TABLE "radar_user_jobs" ADD COLUMN IF NOT EXISTS "seniority_fit" text DEFAULT 'unclear' NOT NULL;
