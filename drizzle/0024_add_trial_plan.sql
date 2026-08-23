ALTER TYPE "public"."plan_id" ADD VALUE IF NOT EXISTS 'TRIAL';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_ends_at" timestamp with time zone;
