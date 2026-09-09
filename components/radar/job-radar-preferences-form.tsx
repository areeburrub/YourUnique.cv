"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { LocationCombobox } from "./location-combobox";

export type RadarWorkplaceType = "remote" | "hybrid" | "onsite";

export type RadarPreferencesState = {
	currentLocation: string;
	openToRelocation: boolean;
	preferredLocations: string[];
	relocationRadiusKm: number | null;
	workplaceTypes: RadarWorkplaceType[];
	extraPreferences: string;
};

export const EMPTY_PREFERENCES: RadarPreferencesState = {
	currentLocation: "",
	openToRelocation: false,
	preferredLocations: [],
	relocationRadiusKm: null,
	workplaceTypes: [],
	extraPreferences: "",
};

const WORKPLACE_OPTIONS: { id: RadarWorkplaceType; label: string }[] = [
	{ id: "remote", label: "Remote" },
	{ id: "hybrid", label: "Hybrid" },
	{ id: "onsite", label: "Onsite" },
];

export async function saveRadarPreferencesState(
	state: RadarPreferencesState,
): Promise<RadarPreferencesState> {
	const payload: RadarPreferencesState = {
		...state,
		preferredLocations: [],
		relocationRadiusKm: null,
	};
	const res = await fetch("/api/radar/preferences", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	const body = (await res.json()) as { error?: string };
	if (!res.ok) {
		throw new Error(body.error || "Could not save preferences");
	}
	return payload;
}

export function JobRadarPreferencesForm({
	initial,
	submitLabel,
	busyLabel = "Saving…",
	submitting = false,
	onSubmit,
}: {
	initial: RadarPreferencesState | null;
	submitLabel: string;
	busyLabel?: string;
	submitting?: boolean;
	onSubmit: (saved: RadarPreferencesState) => Promise<void> | void;
}) {
	const [state, setState] = useState<RadarPreferencesState>(
		initial ?? EMPTY_PREFERENCES,
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [prevInitial, setPrevInitial] = useState(initial);

	if (initial !== prevInitial) {
		setPrevInitial(initial);
		setState(initial ?? EMPTY_PREFERENCES);
		setError(null);
	}

	function toggleWorkplace(id: RadarWorkplaceType) {
		setState((s) => ({
			...s,
			workplaceTypes: s.workplaceTypes.includes(id)
				? s.workplaceTypes.filter((w) => w !== id)
				: [...s.workplaceTypes, id],
		}));
	}

	async function save() {
		if (!state.currentLocation.trim()) {
			setError("Add your current location so we can match roles near you.");
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const payload = await saveRadarPreferencesState(state);
			await onSubmit(payload);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save");
		} finally {
			setSaving(false);
		}
	}

	const busy = saving || submitting;

	return (
		<div className="space-y-5">
			<div className="space-y-1.5">
				<Label>Current location</Label>
				<LocationCombobox
					value={state.currentLocation}
					onChange={(v) => setState((s) => ({ ...s, currentLocation: v }))}
				/>
			</div>

			<div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
				<p className="text-sm font-medium">Open to relocation</p>
				<Switch
					checked={state.openToRelocation}
					onCheckedChange={(checked) =>
						setState((s) => ({ ...s, openToRelocation: checked }))
					}
				/>
			</div>

			<div className="space-y-1.5">
				<Label>Workplace types</Label>
				<div className="flex flex-wrap gap-2">
					{WORKPLACE_OPTIONS.map((opt) => {
						const active = state.workplaceTypes.includes(opt.id);
						return (
							<button
								key={opt.id}
								type="button"
								onClick={() => toggleWorkplace(opt.id)}
								className={cn(
									"rounded-full border px-3 py-1.5 text-sm transition-colors",
									active
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:bg-muted",
								)}
							>
								{opt.label}
							</button>
						);
					})}
				</div>
				<p className="text-xs text-muted-foreground">
					Leave all unselected to allow any.
				</p>
			</div>

			<div className="space-y-1.5">
				<Label>Anything else? (optional)</Label>
				<Textarea
					rows={3}
					placeholder="e.g. no fintech, prefer early-stage startups, avoid staffing agencies"
					value={state.extraPreferences}
					onChange={(e) =>
						setState((s) => ({ ...s, extraPreferences: e.target.value }))
					}
				/>
			</div>

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<Button
				type="button"
				className="w-full"
				onClick={() => void save()}
				disabled={busy}
			>
				{busy ? busyLabel : submitLabel}
			</Button>
		</div>
	);
}
