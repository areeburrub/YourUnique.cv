ALTER TABLE "user_contexts" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "user_contexts" ADD COLUMN "introduction" text;--> statement-breakpoint
ALTER TABLE "user_contexts" ADD COLUMN "template_selected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "user_contexts" AS "uc"
SET
	"linkedin_url" = COALESCE("uc"."linkedin_url", ''),
	"introduction" = COALESCE("uc"."introduction", ''),
	"template_selected" = true
FROM "users" AS "u"
WHERE "u"."id" = "uc"."user_id"
	AND "u"."onboarded_at" IS NOT NULL;
