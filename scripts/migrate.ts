import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set");
}

type Journal = {
	entries: { tag: string; when: number }[];
};

const drizzleDir = resolve(process.cwd(), "drizzle");
const journal = JSON.parse(
	readFileSync(resolve(drizzleDir, "meta/_journal.json"), "utf8"),
) as Journal;

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
	await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
	await client.query(`
		CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at bigint
		)
	`);

	const last = await client.query<{ created_at: string }>(
		`SELECT created_at FROM drizzle.__drizzle_migrations
		 ORDER BY created_at DESC LIMIT 1`,
	);
	const lastAt = last.rows[0] ? Number(last.rows[0].created_at) : 0;

	for (const entry of journal.entries) {
		if (entry.when <= lastAt) {
			continue;
		}

		const sql = readFileSync(resolve(drizzleDir, `${entry.tag}.sql`), "utf8");
		const hash = createHash("sha256").update(sql).digest("hex");
		const statements = sql
			.split("--> statement-breakpoint")
			.map((statement) => statement.trim())
			.filter(Boolean);

		await client.query("BEGIN");
		try {
			for (const statement of statements) {
				await client.query(statement);
			}
			await client.query(
				`INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
				 VALUES ($1, $2)`,
				[hash, String(entry.when)],
			);
			await client.query("COMMIT");
			console.log(`Applied ${entry.tag}`);
		} catch (error) {
			await client.query("ROLLBACK");
			console.error(`Failed ${entry.tag}`);
			throw error;
		}
	}
} finally {
	await client.end();
}
