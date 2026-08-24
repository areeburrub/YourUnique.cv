import { atsClassic } from "./ats-classic";
import { classicSerif } from "./classic-serif";
import { engineeringCompact } from "./engineering-compact";
import { executiveSerif } from "./executive-serif";
import { navyCentered } from "./navy-centered";
import { slateSidebar } from "./slate-sidebar";
import { swissMinimal } from "./swiss-minimal";
import type { BuiltinTemplateSource } from "./types";

export type { BuiltinTemplateSource } from "./types";

/**
 * Register built-in templates here. Order is gallery order.
 */
export const builtinTemplateSources: BuiltinTemplateSource[] = [
	classicSerif,
	engineeringCompact,
	atsClassic,
	navyCentered,
	swissMinimal,
	slateSidebar,
	executiveSerif,
];
