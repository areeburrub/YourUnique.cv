import {
	BriefcaseIcon,
	ClockIcon,
	LightningIcon,
	PuzzlePieceIcon,
} from "@phosphor-icons/react/ssr";

const skills = ["TypeScript", "Product sense", "Mentorship", "GraphQL"];

const sections = [
	{
		label: "Roles",
		value: "2 roles · Platform eng",
		Icon: BriefcaseIcon,
		tone: "bg-pastel-blush text-brand",
	},
	{
		label: "Wins indexed",
		value: "38 impact notes",
		Icon: LightningIcon,
		tone: "bg-pastel-butter text-[#9a5a18]",
	},
	{
		label: "Skills live",
		value: "12 in rotation",
		Icon: PuzzlePieceIcon,
		tone: "bg-pastel-sage text-[#2f6b4a]",
	},
	{
		label: "Last sync",
		value: "This week",
		Icon: ClockIcon,
		tone: "bg-pastel-lilac text-[#5b3fd6]",
	},
];

export function PersonaSnapshot() {
	return (
		<div className="product-shadow overflow-hidden rounded-[32px] bg-card">
			<div className="flex items-center justify-between bg-pastel-blush px-6 py-4">
				<p className="text-[15px] font-medium text-foreground">
					Persona snapshot
				</p>
				<span className="rounded-full bg-pastel-sage px-3 py-1 text-[12px] font-medium text-[#2f6b4a]">
					Up to date
				</span>
			</div>

			<div className="p-6 sm:p-7">
				<div className="flex items-center gap-4">
					<div className="flex size-14 items-center justify-center rounded-2xl bg-brand text-[16px] font-semibold text-brand-foreground">
						AR
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate text-lg font-semibold text-foreground">
							Alex Rivera
						</p>
						<p className="truncate text-[14px] text-muted-foreground">
							Product Engineer · Platforms & Growth
						</p>
					</div>
				</div>

				<div className="mt-6 grid grid-cols-2 gap-3">
					{sections.map(({ label, value, Icon, tone }) => (
						<div
							key={label}
							className="rounded-[22px] bg-muted/70 px-4 py-4"
						>
							<div className="flex items-center gap-2 text-muted-foreground">
								<span className={`flex size-9 items-center justify-center rounded-2xl ${tone}`}>
									<Icon size={18} weight="duotone" />
								</span>
								<span className="text-[12px] font-medium tracking-[0.04em] uppercase">
									{label}
								</span>
							</div>
							<p className="mt-3 text-[14px] font-medium text-foreground">
								{value}
							</p>
						</div>
					))}
				</div>

				<div className="mt-6">
					<p className="text-[12px] font-medium tracking-[0.06em] text-muted-soft uppercase">
						Skills in rotation
					</p>
					<div className="mt-3 flex flex-wrap gap-2">
						{skills.map((skill) => (
							<span
								key={skill}
								className="rounded-full bg-pastel-blush px-3.5 py-1.5 text-[13px] font-medium text-foreground"
							>
								{skill}
							</span>
						))}
					</div>
				</div>

				<div className="mt-6 rounded-[22px] bg-pastel-butter px-4 py-4">
					<p className="text-[12px] font-medium tracking-[0.06em] text-muted-soft uppercase">
						Latest note
					</p>
					<p className="mt-2 text-[14px] leading-6 text-foreground">
						Shipped GraphQL migration — cut p95 latency 33% across
						checkout services.
					</p>
				</div>
			</div>
		</div>
	);
}
