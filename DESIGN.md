# Design System v3.0 — David Joseph Cortez

**North star:** *An animated chalkboard in a design studio.*
A near-black warm wall, cream chalk, and five colour-coded highlighters — one per
discipline. Massive type, objects that break their frames, outlined controls only.

Derived from **GSAP** (gsap.com) via refero.design.

> Supersedes v2.0 (monopo saigon) and v1.0 (Auros + Origin Financial). Both were
> **typography and colour with no imagery** — abstract backdrops behind text. GSAP's
> distinctiveness comes from a *family of custom 3D objects* that overlap the type,
> plus colour used as taxonomy. No amount of token tuning substitutes for an asset
> layer, which is what the first two systems were missing.

---

## 1. Colour

Warmth is load-bearing. **Never `#ffffff`, never `#000000`** — the reference is
explicit that pure values collapse the character.

| Token | Hex | Purpose | On-canvas contrast |
|---|---|---|---|
| `--canvas` | `#0e100f` | Page | — |
| `--panel` | `#191919` | Nested panels, footer | — |
| `--cream` | `#fffce1` | All primary text and UI | 18.4:1 |
| `--muted` | `#8e8e82` | Secondary body copy | 5.8:1 |
| `--hair` | `#42433d` | Hairline borders only, never text | 1.9:1 |

> The reference specifies `#7c7c6f` for muted. Measured, that is **4.52:1** — it clears
> the 4.5 threshold by 0.02 while carrying most of the body copy. Lifted to `#8e8e82`
> for a real margin, still 3.2× dimmer than cream so the hierarchy is unchanged.

### Colour is taxonomy, never decoration

One hue per discipline. Never reuse a hue for a different meaning, and never add a
sixth — the taxonomy is what makes the system legible.

| Hue | Hex | Discipline | Contrast |
|---|---|---|---|
| Green | `#0ae448` → `#abff84` | The brand — him | 11.1:1 |
| Orange | `#ff8709` | Data & Analytics | 7.9:1 |
| Blue | `#00bae2` | Languages & Interfaces | 8.3:1 |
| Violet | `#9d95ff` | Data Systems | 7.4:1 |
| Pink | `#fec5fb` | Tooling & AI | 13.3:1 |

Projects inherit the hue of their discipline, so colour carries meaning across
sections rather than decorating each one separately.

---

## 2. Typography

**Figtree** substitutes for Mori — humanist warmth, not a geometric grotesk. The
reference explicitly forbids Inter, Roboto and system defaults here; a neutral
substitute collapses the editorial tone.

The scale is **binary**: editorial display, or compact UI. Nothing lives between.

| Role | Class | Size | Weight | Line height |
|---|---|---|---|---|
| Display | `.t-display` | clamp(56 → **224px**) | 600 | 0.9 |
| XL | `.t-xl` | clamp(44 → 112px) | 600 | 0.95 |
| Large | `.t-lg` | clamp(34 → 66px) | 600 | 1.0 |
| Medium | `.t-md` | clamp(26 → 40px) | 600 | 1.05 |
| Body | `.t-body` | 19px | 400 | 1.55 |
| Small | `.t-sm` | 16px | 400 | 1.5 |
| UI | `.t-ui` | 16px | 400 | 1.15 |

Display tracking is `-0.02em` throughout. The reference sets body line-height at 1.15;
that is kept for UI and labels, but paragraphs use 1.55 — 1.15 is unreadable at
paragraph length.

### The signature

Every section opens with a curly-bracket annotation: `{ 01 — about }`. This is the
recurring device that ties the page together — `.anno` supplies the braces via
`::before` / `::after`, so the markup stays clean.

---

## 3. Shape, space, controls

Page max-width **1280px**. Element gap 16px, section padding `clamp(80px, 10vw, 140px)`.

Radius is **8px on surfaces, 100px on anything interactive.** Nothing else.

