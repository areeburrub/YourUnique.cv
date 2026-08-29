ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pro_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT 'FREE';--> statement-breakpoint
UPDATE "users" SET "plan_id" = 'FREE' WHERE "plan_id" = 'TRIAL';--> statement-breakpoint
UPDATE "subscriptions" SET "plan_id" = 'FREE' WHERE "plan_id" = 'TRIAL';
