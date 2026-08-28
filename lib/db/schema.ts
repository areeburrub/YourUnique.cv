import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { PLAN_IDS, PlanId } from "@/lib/plans";
import type { ResumeStyleMemory } from "@/lib/resume-style";

export const planIdEnum = pgEnum("plan_id", PLAN_IDS);

export const COMPILE_STATUSES = [
	"idle",
	"queued",
	"compiling",
	"ready",
	"failed",
] as const;

export type CompileStatus = (typeof COMPILE_STATUSES)[number];

export const compileStatusEnum = pgEnum("compile_status", COMPILE_STATUSES);

export const TEMPLATE_STATUSES = ["drafting", "ready", "failed"] as const;

export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export const templateStatusEnum = pgEnum("template_status", TEMPLATE_STATUSES);

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url"),
	planId: planIdEnum("plan_id").notNull().default(PlanId.TRIAL),
	isAdmin: boolean("is_admin").notNull().default(false),
	bonusCreditsUsd: numeric("bonus_credits_usd", {
		precision: 10,
		scale: 4,
	})
		.notNull()
		.default("0"),
	dodoCustomerId: text("dodo_customer_id"),
	onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
	trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
	lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
	emailProductEnabled: boolean("email_product_enabled").notNull().default(true),
	emailRemindersEnabled: boolean("email_reminders_enabled")
		.notNull()
		.default(true),
	emailTrialEnabled: boolean("email_trial_enabled").notNull().default(true),
	quietDripStep: integer("quiet_drip_step").notNull().default(0),
	quietDripStartedAt: timestamp("quiet_drip_started_at", {
		withTimezone: true,
	}),
	quietDripLastSentAt: timestamp("quiet_drip_last_sent_at", {
		withTimezone: true,
	}),
	quietDripLastCycleAt: timestamp("quiet_drip_last_cycle_at", {
		withTimezone: true,
	}),
	lastMarketingEmailAt: timestamp("last_marketing_email_at", {
		withTimezone: true,
	}),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const userFiles = pgTable(
	"user_files",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		threadId: text("thread_id"),
		key: text("key").notNull().unique(),
		filename: text("filename").notNull(),
		contentType: text("content_type").notNull(),
		size: integer("size").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("user_files_user_id_created_at_idx").on(table.userId, table.createdAt),
		index("user_files_thread_id_idx").on(table.threadId),
	],
);

export const userContexts = pgTable("user_contexts", {
	userId: text("user_id")
		.primaryKey()
		.references(() => users.id, { onDelete: "cascade" }),
	profile: text("profile").notNull(),
	role: text("role"),
	linkedinUrl: text("linkedin_url"),
	introduction: text("introduction"),
	templateRef: text("template_ref"),
	resumeStyle: jsonb("resume_style").$type<ResumeStyleMemory>(),
	sourceFileIds: jsonb("source_file_ids")
		.$type<string[]>()
		.notNull()
		.default([]),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const resumeTemplates = pgTable(
	"resume_templates",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		description: text("description").notNull().default(""),
		inputSchema: jsonb("input_schema")
			.$type<Record<string, unknown>>()
			.notNull()
			.default({}),
		html: text("html").notNull().default(""),
		notes: text("notes").notNull().default(""),
		sourceFileId: text("source_file_id").references(() => userFiles.id, {
			onDelete: "set null",
		}),
		previewFileId: text("preview_file_id").references(() => userFiles.id, {
			onDelete: "set null",
		}),
		previewPdfFileId: text("preview_pdf_file_id").references(() => userFiles.id, {
			onDelete: "set null",
		}),
		status: templateStatusEnum("status").notNull().default("drafting"),
		error: text("error"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("resume_templates_user_id_updated_at_idx").on(
			table.userId,
			table.updatedAt,
		),
	],
);

export const resumes = pgTable(
	"resumes",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		familyId: text("family_id").notNull(),
		version: integer("version").notNull().default(1),
		threadId: text("thread_id"),
		name: text("name").notNull(),
		templateRef: text("template_ref").notNull().default("builtin:classic-serif"),
		sourceJson: jsonb("source_json")
			.$type<Record<string, unknown>>()
			.notNull(),
		jobDescription: text("job_description"),
		companyName: text("company_name"),
		roleTitle: text("role_title"),
		jobLink: text("job_link"),
		pdfFileId: text("pdf_file_id").references(() => userFiles.id, {
			onDelete: "set null",
		}),
		previewFileId: text("preview_file_id").references(() => userFiles.id, {
			onDelete: "set null",
		}),
		compileStatus: compileStatusEnum("compile_status")
			.notNull()
			.default("idle"),
		compileError: text("compile_error"),
		compiledAt: timestamp("compiled_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("resumes_user_id_updated_at_idx").on(table.userId, table.updatedAt),
		index("resumes_user_id_created_at_idx").on(table.userId, table.createdAt),
		index("resumes_user_id_family_id_idx").on(table.userId, table.familyId),
		index("resumes_user_id_thread_id_idx").on(table.userId, table.threadId),
		uniqueIndex("resumes_family_id_version_uidx").on(table.familyId, table.version),
	],
);

export const usageDaily = pgTable(
	"usage_daily",
	{
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		date: date("date").notNull(),
		costUsd: numeric("cost_usd", { precision: 10, scale: 4 })
			.notNull()
			.default("0"),
		messageCount: integer("message_count").notNull().default(0),
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.date] }),
		index("usage_daily_user_id_date_idx").on(table.userId, table.date),
	],
);

