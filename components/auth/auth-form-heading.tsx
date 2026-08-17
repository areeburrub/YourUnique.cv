import { cn } from "@/lib/utils";

type AuthFormHeadingProps = {
	title: string;
	subtitle: string;
	className?: string;
};

export function AuthFormHeading({
	title,
	subtitle,
	className,
}: AuthFormHeadingProps) {
	return (
		<div className={cn("w-full", className)}>
			<h1 className="font-display text-center text-[28px] leading-9 font-semibold tracking-[-0.56px] text-foreground">
				{title}
			</h1>
			<p className="mt-2 text-center text-[15px] leading-6 text-muted-foreground">
				{subtitle}
			</p>
		</div>
	);
}
