CREATE TYPE "public"."template_status" AS ENUM('drafting', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "user_contexts" ADD COLUMN "template_ref" text DEFAULT 'builtin:classic-serif' NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "template_ref" text DEFAULT 'builtin:classic-serif' NOT NULL;--> statement-breakpoint
CREATE TABLE "resume_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"input_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"html" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"source_file_id" text,
	"preview_file_id" text,
	"status" "template_status" DEFAULT 'drafting' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "resume_templates" ADD CONSTRAINT "resume_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_templates" ADD CONSTRAINT "resume_templates_source_file_id_user_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."user_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_templates" ADD CONSTRAINT "resume_templates_preview_file_id_user_files_id_fk" FOREIGN KEY ("preview_file_id") REFERENCES "public"."user_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resume_templates_user_id_updated_at_idx" ON "resume_templates" USING btree ("user_id","updated_at");--> statement-breakpoint
UPDATE "user_contexts" SET "template_ref" = 'builtin:classic-serif' WHERE "template_ref" IS NULL;--> statement-breakpoint
UPDATE "resumes" SET "template_ref" = 'builtin:classic-serif' WHERE "template_ref" IS NULL;
