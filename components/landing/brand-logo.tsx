import { FileText } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
	return (
		<Link
			href="/"
			className={cn(
				"inline-flex items-center gap-2 text-foreground",
				className,
			)}
		>
			<span className="flex size-8 items-center justify-center rounded-[8px] bg-surface-subtle text-foreground">
				<FileText size={16} weight="bold" />
			</span>
			<span className="font-display text-lg font-bold tracking-[-0.48px]">
				YourUnique.cv
			</span>
		</Link>
	);
}
