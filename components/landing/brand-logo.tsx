import { FileText } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
	return (
		<Link
			href="/"
			className={cn(
				"inline-flex min-w-0 items-center gap-1.5 text-foreground sm:gap-2",
				className,
			)}
		>
			<span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-surface-subtle text-foreground sm:size-8">
				<FileText size={16} weight="bold" />
			</span>
			<span className="font-display truncate text-[15px] font-bold tracking-[-0.4px] sm:text-lg sm:tracking-[-0.48px]">
				YourUnique.cv
			</span>
		</Link>
	);
}
