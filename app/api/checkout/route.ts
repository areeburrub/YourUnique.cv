import { auth, currentUser } from "@clerk/nextjs/server";
import { Checkout } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { dodoEnvironment, dodoReturnUrl } from "@/lib/dodo";
import { PlanId, PLANS } from "@/lib/plans";

const dodoCheckout = Checkout({
	bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
	returnUrl: dodoReturnUrl(),
	environment: dodoEnvironment(),
	type: "static",
});

function checkoutPlanId(req: NextRequest) {
	const plan = req.nextUrl.searchParams.get("plan")?.trim().toUpperCase();
	if (plan === PlanId.LIFETIME) {
		return PlanId.LIFETIME;
	}
	return PlanId.PRO;
}

export async function GET(req: NextRequest) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const user = await currentUser();
	const email = user?.primaryEmailAddress?.emailAddress;
	const firstName = user?.firstName?.trim() || "";
	const lastName = user?.lastName?.trim() || "";
	const fullName =
		user?.fullName?.trim() ||
		[firstName, lastName].filter(Boolean).join(" ");
	const url = req.nextUrl.clone();

	const planId = checkoutPlanId(req);
	const productId = PLANS[planId].dodoProductId;
	if (!productId) {
		return NextResponse.json(
			{ error: "Checkout is not configured" },
			{ status: 503 },
		);
	}
	url.searchParams.set("productId", productId);

	url.searchParams.set("metadata_userId", userId);
	url.searchParams.set("metadata_planId", planId);
	if (email && !url.searchParams.get("email")) {
		url.searchParams.set("email", email);
	}
	if (firstName && !url.searchParams.get("firstName")) {
		url.searchParams.set("firstName", firstName);
	}
	if (lastName && !url.searchParams.get("lastName")) {
		url.searchParams.set("lastName", lastName);
	}
	if (fullName && !url.searchParams.get("fullName")) {
		url.searchParams.set("fullName", fullName);
	}

	const response = await dodoCheckout(
		new NextRequest(url, { headers: req.headers }),
	);

	if (!response.ok) {
		return response;
	}

	const data = (await response.json()) as { checkout_url?: string };
	if (!data.checkout_url) {
		return NextResponse.json(
			{ error: "No checkout URL returned" },
			{ status: 502 },
		);
	}

	return NextResponse.redirect(data.checkout_url);
}
