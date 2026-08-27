import Image from "next/image";

import type { ToolSlug } from "@/lib/tools/catalog";
import { TOOLS } from "@/lib/tools/catalog";
import { cn } from "@/lib/utils";

const SIZE = {
	card: {
		frame: "size-20",
		sizes: "80px",
		radius: "rounded-[10px]",
	},
	compact: {
		frame: "size-14",
		sizes: "56px",
		radius: "rounded-[10px]",
	},
	page: {
		frame: "size-16",
		sizes: "64px",
		radius: "rounded-[10px]",
	},
} as const;

export function toolImageSrc(slug: ToolSlug) {
	return `/free-tool/${slug}.webp`;
}

export function ToolImage({
	slug,
	size,
	className,
}: {
	slug: ToolSlug;
	size: keyof typeof SIZE;
	className?: string;
}) {
	const spec = SIZE[size];
	const tool = TOOLS[slug];

	return (
		<span
			className={cn(
				"relative block shrink-0 overflow-hidden bg-pastel-blush",
				spec.radius,
				spec.frame,
				className,
			)}
		>
			<Image
				src={toolImageSrc(slug)}
				alt={tool.name}
				fill
				sizes={spec.sizes}
				className="object-cover"
			/>
		</span>
	);
}
