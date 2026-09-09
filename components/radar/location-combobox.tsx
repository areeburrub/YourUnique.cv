"use client";

import { City, Country } from "country-state-city";
import { MapPin } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Suggestion = { label: string; key: string };

let cachedCities: { name: string; countryCode: string }[] | null = null;
function allCities() {
	if (!cachedCities) {
		cachedCities = City.getAllCities();
	}
	return cachedCities;
}

function countryName(code: string) {
	return Country.getCountryByCode(code)?.name ?? code;
}

function search(query: string): Suggestion[] {
	const q = query.trim().toLowerCase();
	if (q.length < 2) {
		return [];
	}
	const seen = new Set<string>();
	const out: Suggestion[] = [];
	function add(city: { name: string; countryCode: string }) {
		const label = `${city.name}, ${countryName(city.countryCode)}`;
		// Multiple states/regions can have a city with the same name in the
		// same country (e.g. two "Berg" towns in Austria) — de-dupe by the
		// displayed label so we never render/select the same option twice.
		if (seen.has(label)) {
			return false;
		}
		seen.add(label);
		out.push({ label, key: label });
		return true;
	}
	for (const city of allCities()) {
		if (city.name.toLowerCase().startsWith(q)) {
			add(city);
			if (out.length >= 30) {
				break;
			}
		}
	}
	if (out.length < 12) {
		// widen to "contains" if prefix search came up short
		for (const city of allCities()) {
			if (
				!city.name.toLowerCase().startsWith(q) &&
				city.name.toLowerCase().includes(q)
			) {
				add(city);
				if (out.length >= 20) {
					break;
				}
			}
		}
	}
	return out;
}

/**
 * Free-text city/country input with an offline (no API key) autocomplete
 * dropdown sourced from `country-state-city`. Selecting a suggestion, or
 * just typing anything and blurring, both work — this only feeds a prompt,
 * it's not validated against a hard location database.
 */
export function LocationCombobox({
	value,
	onChange,
	placeholder = "City, country",
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}) {
	const [query, setQuery] = useState(value);
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(-1);
	const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const listRef = useRef<HTMLDivElement | null>(null);

	const suggestions = useMemo(() => search(query), [query]);

	function selectSuggestion(s: Suggestion) {
		if (blurTimer.current) clearTimeout(blurTimer.current);
		setQuery(s.label);
		onChange(s.label);
		setOpen(false);
		setActiveIndex(-1);
	}

	return (
		<div className={cn("relative", className)}>
			<div className="relative">
				<MapPin
					size={14}
					className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					value={query}
					placeholder={placeholder}
					className="pl-8"
					role="combobox"
					aria-expanded={open && suggestions.length > 0}
					aria-controls="location-combobox-list"
					aria-activedescendant={
						activeIndex >= 0 ? `location-combobox-opt-${activeIndex}` : undefined
					}
					onChange={(e) => {
						setQuery(e.target.value);
						onChange(e.target.value);
						setOpen(true);
						setActiveIndex(-1);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => {
						blurTimer.current = setTimeout(() => {
							setOpen(false);
							setActiveIndex(-1);
						}, 120);
					}}
					onKeyDown={(e) => {
						if (!open || suggestions.length === 0) {
							return;
						}
						if (e.key === "ArrowDown") {
							e.preventDefault();
							setActiveIndex((i) => {
								const next = i + 1 >= suggestions.length ? 0 : i + 1;
								listRef.current
									?.querySelector(`#location-combobox-opt-${next}`)
									?.scrollIntoView({ block: "nearest" });
								return next;
							});
						} else if (e.key === "ArrowUp") {
							e.preventDefault();
							setActiveIndex((i) => {
								const next = i - 1 < 0 ? suggestions.length - 1 : i - 1;
								listRef.current
									?.querySelector(`#location-combobox-opt-${next}`)
									?.scrollIntoView({ block: "nearest" });
								return next;
							});
						} else if (e.key === "Enter") {
							if (activeIndex >= 0 && activeIndex < suggestions.length) {
								e.preventDefault();
								selectSuggestion(suggestions[activeIndex]);
							}
						} else if (e.key === "Escape") {
							setOpen(false);
							setActiveIndex(-1);
						}
					}}
				/>
			</div>
			{open && suggestions.length > 0 ? (
				<div
					ref={listRef}
					id="location-combobox-list"
					role="listbox"
					className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
				>
					{suggestions.map((s, i) => (
						<button
							key={s.key}
							id={`location-combobox-opt-${i}`}
							type="button"
							role="option"
							aria-selected={i === activeIndex}
							className={cn(
								"block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
								i === activeIndex && "bg-muted",
							)}
							onMouseEnter={() => setActiveIndex(i)}
							onMouseDown={(e) => {
								e.preventDefault();
								selectSuggestion(s);
							}}
						>
							{s.label}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
