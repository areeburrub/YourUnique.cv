# YourUnique.cv — Design Language

Visual system for marketing pages and the app shell. Prefer shadcn/`base-nova` components styled to these tokens.

---

## Direction

Light, modern SaaS — soft neutrals, charcoal type, electric blue accent. Calm and data-product-like: clear hierarchy, generous whitespace, product UI as the main visual, hairline frame borders instead of heavy cards.

**Not:** dark mode default, purple gradients, cream+serif, glow stacks, or pill-heavy chrome.

---

## Color

| Token | Hex | Role |
|---|---|---|
| `primary-01` | `#202124` | Near-black. Body headings, primary filled buttons, active tab chips |
| `primary-02` | `#025bff` | Electric blue. CTA band, links/hover emphasis, brand accents |
| `secondary-01` | `#636466` | Muted gray. Supporting body copy, inactive nav/tabs |
| `secondary-02` | `#b3b4bc` | Light muted. Tertiary labels, soft icons |
| `stroke` | `#eaebf1` | Hairline borders, section rules, outline buttons, container frame |
| `stroke-03` | `#ebebeb` | Alternate divider |
| `white` | `#ffffff` | Page / surface |
| `white-lilac` | `#f7f7f7` | Subtle secondary surface |
| `white-70` | `#ffffffb3` | Text on blue CTA |
| `primary-light` | `#576bff` | Soft blue tint / focus wash (`#576bff1a` at 10%) |
| `blue` | `#0050e2` | Deeper blue |
| `blue-light-02` | `#298bf6` | Mid blue highlight |
| `sunshade` | `#f4942e` | Warm accent (sparingly — badges/hover variants) |
| `danger` | `#e21a1a` | Errors only |

**Gradient (accent plane):**  
`linear-gradient(#5991f600, #5991f6cc 26%, #5991f6db 44%, #2471fff2 72%, #2471ff)` — use for CTA/atmosphere washes, not as the whole page background.

**Surfaces**
- Default page: pure white
- Sections: white with `#eaebf1` rules, not tinted panels
- Product imagery sits on white with soft gray elevation shadow (see Elevation)

---

## Typography

| Role | Family | Weights |
|---|---|---|
| Display / headings | **Inter Tight** | 500 Medium, 600 SemiBold (700 rare) |
| Body / UI / buttons | **Inter Display** | 400 Regular, 500 Medium, 600 SemiBold |

Fallback: `Arial, sans-serif`.

### Scale

| Style | Size / LH | Tracking | Weight | Font |
|---|---|---|---|---|
| Heading 01 | 56 / 64 | `-1.68px` | 600 | Inter Tight |
| Heading 02 | 48 / 56 | `-0.96px` | 600 | Inter Tight |
| Heading 03 | 40 / 48 | `-0.8px` | 600 | Inter Tight |
| Heading 04 | 28 / 36 | `-0.56px` | 600 (sometimes 500) | Inter Tight |
| Heading 05 | 24 / 32 | `-0.48px` | 500 | Inter Tight |
| Body 01 | 20 / 28 | `-0.2px` | 500 / 600 | Inter Display |
| Body 02 | 16 / 24 | `0` | 400 / 500 | Inter Display |
| Tag / eyebrow | 14 / 20 | `-0.14px` | 500 | Inter Display · **UPPERCASE** |
| Display mega (stats) | ~80px | tight | 600 | Inter Tight |

Headings default to `primary-01`. Body support copy defaults to `secondary-01`. Tags/eyebrows often `secondary-01` or `primary-02`.

---

## Layout & spacing

| Token | Value |
|---|---|
| Gap base | `4px` |
| Content max | `1160px` (also 1280 / 1344 available) |
| Side margin | `32px` |
| Section vertical padding | `80px`–`140px` common |
| Hero copy max width | ~350–420px |
| Section title max width | ~460–494px, often centered |

**Signature frame:** content sits in a centered column with **1px left + right `stroke` borders** — a vertical page rail. Use on marketing layouts (optional inside the chat app).

**Grid habits**
- Hero: split row — copy left, product chrome right
- Feature rows: asymmetric (wide media + copy, or 2-up media cards)
- Mid-page: 4 feature callouts flanking a center product image
- Stats / quotes: bento-like blocks with shared stroke borders, not floating card shadows as the main structure

---

## Radius

| Use | Radius |
|---|---|
| Buttons | `8px` |
| Tabs / small chips | `6px` |
| Product screenshots / media | `10px` |
| Larger panels | `12px`–`16px` |
| Avoid | `rounded-full` pills as the default control shape |

---

## Buttons

**Primary (filled)**  
- BG + border: `primary-01` (`#202124`)  
- Text: white, Body 02, Inter Display, medium  
- Padding: `8px 20px`  
- Radius: `8px`