**Controls are outlined only.** No filled CTA exists in the system. The single
permitted chromatic escalation is the primary CTA's 1.5px green gradient stroke,
achieved with a mask so there is still no fill.

**No box-shadow.** Depth comes from `--panel` surface steps and hairline dividers.

---

## 4. The object layer

Nine 3D objects, generated to one shared prompt so they read as a family: matte
ceramic, single soft key from upper left, cool rim light.

| Object | Hue | Used for |
|---|---|---|
| `hero-knot` | green | Hero, overlapping the name |
| `data` | orange | Data & Analytics |
| `systems` | blue | Languages & Interfaces |
| `ml` | violet | Data Systems |
| `cloud` | pink | Tooling & AI |
| `aqi`, `flightprice`, `voidlab`, `kinder` | per project | Work rows |

**Objects must overlap their frame.** The hero knot bleeds past the container edge;
work objects hang off the corner of their screenshot. An object sitting neatly inside
a box is the one thing that kills the effect.

### Provenance

Three generations were compared head to head. **GPT (PNG) is the base set**; it mattes
~30% cleaner than the Canva JPEGs (halo leak 0.0795 vs 0.1139 — JPEG ringing at the
object edge is real and measurable), its lighting is more consistent, and its tangle
and disc-stack read far better at display size. **Canva's `systems` lattice and
`kinder` blocks are kept** — Canva's lattice reads as a coherent interlocking structure
where GPT's is scattered, and its block stack is more architectural. `flightprice`
exists in neither new set, so the original render is retained.

### Pipeline

Renders arrive on a near-flat dark field that differs slightly per file, so each
background is estimated from a border ring and cut to transparent by colour distance,
with only border-connected background forced fully clear. Filling enclosed holes was
tried and **boxed in the strand tangle** — the gaps between voidlab's strands are
genuinely see-through. Cut, trimmed, squared, then WebP q82 → **446KB for all nine**,
all lazy-loaded.

**Export at the size the layout actually uses, not the size you assume.** The
disciplines were first exported at 460px and measured rendering at 673px — the
reversed rows place the object in the wider `1.15fr` column. `.disc-obj` is now capped
at 460px and the sources are 700px, so nothing upscales: every object renders at
1.5–2.8× density. Note that `getBoundingClientRect()` on these is inflated by GSAP's
rotation; use `offsetWidth` to read true layout size.

Sources kept outside the deploy folder in `_object-originals/`.

---

## 5. The mark

A **"C" that resolves out of three shrinking points.** The letter is the initial —
the wordmark is `Cortez.`, so C is the brand letter. The dissolve is the positioning:
scattered observations becoming a signal you can decide from.

| File | Use |
|---|---|
| `assets/logo/mark.svg` | Primary, `#0ae448` |
| `assets/logo/mark-mono.svg` | `currentColor`, inherits its surroundings |
| `assets/logo/favicon.svg` | Heavier stroke, larger radius, two dots, on its own tile |
| `assets/logo/apple-touch-icon.png` | 180px, full-bleed — iOS masks its own corners |

Construction: arc sweeps 50 to 252 degrees. That is 202, so `large-arc-flag` is 1 —
verified by rendering a 102-point polyline of the same circle and diffing (0.24%
mismatch, all antialiasing). Dots shrink by 0.68 each step; **the size gradient is
load-bearing**, because uniform segments read as a loading spinner. Nav lockup is 26px
— below ~22px the smallest dot falls under a pixel and the dissolve reads as fringe.

**The device does not transfer to other letters.** It works on the C because the open
terminal lets the dots continue the letter's own arc inside its optical box. Seven D
variants were drawn and all failed: dots below the baseline read as a lowercase "p",
dots at the stem are invisible, and a sampled bowl is too subtle at any real size. If a
second letter is ever needed it requires a different gesture, not this one.

---

## 6. Motion

