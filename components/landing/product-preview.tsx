function RailMark({ className }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={`pointer-events-none absolute size-2 rotate-45 border border-border bg-background ${className ?? ""}`}
		/>
	);
}

function HorizontalRail({ edge }: { edge: "top" | "bottom" }) {
	return (
		<div
			className={`flex h-8 shrink-0 sm:h-12 ${
				edge === "top"
					? "border-b border-border"
					: "border-t border-border"
			}`}
		>
			<div className="hidden w-12 shrink-0 border-r border-border sm:block" />
			<div className="relative min-w-0 flex-1">
				<div className="absolute inset-x-0 top-0 h-1/2 border-b border-dashed border-border" />
				<RailMark className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
			</div>
			<div className="hidden w-12 shrink-0 border-l border-border sm:block" />
		</div>
	);
}

function VerticalRail({ side }: { side: "left" | "right" }) {
	return (
		<div
			className={`relative hidden w-12 shrink-0 sm:block ${
				side === "left" ? "border-r border-border" : "border-l border-border"
			}`}
		>
			<div
				className={`absolute inset-y-0 w-1/2 border-dashed border-border ${
					side === "left" ? "left-0 border-r" : "right-0 border-l"
				}`}
			/>
			<RailMark className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
			{side === "left" ? (
				<div className="absolute inset-x-0 bottom-0 h-px bg-border" />
			) : (
				<div className="absolute inset-x-0 top-0 h-px bg-border" />
			)}
		</div>
	);
}

export function ProductPreview() {
	return (
		<div className="flex h-full min-h-[360px] min-w-0 flex-col sm:min-h-[420px] lg:min-h-full">
			<HorizontalRail edge="top" />

			<div className="flex min-h-0 min-w-0 flex-1">
				<VerticalRail side="left" />

				<div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-surface-subtle p-4 sm:p-7 lg:p-8">
					<div
						aria-hidden="true"
						className="absolute top-[16%] right-[12%] hidden h-[74%] w-[60%] rotate-[3deg] rounded-[10px] border border-border bg-background opacity-40 sm:block"
					/>
					<div
						aria-hidden="true"
						className="absolute top-[14%] right-[14%] hidden h-[74%] w-[60%] rotate-[1.5deg] rounded-[10px] border border-border bg-background opacity-70 sm:block"
					/>

					<div className="product-shadow relative z-10 w-full max-w-[min(100%,340px)] overflow-hidden rounded-[10px] border border-border bg-background">
						<div className="flex items-center gap-2.5 border-b border-border bg-muted px-3 py-2.5 sm:px-4 sm:py-3">
							<span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-primary text-[10px] font-semibold text-primary-foreground">
								NL
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[12px] font-medium text-foreground">
									Product Engineer
								</p>
								<p className="truncate text-[11px] text-muted-foreground">
									Northline · tailored from your persona
								</p>
							</div>
							<span className="shrink-0 text-[12px] font-semibold text-brand">
								92%
							</span>
						</div>

						<div className="px-4 py-4 sm:px-5 sm:py-5">
							<p className="font-display text-[20px] leading-7 font-semibold tracking-[-0.48px] text-foreground sm:text-[22px]">
								Alex Rivera
							</p>
							<p className="mt-1 text-[12px] text-muted-foreground">
								San Francisco · alex@email.com
							</p>

							<div className="mt-4 sm:mt-5">
								<p className="text-[10px] font-semibold tracking-[0.08em] text-foreground uppercase">
									Summary
								</p>
								<p className="mt-1.5 text-[12px] leading-[18px] text-muted-foreground">
									Platform-minded engineer who ships ownership
									systems and GraphQL services for product teams.
								</p>
							</div>

							<div className="mt-4">
								<p className="text-[10px] font-semibold tracking-[0.08em] text-foreground uppercase">
									Experience
								</p>
								<div className="mt-2 space-y-3">
									<div>
										<div className="flex items-baseline justify-between gap-2">
											<p className="text-[12px] font-semibold text-foreground">
												Orbit Systems
											</p>
											<p className="text-[10px] text-muted-soft">
												2022 — Now
											</p>
										</div>
										<p className="text-[11px] text-muted-foreground">
											Product Engineer
										</p>
										<ul className="mt-1.5 space-y-1">
											<li className="rounded-[4px] bg-brand/5 px-1.5 py-1 text-[11px] leading-[16px] text-foreground">
												Led GraphQL migration, −33% p95 latency
											</li>
											<li className="text-[11px] leading-[16px] text-muted-foreground">
												Owned onboarding used by 40+ PMs
											</li>
										</ul>
									</div>
									<div>
										<div className="flex items-baseline justify-between gap-2">
											<p className="text-[12px] font-semibold text-foreground">
												Fieldnote
											</p>
											<p className="text-[10px] text-muted-soft">
												2020 — 2022
											</p>
										</div>
										<p className="text-[11px] text-muted-foreground">
											Software Engineer
										</p>
										<p className="mt-1.5 text-[11px] leading-[16px] text-muted-foreground">
											Shipped role-aware dashboards tied to OKRs
										</p>
									</div>
								</div>
							</div>

							<div className="mt-4 flex flex-wrap gap-1.5">
								{["Platform ownership", "GraphQL", "Mentorship"].map(
									(tag) => (
										<span
											key={tag}
											className="rounded-full border border-brand/20 bg-brand/5 px-2 py-0.5 text-[10px] font-medium text-brand"
										>
											{tag}
										</span>
									),
								)}
							</div>
						</div>

						<div className="flex items-center justify-between border-t border-border px-3 py-2.5 sm:px-4">
							<span className="text-[11px] text-muted-foreground">
								PDF ready · v3
							</span>
							<span className="text-[11px] font-medium text-foreground">
								Download
							</span>
						</div>
					</div>
				</div>

				<VerticalRail side="right" />
			</div>

			<HorizontalRail edge="bottom" />
		</div>
	);
}
