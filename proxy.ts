import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, request) => {
	if (request.nextUrl.pathname !== "/templates") {
		return;
	}

	const { userId } = await auth();
	if (userId) {
		return;
	}

	const url = request.nextUrl.clone();
	url.pathname = "/template-library";
	return NextResponse.rewrite(url);
});

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
