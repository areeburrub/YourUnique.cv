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
} from "drizzle-orm/pg-core";

import { PLAN_IDS, PlanId } from "@/lib/plans";

export const planIdEnum = pgEnum("plan_id", PLAN_IDS);

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url"),
	planId: planIdEnum("plan_id").notNull().default(PlanId.FREE),
	isAdmin: boolean("is_admin").notNull().default(false),
	bonusCreditsUsd: numeric("bonus_credits_usd", {
		precision: 10,
		scale: 4,
	})
		.notNull()
		.default("0"),
	dodoCustomerId: text("dodo_customer_id"),
	onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
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
	style: text("style").notNull(),
	role: text("role"),
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

export const usersRelations = relations(users, ({ many, one }) => ({
	files: many(userFiles),
	context: one(userContexts, {
		fields: [users.id],
		references: [userContexts.userId],
	}),
	usageDaily: many(usageDaily),
	creditGrants: many(creditGrants, { relationName: "grantee" }),
	grantsGiven: many(creditGrants, { relationName: "granter" }),
	subscriptions: many(subscriptions),
}));

export const userFilesRelations = relations(userFiles, ({ one }) => ({
	user: one(users, {
		fields: [userFiles.userId],
		references: [users.id],
	}),
}));

export const userContextsRelations = relations(userContexts, ({ one }) => ({
	user: one(users, {
		fields: [userContexts.userId],
		references: [users.id],
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
