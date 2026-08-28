"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "nextjs-toploader/app";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SettingsBackButton() {
	const router = useRouter();

	return (
		<button
			type="button"
			aria-label="Back"
			onClick={() => router.back()}
			className={cn(
				buttonVariants({ variant: "ghost", size: "icon-sm" }),
				"-ml-2 text-muted-foreground md:hidden",
			)}
		>
			<ArrowLeftIcon size={18} weight="bold" />
		</button>
	);
}
