import {
	Briefcase,
	Lightning,
	PuzzlePiece,
	Clock,
} from "@phosphor-icons/react/dist/ssr";

const skills = ["TypeScript", "Product sense", "Mentorship", "GraphQL"];

const sections = [
	{
		label: "Roles",
		value: "2 roles · Platform eng",
		Icon: Briefcase,
	},
	{
		label: "Wins indexed",
		value: "38 impact notes",
		Icon: Lightning,
	},
	{
		label: "Skills live",
		value: "12 in rotation",
		Icon: PuzzlePiece,
	},
	{
		label: "Last sync",
		value: "This week",
		Icon: Clock,
	},
];

export function PersonaSnapshot() {
	return (
		<div className="product-shadow overflow-hidden rounded-[14px] border border-border bg-background">
			<div className="flex items-center justify-between border-b border-border bg-surface-subtle px-5 py-3">
				<p className="text-[13px] font-medium text-foreground">
					Persona snapshot
				</p>
				<span className="rounded-full bg-[#e9f8ef] px-2 py-0.5 text-[11px] font-medium text-[#1f9d55]">
					Up to date
				</span>
			</div>

			<div className="p-5 sm:p-6">
				<div className="flex items-center gap-3">
					<div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-[15px] font-semibold text-brand">
						AR
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-base font-semibold text-foreground">
							Alex Rivera
						</p>
						<p className="truncate text-[13px] text-muted-foreground">
							Product Engineer · Platforms & Growth
						</p>
					</div>
				</div>

				<div className="mt-5 grid grid-cols-2 gap-2.5">
					{sections.map(({ label, value, Icon }) => (
						<div
							key={label}
							className="rounded-[10px] border border-border bg-surface-subtle/60 px-3.5 py-3"
						>
							<div className="flex items-center gap-1.5 text-muted-foreground">
								<Icon size={14} weight="bold" />
								<span className="text-[11px] font-medium tracking-[-0.14px] uppercase">
									{label}
								</span>
							</div>
							<p className="mt-1.5 text-[13px] font-medium text-foreground">
								{value}
							</p>
						</div>
					))}
				</div>

				<div className="mt-5">
					<p className="text-[11px] font-medium tracking-[-0.14px] text-muted-soft uppercase">
						Skills in rotation
					</p>
					<div className="mt-2.5 flex flex-wrap gap-2">
						{skills.map((skill) => (
							<span
								key={skill}
								className="rounded-full border border-border bg-background px-2.5 py-1 text-[12px] font-medium text-foreground"
							>
								{skill}
							</span>
						))}
					</div>
				</div>

				<div className="mt-5 rounded-[10px] border border-border px-3.5 py-3">
					<p className="text-[11px] font-medium tracking-[-0.14px] text-muted-soft uppercase">
						Latest note
					</p>
					<p className="mt-1.5 text-[13px] leading-5 text-foreground">
						Shipped GraphQL migration — cut p95 latency 33% across
						checkout services.
					</p>
				</div>
			</div>
		</div>
	);
}
