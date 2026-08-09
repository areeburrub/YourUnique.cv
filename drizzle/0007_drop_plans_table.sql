ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_plan_id_plans_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_plan_id_plans_id_fk";
--> statement-breakpoint
UPDATE "users" SET "plan_id" = 'FREE' WHERE lower("plan_id") = 'free';
--> statement-breakpoint
UPDATE "users" SET "plan_id" = 'PRO' WHERE lower("plan_id") = 'pro';
--> statement-breakpoint
UPDATE "subscriptions" SET "plan_id" = 'FREE' WHERE lower("plan_id") = 'free';
--> statement-breakpoint
UPDATE "subscriptions" SET "plan_id" = 'PRO' WHERE lower("plan_id") = 'pro';
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT 'FREE';
--> statement-breakpoint
DROP TABLE IF EXISTS "plans";
