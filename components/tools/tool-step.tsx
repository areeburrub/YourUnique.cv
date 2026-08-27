import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ToolStep({
	index,
	title,
	done,
	last,
	children,
}: {
	index: number;
	title: string;
	done: boolean;
	last?: boolean;
	children: ReactNode;
}) {
	return (
		<li className={cn("relative flex gap-4", !last && "pb-8")}>
			{last ? null : (
				<span
					aria-hidden
					className={cn(
						"absolute top-8 bottom-0 left-[15px] w-px",
						done ? "bg-brand" : "bg-border",
					)}
				/>
			)}
			<span
				className={cn(
					"relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-medium",
					done
						? "border-brand bg-brand text-brand-foreground"
						: "border-border bg-background text-muted-foreground",
				)}
			>
				{index}
			</span>
			<div className="min-w-0 flex-1 pt-0.5">
				<h2 className="text-[15px] font-medium text-foreground">
					{title}
				</h2>
				<div className="mt-3">{children}</div>
			</div>
		</li>
	);
}
