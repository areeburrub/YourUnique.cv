"use client";

import { useClerk } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function getInitials(name: string, email: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
	}
	if (name.trim()) {
		return name.slice(0, 2).toUpperCase();
	}
	if (email) {
		return email.slice(0, 2).toUpperCase();
	}
	return "YU";
}

export function AccountSettings({
	name,
	email,
	imageUrl,
}: {
	name: string;
	email: string;
	imageUrl?: string | null;
}) {
	const { openUserProfile } = useClerk();
	const initials = getInitials(name, email);

	return (
		<section className="rounded-[28px] bg-card p-7">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3.5">
					<Avatar size="lg" className="size-12">
						{imageUrl ? (
							<AvatarImage src={imageUrl} alt={name} />
						) : null}
						<AvatarFallback className="bg-muted text-sm font-medium">
							{initials}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="text-sm text-muted-foreground">Account</p>
						<p className="font-display truncate text-xl font-semibold tracking-[-0.3px]">
							{name}
						</p>
						{email ? (
							<p className="mt-1 truncate text-sm text-muted-foreground">
								{email}
							</p>
						) : null}
					</div>
				</div>
				<Button
					type="button"
					variant="outline"
					onClick={() => openUserProfile()}
				>
					Manage account
				</Button>
			</div>
		</section>
	);
}