**Secondary (outline)**  
- Border: `stroke` (`#eaebf1`)  
- Text: `primary-01`  
- Same padding/radius as primary  

**Nav compact**  
- Same styles, tighter padding `4px 16px`, Tag-sized type  

**CTA band**  
- Full-bleed `primary-02` (`#025bff`) with subtle pattern background  
- Centered Heading 02 (white) + Body 02 (`white-70`) + primary-style light button  

**Motion on buttons:** duplicate label lines inside a clipped `24px` (nav `20px`) window and slide vertically on hover — short, mechanical, not bouncy.

---

## Components & patterns

1. **Eyebrow** — uppercase Tag text; muted or brand color, no accent bar.
2. **Hero** — left: eyebrow → H1 → short body → primary + outline CTAs → optional rating row. Right: product screenshot in a framed window chrome (top/side bars + stroke).
3. **Logo marquee** — grayscale partner marks, infinite horizontal scroll, soft edge fade shadows.
4. **Feature media** — soft gray UI mockups, `10px` radius, deep soft shadow (see Elevation).
5. **Checklist rows** — small mark icon + Body 02 medium line.
6. **Pill tabs** — uppercase Tag labels; inactive `secondary-01` on transparent; active `primary-01` fill + white text; radius `6px`; `8px 20px` padding.
7. **Stat flip** — large Inter Tight digits with stacked number animation; caption in muted Body.
8. **Quote** — medium Body/Heading quote + attribution; optional avatar; sits inside stroke-framed cells.
9. **Blog teaser** — image thumb + dual tags + Heading 05 title + author line in `secondary-01`.
10. **Footer** — logo + short blurb, contact rows, 4 link columns with uppercase small headers and underline-on-hover link lines.

---

## Elevation & imagery

**Product image shadow:**
```css
box-shadow:
	0 255px 71px #bababa00,
	0 163px 65px #bababa03,
	0 92px 55px #bababa0d,
	0 41px 41px #bababa17,
	0 10px 22px #bababa1a;
```

Supporting shadows stay soft gray (`#2f2f2f1a`, `#0000001f`) — never neon glow.

Imagery should show **real product UI** (resume editor, chat thread, PDF preview) — not abstract blobs. Prefer light UI chrome, blue accent highlights inside screenshots to match `primary-02`.

---

## Motion

| Pattern | Behavior |
|---|---|
| Section enter | `translateY(20–60px)` + `blur(5px)` + `opacity: 0` → settle; ease ~300ms |
| Button label | Vertical slide of duplicated text |
| Hover (select CTAs) | `scale(0.98)` + color swap ~0.3s |
| Tabs | Crossfade / swap panel ~300ms in / 100ms out |
| Marquee | Continuous horizontal loop |
| Stats | Digit reel / flip |

Keep motion purposeful and sparse: entrance, CTA, and one delight (stats or marquee). No ambient particle/glow loops.

---

## CSS variables

```css
:root {
	--background: #ffffff;
	--foreground: #202124;
	--muted: #636466;
	--muted-soft: #b3b4bc;
	--accent: #025bff;
	--accent-soft: #576bff1a;
	--border: #eaebf1;
	--surface-subtle: #f7f7f7;
	--radius-control: 8px;
	--radius-media: 10px;
	--container: 1160px;
	--font-display: "Inter Tight", Arial, sans-serif;
	--font-body: "Inter Display", Arial, sans-serif;
}
```

Wire into `globals.css` and shadcn theme tokens (`background`, `foreground`, `primary`, `muted`, `border`, `ring`).

---

## Application

| Surface | Apply |
|---|---|
| Marketing landing | Brand + one headline + one sentence + CTA pair + product hero; stroke rails; logo/social proof strip; feature + stats; blue CTA band |
| Auth | White surfaces, charcoal primary buttons, stroke inputs, Inter Display |
| App shell / chat | White + stroke sidebars; charcoal active states; blue only for accent actions (Send, Generate PDF); avoid purple AI clichés |
| AI Elements | Match tool-call chips to Tag style; keep streaming UI on `white` / `stroke` frames |
| PDF preview | Soft-elevated media frame matching product imagery treatment |

---

## Do / Don’t

**Do**
- Charcoal filled CTAs + blue for emphasis bands/accents
- Inter Tight headings with negative tracking
- Hairline `#eaebf1` frames and section rules
- Product UI as the visual anchor
- 8px controls, 10px media radii

**Don’t**
- Default to dark theme or purple/indigo washes
- Overuse orange (`sunshade`) or full-round pills
- Center everything into a generic dashboard grid on the first viewport
- Overlay floating badges/stickers on the hero
- Use Inter/Roboto/system as the display face — keep Inter Tight + Inter Display
