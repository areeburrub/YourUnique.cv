CREATE TYPE "public"."plan_id" AS ENUM('FREE', 'PRO');--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan_id" SET DATA TYPE "public"."plan_id" USING "plan_id"::"public"."plan_id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DEFAULT 'FREE'::"public"."plan_id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "plan_id" SET DATA TYPE "public"."plan_id" USING "plan_id"::"public"."plan_id";