import { Skeleton } from "@/components/ui/skeleton";

export default function ChatsLoading() {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="shrink-0 border-b border-border px-4 py-5 sm:px-6">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0 space-y-2">
							<Skeleton className="h-7 w-24" />
							<Skeleton className="h-4 w-64 max-w-full" />
						</div>
						<Skeleton className="h-8 w-24 shrink-0 rounded-control" />
					</div>
					<Skeleton className="h-9 w-full" />
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto">
				<div className="mx-auto w-full max-w-3xl px-4 py-2 sm:px-6">
					<ul className="divide-y divide-border">
						{Array.from({ length: 6 }).map((_, i) => (
							<li key={i} className="flex items-start gap-3 py-4">
								<Skeleton className="mt-0.5 size-9 shrink-0 rounded-media" />
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex items-baseline justify-between gap-3">
										<Skeleton className="h-4 w-40 max-w-[60%]" />
										<Skeleton className="h-3 w-12 shrink-0" />
									</div>
									<Skeleton className="h-4 w-full max-w-md" />
									<Skeleton className="h-3 w-20" />
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
