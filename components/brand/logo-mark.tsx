import { LOGO_MARK_PATH, LOGO_VIEWBOX } from "@/lib/brand";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
	className?: string;
	size?: number;
	title?: string;
};

export function LogoMark({ className, size = 32, title }: LogoMarkProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox={LOGO_VIEWBOX}
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn("shrink-0", className)}
			aria-hidden={title ? undefined : true}
			role={title ? "img" : undefined}
		>
			{title ? <title>{title}</title> : null}
			<path d={LOGO_MARK_PATH} fill="currentColor" />
		</svg>
	);
}
