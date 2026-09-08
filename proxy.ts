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
	"/unsubscribe",
	"/llms.txt",
	"/llm.txt",
	"/opengraph-image",
	"/twitter-image",
	"/api/tools",
	"/api/articles",
	"/api/webhooks/dodo",
	"/api/webhooks/clerk",
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
