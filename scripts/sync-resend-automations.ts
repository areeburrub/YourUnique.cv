import { Resend } from "resend";

import {
	RESEND_EVENT_DEFS,
	resendAutomationGraphs,
} from "../lib/email/resend-automations";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
	throw new Error("RESEND_API_KEY is required");
}

const resend = new Resend(apiKey);

async function listAllEvents() {
	const rows = [];
	let after: string | undefined;
	for (let i = 0; i < 20; i += 1) {
		const { data, error } = await resend.events.list(
			after ? { limit: 100, after } : { limit: 100 },
		);
		if (error) {
			throw new Error(`List events failed: ${error.message}`);
		}
		const batch = data?.data ?? [];
		rows.push(...batch);
		if (!data?.has_more || batch.length === 0) {
			break;
		}
		after = batch[batch.length - 1]?.id;
	}
	return rows;
}

async function listAllAutomations() {
	const rows = [];
	let after: string | undefined;
	for (let i = 0; i < 20; i += 1) {
		const { data, error } = await resend.automations.list(
			after ? { limit: 100, after } : { limit: 100 },
		);
		if (error) {
			throw new Error(`List automations failed: ${error.message}`);
		}
		const batch = data?.data ?? [];
		rows.push(...batch);
		if (!data?.has_more || batch.length === 0) {
			break;
		}
		after = batch[batch.length - 1]?.id;
	}
	return rows;
}

async function main() {
	const events = await listAllEvents();
	const eventsByName = new Map(events.map((event) => [event.name, event]));

	for (const def of RESEND_EVENT_DEFS) {
		const existing = eventsByName.get(def.name);
		if (existing) {
			console.log(`event exists ${def.name}`);
			continue;
		}
		console.log(`create event ${def.name}`);
		const { error } = await resend.events.create({
			name: def.name,
			schema: def.schema,
		});
		if (error) {
			throw new Error(`Create event ${def.name}: ${error.message}`);
		}
	}

	const automations = await listAllAutomations();
	const byName = new Map(
		automations.map((automation) => [automation.name, automation]),
	);

	for (const graph of resendAutomationGraphs()) {
		const existing = byName.get(graph.name);
		if (existing) {
			console.log(`automation exists ${graph.name} (${existing.id})`);
			if (existing.status !== "enabled") {
				const { error } = await resend.automations.update(existing.id, {
					status: "enabled",
				});
				if (error) {
					throw new Error(
						`Enable ${graph.name}: ${error.message}`,
					);
				}
				console.log(`enabled ${graph.name}`);
			}
			continue;
		}
		console.log(`create automation ${graph.name}`);
		const { data, error } = await resend.automations.create({
			...graph,
			status: "enabled",
		});
		if (error) {
			throw new Error(`Create ${graph.name}: ${error.message}`);
		}
		console.log(`created ${graph.name} (${data?.id})`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
