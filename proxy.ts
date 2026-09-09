import { clerkMiddleware } from "@clerk/nextjs/server";
import {
	NextResponse,
	type NextFetchEvent,
	type NextRequest,
} from "next/server";

const PUBLIC_PREFIXES = [
	"/articles",
	"/free-tools",
	"/terms",
	"/privacy",
	"/template-library",
	"/job-radar-marketing",
	"/unsubscribe",
	"/llms.txt",
	"/llm.txt",
	"/opengraph-image",
	"/twitter-image",
	"/api/tools",
	"/api/articles",
	"/api/webhooks/dodo",
	"/api/webhooks/clerk",
	"/api/webhooks/radar",
];

function isPublicPath(pathname: string) {
	if (pathname === "/" || pathname === "/sitemap.xml") {
		return true;
	}
	return PUBLIC_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

const runClerk = clerkMiddleware(async (auth, request) => {
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

export default function proxy(req: NextRequest, event: NextFetchEvent) {
	if (isPublicPath(req.nextUrl.pathname)) {
		return NextResponse.next();
	}
	return runClerk(req, event);
}

export const config = {
	matcher: [
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
