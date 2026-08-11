ALTER TABLE "resumes" ADD COLUMN "source_json" jsonb;-->statement-breakpoint
UPDATE "resumes" SET "source_json" = '{}'::jsonb WHERE "source_json" IS NULL;-->statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "source_json" SET NOT NULL;-->statement-breakpoint
ALTER TABLE "resumes" DROP COLUMN "source_tex";
