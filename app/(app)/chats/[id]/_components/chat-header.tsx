type ChatHeaderProps = {
	title: string;
};

export function ChatHeader({ title }: ChatHeaderProps) {
	return (
		<div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
			<div className="mx-auto w-full max-w-3xl">
				<h1 className="truncate font-display text-[18px] font-medium tracking-[-0.36px] text-foreground">
					{title}
				</h1>
			</div>
		</div>
	);
}
