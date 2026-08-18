import { classicSerif } from "./classic-serif";
import { navyCentered } from "./navy-centered";
import type { BuiltinTemplateSource } from "./types";

export type { BuiltinTemplateSource } from "./types";

/**
 * Register built-in templates here.
 */
export const builtinTemplateSources: BuiltinTemplateSource[] = [
    classicSerif,
    navyCentered,
];
