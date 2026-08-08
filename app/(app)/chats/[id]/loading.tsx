import { Skeleton } from "@/components/ui/skeleton";

export default function ChatThreadLoading() {
	return (
		<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="min-h-0 flex-1 overflow-hidden">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
					<div className="flex flex-col gap-2 self-end max-w-[85%]">
						<Skeleton className="h-4 w-48" />
						<Skeleton className="h-4 w-64" />
					</div>
					<div className="flex flex-col gap-2 max-w-[85%]">
						<Skeleton className="h-4 w-56" />
						<Skeleton className="h-4 w-72" />
						<Skeleton className="h-4 w-40" />
					</div>
					<div className="flex flex-col gap-2 self-end max-w-[85%]">
						<Skeleton className="h-4 w-36" />
					</div>
				</div>
			</div>
			<div className="shrink-0 border-t border-border bg-background px-4 py-4 sm:px-6">
				<div className="mx-auto w-full max-w-3xl">
					<Skeleton className="h-24 w-full rounded-media" />
				</div>
			</div>
		</div>
	);
}
