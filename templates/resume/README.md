# Built-in resume templates

Each folder is a TypeScript module. The gallery shows `preview.png` (copied to `public/`).

Current library:

| id | Kind | Notes |
| --- | --- | --- |
| `classic-serif` | Traditional | Computer Modern, small-caps rules |
| `engineering-compact` | Tech / SWE | Jake-style centered name, pipe contact |
| `ats-classic` | ATS | Single column, Calibri-like, no graphics |
| `navy-centered` | Professional | Centered header, navy rules |
| `swiss-minimal` | Modern | Airy Inter, hairline rules |
| `slate-sidebar` | Modern two-column | Dark left rail for contact + skills |
| `executive-serif` | Executive | Playfair name, gold rule, title-first |

## Layout

```
templates/resume/<id>/
  index.ts           # exports the template module (name, category, colors, formats, …)
  template.ts        # Handlebars HTML + embedded CSS
  schema.ts          # Zod document schema for this template only

Each template owns its document shape. Classic Serif has no top-level location or GPA; most newer layouts require location, and some render an optional headline or GPA. The resume agent receives that template's JSON schema in the briefing.
  notes.ts           # agent instructions
  sample-data.ts     # fictional fixture for preview generation
  preview.png        # source preview
```

In `index.ts`, set gallery metadata: `category`, `colors`, `formats`, `styleLabel`.

## Add a template

1. Copy an existing folder (e.g. `classic-serif/` or `engineering-compact/`) to a new folder id.
2. Edit `index.ts`, `template.ts`, `schema.ts`, `notes.ts`, `sample-data.ts`.
3. Import and append it in `templates/resume/index.ts`.
4. Run `bun scripts/generate-builtin-previews.ts`.
5. Users select it as `builtin:<id>`.

Helpers available in `template.ts` HTML: `eq`, `ne`, `and`, `or`, `gt`, `len`, `hostPath`, `href`, `employment`, `projectBody`. Date ranges are a string slot (`{{dates}}`), not a helper.

Prose slots in document JSON are finished HTML fragments (`<strong>`, `<em>`, `<a href>`). `{{value}}` allowlist-sanitizes and inserts them. Use `{{value}}` (not triple-stash). URL fields stay host/path or https — not an `<a>` tag.
