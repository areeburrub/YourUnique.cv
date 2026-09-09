CREATE TYPE "public"."radar_match_run_status" AS ENUM('queued', 'running', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."radar_match_run_kind" AS ENUM('onboarding', 'daily');--> statement-breakpoint
CREATE TABLE "radar_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"workplace" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"posted_at" text,
	"ats_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "radar_match_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "radar_match_run_status" DEFAULT 'queued' NOT NULL,
	"kind" "radar_match_run_kind" DEFAULT 'onboarding' NOT NULL,
	"analyze_n" integer NOT NULL,
	"scanned" integer DEFAULT 0 NOT NULL,
	"analyzed" integer DEFAULT 0 NOT NULL,
	"error" text,
	"summary" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "radar_user_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"run_id" text NOT NULL,
	"rank" integer NOT NULL,
	"ats_score" numeric(6, 2) NOT NULL,
	"verdict" text DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gaps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"batch_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "radar_match_runs" ADD CONSTRAINT "radar_match_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radar_user_jobs" ADD CONSTRAINT "radar_user_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radar_user_jobs" ADD CONSTRAINT "radar_user_jobs_job_id_radar_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."radar_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radar_user_jobs" ADD CONSTRAINT "radar_user_jobs_run_id_radar_match_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."radar_match_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "radar_jobs_source_external_id_uidx" ON "radar_jobs" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "radar_match_runs_user_id_created_at_idx" ON "radar_match_runs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "radar_match_runs_user_id_status_idx" ON "radar_match_runs" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "radar_user_jobs_user_id_job_id_uidx" ON "radar_user_jobs" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX "radar_user_jobs_user_id_ats_score_idx" ON "radar_user_jobs" USING btree ("user_id","ats_score");--> statement-breakpoint
CREATE INDEX "radar_user_jobs_user_id_batch_date_idx" ON "radar_user_jobs" USING btree ("user_id","batch_date");
