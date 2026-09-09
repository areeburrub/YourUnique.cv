import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
	const path = request.nextUrl.pathname;

	if (path === "/templates") {
		const { userId } = await auth();
		if (userId) {
			return;
		}
		const url = request.nextUrl.clone();
		url.pathname = "/template-library";
		return NextResponse.rewrite(url);
	}

	if (path === "/job-radar") {
		const { userId } = await auth();
		if (userId) {
			return;
		}
		const url = request.nextUrl.clone();
		url.pathname = "/job-radar-marketing";
		return NextResponse.rewrite(url);
	}
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
