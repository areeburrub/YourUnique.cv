CREATE TYPE "public"."compile_status" AS ENUM('idle', 'queued', 'compiling', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"source_typ" text NOT NULL,
	"job_description" text,
	"pdf_file_id" text,
	"compile_status" "compile_status" DEFAULT 'idle' NOT NULL,
	"compile_error" text,
	"compiled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_pdf_file_id_user_files_id_fk" FOREIGN KEY ("pdf_file_id") REFERENCES "public"."user_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resumes_user_id_updated_at_idx" ON "resumes" USING btree ("user_id","updated_at");