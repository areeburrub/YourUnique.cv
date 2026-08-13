ALTER TABLE "user_contexts" DROP COLUMN IF EXISTS "template_selected";--> statement-breakpoint
ALTER TABLE "user_contexts" ALTER COLUMN "template_ref" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_contexts" ALTER COLUMN "template_ref" DROP NOT NULL;--> statement-breakpoint
UPDATE "user_contexts" AS "uc"
SET "template_ref" = NULL
FROM "users" AS "u"
WHERE "u"."id" = "uc"."user_id"
	AND "u"."onboarded_at" IS NULL;
