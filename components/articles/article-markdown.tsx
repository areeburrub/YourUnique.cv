import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { slugifyHeading } from "@/lib/articles";
import { cn } from "@/lib/utils";

function childrenToText(children: ReactNode): string {
	if (typeof children === "string" || typeof children === "number") {
		return String(children);
	}
	if (Array.isArray(children)) {
		return children.map(childrenToText).join("");
	}
	if (children && typeof children === "object" && "props" in children) {
		return childrenToText(
			(children as { props?: { children?: ReactNode } }).props?.children,
		);
	}
	return "";
}

function createMarkdownComponents(): Components {
	const used = new Map<string, number>();

	function headingId(text: string) {
		const base = slugifyHeading(text) || "section";
		const count = used.get(base) ?? 0;
		used.set(base, count + 1);
		return count === 0 ? base : `${base}-${count + 1}`;
	}

	function Heading({
		as: Tag,
		children,
	}: {
		as: "h2" | "h3";
		children: ReactNode;
	}) {
		const text = childrenToText(children);
		return (
			<Tag id={headingId(text)} className="scroll-mt-24">
				{children}
			</Tag>
		);
	}

	return {
		h1: ({ children }) => <Heading as="h2">{children}</Heading>,
		h2: ({ children }) => <Heading as="h2">{children}</Heading>,
		h3: ({ children }) => <Heading as="h3">{children}</Heading>,
		a: ({ href, children }) => {
			const external = href?.startsWith("http");
			return (
				<a
					href={href}
					{...(external
						? { target: "_blank", rel: "noreferrer noopener" }
						: {})}
				>
					{children}
				</a>
			);
		},
		img: ({ src, alt }) => {
			if (!src || typeof src !== "string") {
				return null;
			}
			return (
				<img
					src={src}
					alt={alt ?? ""}
					loading="lazy"
					decoding="async"
					className="h-auto w-full rounded-2xl"
				/>
			);
		},
	};
}

export function ArticleMarkdown({
	content,
	className,
}: {
	content: string;
	className?: string;
}) {
	const components = createMarkdownComponents();

	return (
		<div className={cn("article-prose", className)}>
			<Markdown remarkPlugins={[remarkGfm]} components={components}>
				{content}
			</Markdown>
		</div>
	);
}
