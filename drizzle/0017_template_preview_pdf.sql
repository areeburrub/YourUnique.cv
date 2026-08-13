ALTER TABLE "resume_templates" ADD COLUMN "preview_pdf_file_id" text;--> statement-breakpoint
ALTER TABLE "resume_templates" ADD CONSTRAINT "resume_templates_preview_pdf_file_id_user_files_id_fk" FOREIGN KEY ("preview_pdf_file_id") REFERENCES "public"."user_files"("id") ON DELETE set null ON UPDATE no action;
