ALTER TABLE "resumes" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "role_title" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "job_link" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "preview_file_id" text;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_preview_file_id_user_files_id_fk" FOREIGN KEY ("preview_file_id") REFERENCES "public"."user_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resumes_user_id_created_at_idx" ON "resumes" USING btree ("user_id","created_at");
