ALTER TABLE "users" ADD COLUMN "last_activity_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "email_product_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "users" ADD COLUMN "email_reminders_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "users" ADD COLUMN "email_trial_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "users" ADD COLUMN "quiet_drip_step" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN "quiet_drip_started_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "quiet_drip_last_sent_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "quiet_drip_last_cycle_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "last_marketing_email_at" timestamp with time zone;

CREATE TABLE "email_sends" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"template_alias" text NOT NULL,
	"drip_cycle" text DEFAULT 'once' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "email_sends_email_alias_cycle_uidx" ON "email_sends" USING btree ("email","template_alias","drip_cycle");
--> statement-breakpoint
CREATE INDEX "email_sends_user_id_created_at_idx" ON "email_sends" USING btree ("user_id","created_at");

CREATE TABLE "email_unsubscribes" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
