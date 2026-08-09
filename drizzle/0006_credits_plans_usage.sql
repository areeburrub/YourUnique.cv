CREATE TABLE "credit_grants" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount_usd" numeric(10, 4) NOT NULL,
	"note" text,
	"granted_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"monthly_limit_usd" numeric(10, 4) NOT NULL,
	"daily_limit_usd" numeric(10, 4) NOT NULL,
	"dodo_product_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "plans" ("id", "name", "monthly_limit_usd", "daily_limit_usd") VALUES
	('FREE', 'Free', '1.0000', '0.0500'),
	('PRO', 'Pro', '19.0000', '0.9500');
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text NOT NULL,
	"plan_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_daily" (
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"cost_usd" numeric(10, 4) DEFAULT '0' NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_daily_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_id" text DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bonus_credits_usd" numeric(10, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_grants" ADD CONSTRAINT "credit_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_grants" ADD CONSTRAINT "credit_grants_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_daily" ADD CONSTRAINT "usage_daily_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_grants_user_id_created_at_idx" ON "credit_grants" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usage_daily_user_id_date_idx" ON "usage_daily" USING btree ("user_id","date");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;