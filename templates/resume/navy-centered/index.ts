import type { BuiltinTemplateSource } from "../types";
import { notes } from "./notes";
import { sampleData } from "./sample-data";
import { documentSchema } from "./schema";
import { html } from "./template";

export const navyCentered = {
    id: "navy-centered",
    name: "Navy Centered",
    description:
        "Centered header, navy section rules, and a serif name over a readable sans-serif body.",
    folder: "navy-centered",
    html,
    notes,
    documentSchema,
    sampleData: sampleData as Record<string, unknown>,
    previewPath: "/templates/builtins/navy-centered/preview.png",
    previewPdfPath: "/templates/builtins/navy-centered/preview.pdf",
    category: "Professional",
    colors: ["#16325c", "#1c1c1c", "#5c6573"],
    formats: ["PDF"],
    styleLabel: "Mixed",
} satisfies BuiltinTemplateSource;
