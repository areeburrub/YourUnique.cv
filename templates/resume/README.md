# Built-in resume templates

Each folder is a TypeScript module. The gallery shows `preview.png` (copied to `public/`).

## Layout

```
templates/resume/<id>/
  index.ts           # exports the template module (name, category, colors, formats, …)
  template.ts        # Handlebars HTML + embedded CSS
  schema.ts          # JSON Schema object
  notes.ts           # agent instructions
  sample-data.ts     # fictional fixture for preview generation
  preview.png        # source preview
```

In `index.ts`, set gallery metadata: `category`, `colors`, `formats`, `styleLabel`.

## Add a template

1. Copy `classic-serif/` or `navy-centered/` to a new folder id (e.g. `modern-mono/`).
2. Edit `index.ts`, `template.ts`, `schema.ts`, `notes.ts`, `sample-data.ts`.
3. Import and append it in `templates/resume/index.ts`.
4. Run `bun scripts/generate-builtin-previews.ts`.
5. Users select it as `builtin:<id>`.

Helpers available in `template.ts` HTML: `eq`, `ne`, `and`, `or`, `gt`, `len`, `hostPath`, `href`, `dateRange`, `employment`, `projectBody`, `rich`.

`{{string}}` interpolations HTML-escape first, then render inline `**bold**`, `*italic*`, and `[label](url)` from JSON strings. Use `{{value}}` (not triple-stash) for user text. Do not put raw HTML in document JSON.
