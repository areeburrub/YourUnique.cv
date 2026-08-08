import { Skeleton } from "@/components/ui/skeleton";

export default function NewChatLoading() {
	return (
		<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-16 sm:px-6">
				<div className="flex w-full max-w-3xl flex-col items-center gap-10">
					<Skeleton className="h-10 w-[min(100%,22rem)] sm:h-12 sm:w-[28rem]" />
					<div className="w-full">
						<Skeleton className="h-28 w-full rounded-media" />
					</div>
				</div>
			</div>
		</div>
	);
}
