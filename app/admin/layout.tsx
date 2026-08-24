import Link from "next/link";

import { AppClerkProvider } from "@/components/app-clerk-provider";
import { requireAdmin } from "@/lib/admin";
import { cn } from "@/lib/utils";

const nav = [{ href: "/admin/users", label: "Users" }] as const;

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	await requireAdmin();

	return (
		<AppClerkProvider>
			<div className="min-h-svh bg-background text-foreground">
				<header className="border-b border-border">
					<div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
						<Link
							href="/admin/users"
							className="font-display text-sm font-semibold tracking-[-0.2px]"
						>
							Admin
						</Link>
						<nav className="flex items-center gap-1">
							{nav.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
									)}
								>
									{item.label}
								</Link>
							))}
						</nav>
						<div className="flex-1" />
						<Link
							href="/new-chat"
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							Back to app
						</Link>
					</div>
				</header>
				<main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
					{children}
				</main>
			</div>
		</AppClerkProvider>
	);
}
