import { createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
	applyRadarCallback,
	listRadarJobsForUser,
	type RadarCallbackJob,
} from "@/lib/db/radar";
import { users } from "@/lib/db/schema";
import {
	buildRadarJobsHtml,
	jobsForRadarReadyEmail,
} from "@/lib/email/radar-jobs";
import { dispatchTemplateEmail } from "@/lib/email/send";
import { radarWebhookSecret } from "@/lib/radar-client";

export const runtime = "nodejs";

type RadarWebhookBody = {
	run_id?: string;
	user_id?: string;
	status?: string;
	error?: string;
	scanned?: number;
	analyzed?: number;
	summary?: string;
	jobs?: RadarCallbackJob[];
};

function validSignature(raw: string, header: string | null, secret: string) {
	if (!secret) {
		return true;
	}
	if (!header?.startsWith("sha256=")) {
		return false;
	}
	const expected = createHmac("sha256", secret).update(raw).digest("hex");
	const got = header.slice("sha256=".length);
	try {
		const a = Buffer.from(expected, "hex");
		const b = Buffer.from(got, "hex");
		return a.length === b.length && timingSafeEqual(a, b);
	} catch {
		return false;
	}
}

export async function POST(req: Request) {
	const raw = await req.text();
	const secret = radarWebhookSecret();
	if (!validSignature(raw, req.headers.get("x-radar-signature"), secret)) {
		return NextResponse.json({ error: "invalid signature" }, { status: 401 });
	}

	let body: RadarWebhookBody;
	try {
		body = JSON.parse(raw) as RadarWebhookBody;
	} catch {
		return NextResponse.json({ error: "invalid json" }, { status: 400 });
	}

	if (!body.run_id || !body.user_id || !body.status) {
		return NextResponse.json({ error: "missing fields" }, { status: 400 });
	}

	const result = await applyRadarCallback({
		runId: body.run_id,
		userId: body.user_id,
		status: body.status,
		error: body.error,
		scanned: body.scanned,
		analyzed: body.analyzed,
		summary: body.summary,
		jobs: body.jobs ?? [],
	});

	if (body.status === "ready") {
		const user = await db.query.users.findFirst({
			where: eq(users.id, body.user_id),
			columns: { email: true, firstName: true, planId: true },
		});
		if (user?.email) {
			const listed = await listRadarJobsForUser(
				body.user_id,
				user.planId ?? "FREE",
			);
			const emailJobs = jobsForRadarReadyEmail(listed.jobs);
			await dispatchTemplateEmail({
				alias: "yucv-radar-ready",
				to: user.email,
				userId: body.user_id,
				dripCycle: body.run_id,
				variables: {
					JOB_COUNT: String(
						listed.visible ||
							listed.jobs.length ||
							result.stored ||
							body.analyzed ||
							0,
					),
					JOBS_HTML: buildRadarJobsHtml(emailJobs),
				},
				ctaPath: "/job-radar",
			});
		}
	}

	return NextResponse.json({ ok: true, stored: result.stored });
}
