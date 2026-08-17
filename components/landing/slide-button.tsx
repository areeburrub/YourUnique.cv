import Link from "next/link";

import { cn } from "@/lib/utils";

type SlideButtonProps = {
	href: string;
	children: string;
	variant?: "primary" | "outline" | "on-brand";
	className?: string;
};

export function SlideButton({
	href,
	children,
	variant = "primary",
	className,
}: SlideButtonProps) {
	return (
		<Link
			href={href}
			className={cn(
				"inline-flex h-12 items-center justify-center rounded-full border px-7 text-base font-medium transition-all duration-200 hover:-translate-y-px",
				variant === "primary" &&
					"brand-shadow border-brand bg-brand text-brand-foreground hover:bg-brand/90",
				variant === "outline" &&
					"border-border bg-card text-foreground hover:bg-muted",
				variant === "on-brand" &&
					"border-white bg-white text-brand hover:bg-white/90",
				className,
			)}
		>
			{children}
		</Link>
	);
}