| Token | Value |
|---|---|
| `--ease-cam` | `cubic-bezier(.19, 1, .22, 1)` |
| `--dur-glide` | 1.1s |
| `--dur-move` | 0.6s |
| `--dur-micro` | 0.3s |

Dependencies: **GSAP 3.12.5 + ScrollTrigger**, two pinned CDN scripts, no build step.
Scrolling is native — Lenis was tried and removed.

1. **Hero name assembly** — per-character masks, `yPercent 115 → 0`, 24ms stagger.
2. **Hero object entrance** — fades in with a slight scale and rotate, after the name.
3. **Masked line reveals** on every heading, 80ms stagger, re-split on width change only.
4. **Block reveals** — `.rv` elements rise 26px, once.
5. **Object drift** — every object counter-rotates and drifts against the scroll,
   alternating direction. This is the reference's signature move and the reason the
   objects overlap their frames.
6. **Marquee** — CSS keyframe on a doubled track, built in JS so the halves cannot
   drift out of sync.
7. **Cursor** — GSAP `quickTo`, swells and turns green over interactive elements.
8. **Ink loop** — the generated video backs the **contact** section only, at 42% under
   a scrim. The objects carry the hero; a video there fought them. It runs on mobile
   too: video decode is hardware-accelerated, so unlike the parallax and cursor it is
   cheap on a phone. The real mobile cost is the ~1MB download, so it is gated on
   `Save-Data` and connection type rather than pointer type.

   Text over it needs its own tone. The page's `--muted` measures only **2.33:1**
   against the brightest video frame — a real AA failure, worst on mobile where the
   text spans 95% of the width into the weakest part of the scrim. `.contact` uses
   `#cfcfc0` instead (**4.90:1**, still 1.5x dimmer than cream). Dimming the video to
   rescue `--muted` would have required ~25/255, i.e. invisible.

**Rules**
- **No hidden state in CSS.** Every offset and opacity is applied by GSAP at runtime,
  so a failed CDN or reduced-motion renders the page complete and static.
- **No `filter`, no `mix-blend-mode`, no continuous paint loop.** The page contains
  zero of each.
- Object drift and the cursor are skipped under the `lowPower` guard (coarse pointer,
  or `hardwareConcurrency <= 4`).
- `#work` uses `overflow-x: clip` — the overhanging objects push ~30px past the
  viewport at narrow widths, and `clip` contains that without creating a scroll
  container the way `hidden` would.

---

## 7. Performance

Carried forward from v2, still enforced:

- **Export images at ~2× display size.** The certificate badges once shipped at
  1772×928 into a 56px box.
- **No `will-change` in CSS on anything GSAP animates** — it promotes a permanent
  compositor layer. GSAP's `force3D` promotes only for the tween's duration.
- **No `mix-blend-mode` on a fixed element**, at any size. A fixed blended layer stops
  the compositor scrolling the document on its own.
- **Never `filter: blur()` on a large element** — it forces a render surface. A
  radial-gradient with a soft alpha ramp looks blurred for free.
- Profile before optimising. The v2 canvas backdrop was measured at 3% of frame budget
  and pre-rendering it into sprites proved **16× slower**.

Originals live outside the deploy folder: `_image-originals/`, `_object-originals/`.
Re-encoding needs ffmpeg via `pip install imageio-ffmpeg` (self-contained, not on PATH).

---

## 8. Don'ts

- Never use `#ffffff` or `#000000`; the warm cream and warm off-black are the system.
- Never add a filled CTA — outlined only; the gradient stroke is the maximum escalation.
- Never add a sixth taxonomy colour, or reuse a hue for a different discipline.
- Never set a radius other than 8px or 100px.
- Never set body type below 14px or above 23px, or display type below 34px.
- Never use `box-shadow`, `filter`, or `mix-blend-mode`.
- Never let an object sit fully inside its frame — it must break the edge.
- Never substitute a neutral grotesk (Inter, Roboto, system-ui) for the display face.
