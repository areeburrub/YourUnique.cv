import { SatelliteDish } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const JOB_RADAR_TOTAL = 27;

export default function JobRadarPage() {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div className="shrink-0 border-b border-border px-4 py-5 sm:px-6">
				<div className="mx-auto w-full max-w-6xl">
					<div className="flex items-center gap-2.5">
						<h1 className="font-display text-[24px] font-medium tracking-[-0.48px] text-foreground">
							Job Radar
						</h1>
						<Badge aria-label={`${JOB_RADAR_TOTAL} jobs`}>
							{JOB_RADAR_TOTAL}
						</Badge>
					</div>
					<p className="mt-1 text-sm text-muted-foreground">
						Roles that match your profile, as they show up.
					</p>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto">
				<div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
					<div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
						<div className="flex size-16 items-center justify-center rounded-[22px] bg-pastel-blush text-brand">
							<SatelliteDish size={28} />
						</div>
						<div className="space-y-1">
							<h2 className="font-medium text-sm">No roles on radar yet</h2>
							<p className="max-w-sm text-sm text-muted-foreground">
								Matching jobs will land here. Keep your profile current so
								radar has something to scan against.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
