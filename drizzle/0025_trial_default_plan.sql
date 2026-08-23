ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT 'TRIAL';--> statement-breakpoint
UPDATE "users" SET "plan_id" = 'TRIAL' WHERE "plan_id" = 'FREE';--> statement-breakpoint
UPDATE "users" SET "trial_ends_at" = NOW() + INTERVAL '7 days' WHERE "plan_id" = 'TRIAL' AND "trial_ends_at" IS NULL;--> statement-breakpoint
UPDATE "subscriptions" SET "plan_id" = 'TRIAL' WHERE "plan_id" = 'FREE';
