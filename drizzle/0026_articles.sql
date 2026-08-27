CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"cover_image_url" text NOT NULL,
	"cover_image_alt" text NOT NULL,
	"author_name" text DEFAULT 'Areeb ur Rub' NOT NULL,
	"author_url" text,
	"seo_title" text,
	"tldr" text,
	"category" text,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_uidx" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "articles_published_published_at_idx" ON "articles" USING btree ("published","published_at");--> statement-breakpoint
CREATE INDEX "articles_featured_published_idx" ON "articles" USING btree ("featured","published");
