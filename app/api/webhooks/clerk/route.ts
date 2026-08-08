import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { deleteUser, upsertUser } from "@/lib/db/users";

export async function POST(req: NextRequest) {
	try {
		const evt = await verifyWebhook(req);

		if (evt.type === "user.created" || evt.type === "user.updated") {
			const email =
				evt.data.email_addresses.find(
					(address) => address.id === evt.data.primary_email_address_id,
				)?.email_address ?? evt.data.email_addresses[0]?.email_address;

			if (!email) {
				return new Response("User has no email address", { status: 400 });
			}

			await upsertUser({
				id: evt.data.id,
				email,
				firstName: evt.data.first_name,
				lastName: evt.data.last_name,
				imageUrl: evt.data.image_url,
			});
		}

		if (evt.type === "user.deleted" && evt.data.id) {
			await deleteUser(evt.data.id);
		}

		return new Response("Webhook received", { status: 200 });
	} catch (error) {
		console.error("Error verifying Clerk webhook:", error);
		return new Response("Error verifying webhook", { status: 400 });
	}
}
