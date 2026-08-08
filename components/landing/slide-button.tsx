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
				"group inline-flex items-center justify-center rounded-[8px] border px-5 py-2 text-base font-medium transition-transform duration-300 hover:scale-[0.98]",
				variant === "primary" &&
					"border-primary bg-primary text-primary-foreground",
				variant === "outline" &&
					"border-border bg-background text-foreground",
				variant === "on-brand" &&
					"border-white bg-white text-brand",
				className,
			)}
		>
			<span className="relative block h-6 overflow-hidden leading-none">
				<span className="block transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-6">
					<span className="flex h-6 items-center leading-6">
						{children}
					</span>
					<span
						className="flex h-6 items-center leading-6"
						aria-hidden="true"
					>
						{children}
					</span>
				</span>
			</span>
		</Link>
	);
}
