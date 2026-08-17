import Link from "next/link";

import { LogoMark } from "@/components/brand/logo-mark";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
	return (
		<Link
			href="/"
			className={cn(
				"inline-flex min-w-0 items-center gap-3 text-foreground",
				className,
			)}
		>
			<LogoMark size={32} className="text-brand" />
			<span className="font-display truncate text-xl font-semibold tracking-[-0.48px] sm:text-[22px] sm:tracking-[-0.56px]">
				{SITE_NAME}
			</span>
		</Link>
	);
}
