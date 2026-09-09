ALTER TABLE "radar_user_jobs" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "radar_user_jobs" ADD COLUMN "dismissed_reason" text;--> statement-breakpoint
CREATE TABLE "radar_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"current_location" text DEFAULT '' NOT NULL,
	"open_to_relocation" boolean DEFAULT false NOT NULL,
	"preferred_locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"relocation_radius_km" integer,
	"workplace_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"extra_preferences" text DEFAULT '' NOT NULL,
	"negative_preferences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prompt_text" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "radar_preferences" ADD CONSTRAINT "radar_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
