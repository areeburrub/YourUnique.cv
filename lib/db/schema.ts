import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	imageUrl: text("image_url"),
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

export const usersRelations = relations(users, ({ many, one }) => ({
	files: many(userFiles),
	context: one(userContexts, {
		fields: [users.id],
		references: [userContexts.userId],
	}),
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
