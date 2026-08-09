import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { listAdminUsers } from "@/lib/db/admin";

function formatUsd(value: string | number) {
	const n = typeof value === "number" ? value : Number(value);
	return `$${(Number.isFinite(n) ? n : 0).toFixed(4)}`;
}

export default async function AdminUsersPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string }>;
}) {
	const { q } = await searchParams;
	const users = await listAdminUsers(q);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="font-display text-2xl font-semibold tracking-[-0.4px]">
						Users
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage plans, bonus credits, and usage.
					</p>
				</div>
				<form className="flex items-center gap-2">
					<Input
						name="q"
						defaultValue={q ?? ""}
						placeholder="Search email…"
						className="w-64"
					/>
					<Button type="submit" variant="outline">
						Search
					</Button>
				</form>
			</div>

			<div className="rounded-xl border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead>Bonus</TableHead>
							<TableHead>Today</TableHead>
							<TableHead>30d</TableHead>
							<TableHead>Flags</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-8 text-center text-muted-foreground"
								>
									No users found.
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<Link
											href={`/admin/users/${user.id}`}
											className="font-medium text-foreground hover:underline"
										>
											{user.email}
										</Link>
										<p className="text-xs text-muted-foreground">
											{[user.firstName, user.lastName]
												.filter(Boolean)
												.join(" ") || "—"}
										</p>
									</TableCell>
									<TableCell>{user.planName}</TableCell>
									<TableCell>
										{formatUsd(user.bonusCreditsUsd)}
									</TableCell>
									<TableCell>
										{formatUsd(user.todayUsd)}
									</TableCell>
									<TableCell>
										{formatUsd(user.rolling30dUsd)}
									</TableCell>
									<TableCell>
										{user.isAdmin ? (
											<Badge variant="secondary">
												Admin
											</Badge>
										) : (
											<span className="text-muted-foreground">
												—
											</span>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
