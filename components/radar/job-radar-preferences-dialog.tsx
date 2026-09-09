"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import {
	JobRadarPreferencesForm,
	type RadarPreferencesState,
} from "./job-radar-preferences-form";

export type { RadarPreferencesState, RadarWorkplaceType } from "./job-radar-preferences-form";

export function JobRadarPreferencesDialog({
	open,
	onOpenChange,
	initial,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initial: RadarPreferencesState | null;
	onSaved: (saved: RadarPreferencesState) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" showCloseButton>
				<DialogHeader>
					<DialogTitle>Job search preferences</DialogTitle>
					<DialogDescription>
						This steers what Job Radar looks for — where you are, whether
						you&rsquo;d move, and what kinds of setups you&rsquo;ll accept.
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[65vh] overflow-y-auto px-1 pb-2">
					<JobRadarPreferencesForm
						initial={open ? initial : null}
						submitLabel="Save preferences"
						onSubmit={(saved) => {
							onOpenChange(false);
							onSaved(saved);
						}}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
