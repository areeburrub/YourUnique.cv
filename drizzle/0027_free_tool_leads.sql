CREATE TABLE "free_tool_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"tool" text NOT NULL,
	"lead_name" text,
	"lead_email" text,
	"resume_file_key" text,
	"resume_filename" text,
	"job_text" text,
	"result_json" jsonb,
	"cost_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "free_tool_leads_created_at_idx" ON "free_tool_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "free_tool_leads_lead_email_idx" ON "free_tool_leads" USING btree ("lead_email");--> statement-breakpoint
CREATE INDEX "free_tool_leads_tool_idx" ON "free_tool_leads" USING btree ("tool");
