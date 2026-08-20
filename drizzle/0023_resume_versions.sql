ALTER TABLE "resumes" ADD COLUMN "family_id" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "thread_id" text;--> statement-breakpoint
UPDATE "resumes" SET "family_id" = "id" WHERE "family_id" IS NULL;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "family_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "resumes_family_id_version_uidx" ON "resumes" USING btree ("family_id","version");--> statement-breakpoint
CREATE INDEX "resumes_user_id_family_id_idx" ON "resumes" USING btree ("user_id","family_id");--> statement-breakpoint
CREATE INDEX "resumes_user_id_thread_id_idx" ON "resumes" USING btree ("user_id","thread_id");
