"use client";

import { cn } from "@/lib/utils";

type ResumePdfCardProps = {
	name: string;
	previewUrl: string;
	downloadUrl: string;
	className?: string;
};

export function ResumePdfCard({
	name,
	previewUrl,
	className,
}: ResumePdfCardProps) {
	const fileName = name.toLowerCase().endsWith(".pdf")
		? name
		: `${name}.pdf`;

	return (
		<a
			href={previewUrl}
			target="_blank"
			rel="noreferrer"
			className={cn(
				"inline-flex max-w-[min(100%,20rem)] items-center gap-2.5 rounded-3xl bg-secondary px-3 py-2.5 text-foreground transition-opacity hover:opacity-90",
				className,
			)}
		>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#e53935] text-white">
				<span className="text-[9px] font-semibold tracking-wide">PDF</span>
			</span>
			<span className="flex min-w-0 flex-col justify-center gap-0.5">
				<span className="truncate text-sm font-medium leading-tight">
					{fileName}
				</span>
				<span className="text-[12px] leading-none text-muted-foreground">
					PDF
				</span>
			</span>
		</a>
	);
}
