import Link from "next/link";
import { notFound } from "next/navigation";

import {
	adjustDailyUsageAction,
	grantCreditsAction,
	setAdminAction,
	updateUserPlanAction,
} from "@/app/admin/users/[id]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getAdminUserDetail } from "@/lib/db/admin";
import { PLAN_IDS, PLANS } from "@/lib/plans";

function formatUsd(value: string | number) {
	const n = typeof value === "number" ? value : Number(value);
	return `$${(Number.isFinite(n) ? n : 0).toFixed(4)}`;
}

export default async function AdminUserDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const detail = await getAdminUserDetail(id);
	if (!detail) {
		notFound();
	}

	const { user, usageRows, grantRows } = detail;

	return (
		<div className="space-y-8">
			<div>
				<Link
					href="/admin/users"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Users
				</Link>
				<div className="mt-3 flex flex-wrap items-start justify-between gap-3">
					<div>
						<h1 className="font-display text-2xl font-semibold tracking-[-0.4px]">
							{user.email}
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{[user.firstName, user.lastName]
								.filter(Boolean)
								.join(" ") || "No name"}{" "}
							· {user.id}
						</p>
					</div>
					{user.isAdmin ? <Badge>Admin</Badge> : null}
				</div>
			</div>

			<section className="grid gap-6 rounded-xl border border-border p-4 sm:grid-cols-2">
				<form action={updateUserPlanAction} className="space-y-3">
					<input type="hidden" name="userId" value={user.id} />
					<div className="space-y-1.5">
						<Label htmlFor="planId">Plan</Label>
						<select
							id="planId"
							name="planId"
							defaultValue={user.planId}
							className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm"
						>
							{PLAN_IDS.map((id) => (
								<option key={id} value={id}>
									{PLANS[id].name}
								</option>
							))}
						</select>
					</div>
					<Button type="submit" size="sm">
						Update plan
					</Button>
				</form>

				<form action={setAdminAction} className="space-y-3">
					<input type="hidden" name="userId" value={user.id} />
					<input
						type="hidden"
						name="isAdmin"
						value={user.isAdmin ? "false" : "true"}
					/>
					<div className="space-y-1.5">
						<Label>Admin access</Label>
						<p className="text-sm text-muted-foreground">
							Currently {user.isAdmin ? "enabled" : "disabled"}.
							Set via this toggle (also editable in DB).
						</p>
					</div>
					<Button type="submit" size="sm" variant="outline">
						{user.isAdmin ? "Revoke admin" : "Make admin"}
					</Button>
				</form>
			</section>

			<section className="space-y-3 rounded-xl border border-border p-4">
				<div>
					<h2 className="font-medium">Grant bonus credits</h2>
					<p className="text-sm text-muted-foreground">
						Current bonus: {formatUsd(user.bonusCreditsUsd)} (added
						on top of the plan monthly limit)
					</p>
				</div>
				<form
					action={grantCreditsAction}
					className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end"
				>
					<input type="hidden" name="userId" value={user.id} />
					<div className="space-y-1.5">
						<Label htmlFor="amountUsd">Amount (USD)</Label>
						<Input
							id="amountUsd"
							name="amountUsd"
							type="number"
							step="0.0001"
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="note">Note</Label>
						<Input id="note" name="note" placeholder="Optional" />
					</div>
					<Button type="submit">Grant</Button>
				</form>

				{grantRows.length > 0 ? (
					<div className="rounded-lg border border-border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>When</TableHead>
									<TableHead>Amount</TableHead>
									<TableHead>Note</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{grantRows.map((grant) => (
									<TableRow key={grant.id}>
										<TableCell className="text-muted-foreground">
											{grant.createdAt.toISOString()}
										</TableCell>
										<TableCell>
											{formatUsd(grant.amountUsd)}
										</TableCell>
										<TableCell>
											{grant.note || "—"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				) : null}
			</section>

			<section className="space-y-3">
				<div>
					<h2 className="font-medium">Daily usage (last 30 days)</h2>
					<p className="text-sm text-muted-foreground">
						Edit a day&apos;s recorded cost if OpenRouter reporting
						needs correction.
					</p>
				</div>
				<div className="rounded-xl border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date (UTC)</TableHead>
								<TableHead>Cost</TableHead>
								<TableHead>Messages</TableHead>
								<TableHead>Adjust</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{usageRows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={4}
										className="py-8 text-center text-muted-foreground"
									>
										No usage recorded yet.
									</TableCell>
								</TableRow>
							) : (
								usageRows.map((row) => (
									<TableRow key={row.date}>
										<TableCell>{row.date}</TableCell>
										<TableCell>
											{formatUsd(row.costUsd)}
										</TableCell>
										<TableCell>
											{row.messageCount}
										</TableCell>
										<TableCell>
											<form
												action={adjustDailyUsageAction}
												className="flex items-center gap-2"
											>
												<input
													type="hidden"
													name="userId"
													value={user.id}
												/>
												<input
													type="hidden"
													name="date"
													value={row.date}
												/>
												<Input
													name="costUsd"
													type="number"
													step="0.0001"
													defaultValue={Number(
														row.costUsd,
													).toFixed(4)}
													className="h-8 w-28"
												/>
												<Button
													type="submit"
													size="xs"
													variant="outline"
												>
													Save
												</Button>
											</form>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</section>
		</div>
	);
}
