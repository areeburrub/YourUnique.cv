# YourUnique.cv — Design Language

Visual system for marketing pages and the app shell. Prefer shadcn/`base-nova` components styled to these tokens.

---

## Direction

Warm atelier SaaS — cream canvas, matte terracotta, pastel rooms, and big rounded controls. The product should feel human and unhurried: one red doing the urgent work, everything else matte and quiet.

Inspired by coral-on-cream resume systems (Atelier), Tedy’s single-accent pastel rooms, and Eddie’s oversized rounded cards.

**Not:** electric blue, hairline wireframes, compact 8px chrome, or candy neon red.

---

## Color

| Token | Hex | Role |
|---|---|---|
| `ink` | `#1C1816` | Warm near-black. Headings, body, strong labels |
| `brand` | `#C23B2E` | Matte terracotta. Primary buttons, links, active marks |
| `brand-deep` | `#9A2F25` | Pressed / hover darken |
| `cream` | `#F5F0EA` | Page canvas |
| `paper` | `#FFFCF8` | Cards, popovers, raised surfaces |
| `sand` | `#EDE6DC` | Secondary fills, muted wells |
| `blush` | `#F3DDD6` | Pastel room / selected wash |
| `sage` | `#DCE8DF` | Pastel room for calm features |
| `butter` | `#F2E8CF` | Pastel room for highlights |
| `lilac` | `#E5DFEC` | Pastel room for tertiary variety |
| `stone` | `#6B635B` | Supporting copy |
| `pebble` | `#A89F95` | Tertiary labels, soft icons |
| `line` | `#E4D9CE` | Soft borders — used sparingly |
| `danger` | `#9A241C` | Errors only, darker than brand |

**Surfaces**
- Default page: cream, not sterile white
- Sections: pastel rooms (blush / sage / butter / paper) with generous radius, not stroked grids
- Product imagery sits on a pastel wash with a soft warm shadow

---

## Typography

| Role | Family | Weights |
|---|---|---|
| Display / headings | **Inter Tight** | 500 Medium, 600 SemiBold |
| Body / UI / buttons | **Inter** | 400 Regular, 500 Medium, 600 SemiBold |

Fallback: `Arial, sans-serif`.

### Scale

| Style | Size / LH | Tracking | Weight |
|---|---|---|---|
| Heading 01 | 56 / 64 | `-1.68px` | 600 |
| Heading 02 | 48 / 56 | `-0.96px` | 600 |
| Heading 03 | 40 / 48 | `-0.8px` | 600 |
| Heading 04 | 28 / 36 | `-0.56px` | 600 |
| Heading 05 | 24 / 32 | `-0.48px` | 500 |
| Body 01 | 20 / 28 | `-0.2px` | 500 |
| Body 02 | 16 / 24 | `0` | 400 / 500 |
| Tag / eyebrow | 14 / 20 | `0.04em` | 500 · **UPPERCASE** |

---

## Layout & spacing

| Token | Value |
|---|---|
| Gap base | `4px` |
| Content max | `1160px` |
| Side margin | `32px`–`40px` |
| Section vertical padding | `96px`–`140px` |
| Card padding | `28px`–`40px` |
| Icon well | `56px`–`64px` |

**No page rail.** Content is a centered column on cream. Hierarchy comes from pastel rooms and whitespace, not left/right stroke frames.

**Grid habits**
- Hero: split row with breathing room — copy left, floating product card right
- Features: two large rounded rooms, not a shared hairline grid
- Pricing: two cards with a real gap
- Stats / proof: icon-first tiles, one idea each

---

## Radius

| Use | Radius |
|---|---|
| Buttons / chips | `999px` (full pill) |
| Icon wells | `20px`–`24px` |
| Cards / rooms | `28px`–`32px` |
| Media / previews | `24px` |
| Inputs | `16px` |

Nothing sharp. Compact 6–8px corners are out.

---

## Buttons

**Primary (filled)**
- BG: `brand` (`#C23B2E`)
- Text: cream, medium
- Padding: `14px 28px`
- Height: `48px`–`56px` on marketing, `40px` in-app
- Radius: full pill
- Soft terracotta shadow on hover

**Secondary (outline / paper)**
- Paper fill, sand border, ink text
- Same size and radius as primary

**Icon buttons**
- Minimum `40px` hit target
- Large glyphs (`20px`–`24px`)

---

## Components & patterns

1. **Eyebrow** — uppercase tag in brand or stone. No accent bar.
2. **Hero** — eyebrow → H1 → short body → big pill CTAs. Product card floats on a blush wash.
3. **Icon tile** — 56–64px rounded well, big glyph, short title, one sentence.
4. **Pastel room** — large rounded card with a solid pastel fill. No inner wireframe.
5. **Checklist** — brand mark in a blush circle + one line of copy.
6. **Empty state** — oversized icon well, short title, one sentence, one big button.

---

## Elevation

```css
box-shadow:
	0 24px 48px rgba(28, 24, 22, 0.06),
	0 8px 16px rgba(28, 24, 22, 0.04);
```

Brand actions may use a terracotta glow: `0 10px 28px rgba(194, 59, 46, 0.22)`.

---

## Motion

| Pattern | Behavior |
|---|---|
| Section enter | `translateY(16px)` + fade; ease ~400ms |
| Button | Soft lift / press, not a mechanical text reel |
| Hover | `translateY(-1px)` + shadow, ~200ms |

Keep motion quiet. No dashed-rail decorations, no blueprint marks.

---

## Do / Don’t

**Do**
- One matte red for every primary action
- Cream canvas + pastel rooms
- Big pills, big icons, lots of air
- Inter Tight headings with negative tracking

**Don’t**
- Electric blue, indigo, or purple AI chrome
- Hairline page rails or diamond corner marks
- Tiny 8px buttons or 14px icon wells
- Saturated candy red or neon glow stacks