export const creditGrants = pgTable(
	"credit_grants",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		amountUsd: numeric("amount_usd", { precision: 10, scale: 4 }).notNull(),
		note: text("note"),
		grantedBy: text("granted_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("credit_grants_user_id_created_at_idx").on(
			table.userId,
			table.createdAt,
		),
	],
);

export const subscriptions = pgTable(
	"subscriptions",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		status: text("status").notNull(),
		planId: planIdEnum("plan_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [index("subscriptions_user_id_idx").on(table.userId)],
);

export const emailSends = pgTable(
	"email_sends",
	{
		id: text("id").primaryKey(),
		userId: text("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		email: text("email").notNull(),
		templateAlias: text("template_alias").notNull(),
		dripCycle: text("drip_cycle").notNull().default("once"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("email_sends_email_alias_cycle_uidx").on(
			table.email,
			table.templateAlias,
			table.dripCycle,
		),
		index("email_sends_user_id_created_at_idx").on(
			table.userId,
			table.createdAt,
		),
	],
);

export const emailUnsubscribes = pgTable("email_unsubscribes", {
	email: text("email").primaryKey(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.defaultNow()
		.notNull(),
});

export const freeToolLeads = pgTable(
	"free_tool_leads",
	{
		id: text("id").primaryKey(),
		tool: text("tool").notNull(),
		leadName: text("lead_name"),
		leadEmail: text("lead_email"),
		resumeFileKey: text("resume_file_key"),
		resumeFilename: text("resume_filename"),
		jobText: text("job_text"),
		resultJson: jsonb("result_json").$type<Record<string, unknown>>(),
		costUsd: numeric("cost_usd", { precision: 10, scale: 6 })
			.notNull()
			.default("0"),
		durationMs: integer("duration_ms"),
		ip: text("ip"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("free_tool_leads_created_at_idx").on(table.createdAt),
		index("free_tool_leads_lead_email_idx").on(table.leadEmail),
		index("free_tool_leads_tool_idx").on(table.tool),
	],
);

export type ArticleFaq = {
	question: string;
	answer: string;
};

export const articles = pgTable(
	"articles",
	{
		id: text("id").primaryKey(),
		slug: text("slug").notNull(),
		title: text("title").notNull(),
		description: text("description").notNull(),
		content: text("content").notNull(),
		coverImageUrl: text("cover_image_url").notNull(),
		coverImageAlt: text("cover_image_alt").notNull(),
		authorName: text("author_name").notNull().default("Areeb ur Rub"),
		authorUrl: text("author_url"),
		seoTitle: text("seo_title"),
		tldr: text("tldr"),
		category: text("category"),
		keywords: jsonb("keywords").$type<string[]>().notNull().default([]),
		faq: jsonb("faq").$type<ArticleFaq[]>().notNull().default([]),
		featured: boolean("featured").notNull().default(false),
		published: boolean("published").notNull().default(false),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		uniqueIndex("articles_slug_uidx").on(table.slug),
		index("articles_published_published_at_idx").on(
			table.published,
			table.publishedAt,
		),
		index("articles_featured_published_idx").on(table.featured, table.published),
	],
);

export const usersRelations = relations(users, ({ many, one }) => ({
	files: many(userFiles),
	context: one(userContexts, {
		fields: [users.id],
		references: [userContexts.userId],
	}),
	resumes: many(resumes),
	resumeTemplates: many(resumeTemplates),
	usageDaily: many(usageDaily),
	creditGrants: many(creditGrants, { relationName: "grantee" }),
	grantsGiven: many(creditGrants, { relationName: "granter" }),
	subscriptions: many(subscriptions),
	emailSends: many(emailSends),
}));

export const userFilesRelations = relations(userFiles, ({ one, many }) => ({
	user: one(users, {
		fields: [userFiles.userId],
		references: [users.id],
	}),
	resumes: many(resumes),
}));

export const userContextsRelations = relations(userContexts, ({ one }) => ({
	user: one(users, {
		fields: [userContexts.userId],
		references: [users.id],
	}),
}));

export const resumeTemplatesRelations = relations(
	resumeTemplates,
	({ one }) => ({
		user: one(users, {
			fields: [resumeTemplates.userId],
			references: [users.id],
		}),
		sourceFile: one(userFiles, {
			fields: [resumeTemplates.sourceFileId],
			references: [userFiles.id],
		}),
		previewFile: one(userFiles, {
			fields: [resumeTemplates.previewFileId],
			references: [userFiles.id],
		}),
		previewPdfFile: one(userFiles, {
			fields: [resumeTemplates.previewPdfFileId],
			references: [userFiles.id],
		}),
	}),
);

export const resumesRelations = relations(resumes, ({ one }) => ({
	user: one(users, {
		fields: [resumes.userId],
		references: [users.id],
	}),
	pdfFile: one(userFiles, {
		fields: [resumes.pdfFileId],
		references: [userFiles.id],
	}),
}));

export const usageDailyRelations = relations(usageDaily, ({ one }) => ({
	user: one(users, {
		fields: [usageDaily.userId],
		references: [users.id],
	}),
}));

export const creditGrantsRelations = relations(creditGrants, ({ one }) => ({
	user: one(users, {
		fields: [creditGrants.userId],
		references: [users.id],
		relationName: "grantee",
	}),
	grantedByUser: one(users, {
		fields: [creditGrants.grantedBy],
		references: [users.id],
		relationName: "granter",
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id],
	}),
}));

export const emailSendsRelations = relations(emailSends, ({ one }) => ({
	user: one(users, {
		fields: [emailSends.userId],
		references: [users.id],
	}),
}));
