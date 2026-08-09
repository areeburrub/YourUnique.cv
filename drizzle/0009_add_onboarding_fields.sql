ALTER TABLE "user_contexts" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
UPDATE "users" SET "onboarded_at" = "created_at" WHERE "onboarded_at" IS NULL;