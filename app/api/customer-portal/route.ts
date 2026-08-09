import { auth, currentUser } from "@clerk/nextjs/server";
import { CustomerPortal } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { resolveDodoCustomerId } from "@/lib/dodo-customer";
import { dodoEnvironment } from "@/lib/dodo";

const portal = CustomerPortal({
	bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
	environment: dodoEnvironment(),
});

export async function GET(req: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const user = await currentUser();
	const email = user?.primaryEmailAddress?.emailAddress;
	const customerId = await resolveDodoCustomerId({ userId, email });
	if (!customerId) {
		return NextResponse.json(
			{ error: "No subscription found" },
			{ status: 404 },
		);
	}

	const url = req.nextUrl.clone();
	url.searchParams.set("customer_id", customerId);

	return portal(new NextRequest(url, { headers: req.headers }));
}
