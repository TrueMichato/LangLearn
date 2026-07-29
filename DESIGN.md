---
name: LangLearn
description: A kind, local-first language-learning PWA — calm, encouraging, phone-first.
colors:
  primary: "#4f46e5"          # indigo-600 — the single brand accent
  primary-hover: "#4338ca"    # indigo-700
  primary-light: "#6366f1"    # indigo-500 — icons/indicators only, never small text
  success: "#22c55e"          # green-500 — "Good" grade, completed, positive state
  warning: "#f59e0b"          # amber-500 — "Hard" grade, streak flame, caution
  danger: "#ef4444"           # red-500 — destructive confirm only (used sparingly)
  ink: "#1e293b"              # slate-800 — primary heading text (light)
  ink-dark: "#f1f5f9"         # slate-100 — primary heading text (dark)
  body: "#334155"             # slate-700 — body text (light)
  muted: "#64748b"            # slate-500 — muted/label text (light) — AA floor
  muted-dark: "#94a3b8"       # slate-400 — muted/label text (dark)
  surface-card: "#ffffff"     # card surface (light)
  surface-card-dark: "#1e293b" # slate-800 — card surface (dark, at ~90% alpha)
  surface-frame: "#f8fafc"    # slate-50 — the app column the content sits on (light)
  surface-chip: "#f1f5f9"     # slate-100 — unselected chip / tonal control fill (light)
  surface-frame-dark: "#0f172a" # slate-900 — app column (dark)
  canvas: "#e2e8f0"           # slate-200 — ambient backdrop behind the frame (light)
  canvas-dark: "#020617"      # slate-950 — ambient backdrop (dark)
  border: "#e2e8f0"           # slate-200 — hairline borders/dividers (light)
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "0.5rem"    # 8px — inputs, small chips
  md: "0.75rem"   # 12px — buttons, grade chips
  lg: "1rem"      # 16px — cards, sheets
  full: "9999px"  # pills, badges, avatars
spacing:
  xs: "0.5rem"    # 8px
  sm: "0.75rem"   # 12px — default gap between tiles
  md: "1rem"      # 16px — card padding
  lg: "1.5rem"    # 24px — gap between stacked sections
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0.5rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    rounded: "{rounded.md}"
    padding: "0.375rem 0.75rem"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0.375rem 1rem"
  chip-unselected:
    backgroundColor: "{colors.surface-chip}"
    textColor: "{colors.body}"
    rounded: "{rounded.full}"
    padding: "0.375rem 1rem"
  language-chip:
    backgroundColor: "{colors.surface-chip}"
    textColor: "{colors.body}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 0.75rem"
  language-chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 0.75rem"
---

# Design System: LangLearn

## Overview

**Creative North Star: "The Kind Study Companion."**

LangLearn is a patient, encouraging tutor rendered as software — a companion for learning any of its six shipped languages (Japanese, Russian, Arabic, Spanish, Portuguese, Romanian) and beyond, that celebrates effort and never scolds. The core philosophy is **kind learning**: mistakes are met with "No worries — it'll come back later," not red X's and streak-shaming. Every design decision serves that emotional contract. The interface should feel calm, legible, and quietly capable: a focused phone-first surface you return to every day without friction or fatigue.

The system is **product-register** — design *serves* the task. It reaches for earned familiarity (a learner fluent in Anki, Duolingo, or Notion should trust it on sight) rather than novelty. Personality is carried by warm microcopy and a consistent set of emoji used as friendly iconography — not by decoration. Color is restrained to one indigo accent; depth comes from tonal layering, not heavy shadows; motion conveys state, never spectacle. The app lives in a centered phone-width column that reads as an intentional focused app on any screen (see Layout).

This system explicitly rejects the "AI slop" aesthetic it was rebuilt away from: rainbow card grids, gradient text, colored side-stripe borders, uppercase-tracked eyebrows over every section, bounce easing, decorative indigo→violet gradients, and endless stacks of equal-weight cards. Discipline is the point.

**Key Characteristics:**
- **Kind, never punishing** — gentle language and gentle color; no harsh failure states.
- **One quiet accent** — indigo carries meaning; everything else is neutral slate.
- **Phone-first, framed on desktop** — a single `max-w-[34rem]` column, deliberately centered.
- **Legible above all** — WCAG AA contrast is a floor, not a goal; system fonts, generous base size.
- **Hierarchy over uniformity** — one hero action, grouped rows, muted metadata. Not fifteen identical cards.
- **One control, one place** — a repeated affordance (language switching, grading, empty states) has exactly one implementation. Twenty hand-rolled variants is how the accent rule breaks.
- **Offline-first** — no webfonts, no network-dependent chrome; it works on a subway.

## Colors

A restrained palette: one indigo accent against a cool slate neutral ramp, with three semantic colors reserved strictly for state.

### Primary
- **Indigo** (`#4f46e5`, indigo-600): The single brand accent. Primary buttons, active nav item + sliding indicator, current selection, progress fills, focus rings, and text links. This is the app's voice — used deliberately, never decoratively.
- **Indigo Hover** (`#4338ca`, indigo-700): Primary button hover only.
- **Indigo Light** (`#6366f1`, indigo-500): Icon glyphs, SVG indicators, and the ambient canvas glow. **Never** small body/label text (fails contrast on white — use indigo-600 for text).

### Secondary
The app has **no decorative secondary color.** Violet (`#8b5cf6`) exists as a legacy `--color-accent` token but is intentionally unused; do not reach for it. One accent is the system.

### Tertiary — Semantic (state only)
- **Success Green** (`#22c55e`, green-500): the "Good/Got it" grade, completed lessons, positive deltas.
- **Warning Amber** (`#f59e0b`, amber-500): the "Hard/Struggled" grade, the streak flame, gentle caution.
- **Danger Red** (`#ef4444`, red-500): destructive confirmations only. Because of the kind-learning contract, red is **rare** — a missed review is amber, never red.

### Neutral (Slate ramp — the whole neutral system)
- **Ink** (`#1e293b` slate-800 / `#f1f5f9` slate-100 dark): headings and primary text.
- **Body** (`#334155` slate-700 / `#e2e8f0` slate-200 dark): sustained reading text.
- **Muted** (`#64748b` slate-500 / `#94a3b8` slate-400 dark): labels, captions, secondary metadata. Slate-500 is the light-mode floor for AA **on the card and frame surfaces only** — it measures 4.55:1 on slate-50 but drops to 4.35:1 on slate-100 and 4.27:1 on indigo-50. On any tinted or slate-100 surface (chips, pills, segmented tabs, the start-here card) muted text steps down to **slate-600 / slate-300**. `text-slate-400` in light mode fails AA and appears nowhere in the codebase.
- **Card** (`#ffffff` / `#1e293b`@90% dark), **Frame** (`#f8fafc` slate-50 / `#0f172a` slate-900 dark), **Canvas** (`#e2e8f0` slate-200 / `#020617` slate-950 dark): the three depth layers. The **canvas never carries text** — it is the backdrop *behind* the column, visible in the desktop side rails. The content column always paints the frame surface (`.app-surface`), at every width, so muted text is never read against slate-200.
- **Border** (`#e2e8f0` slate-200 / `rgb(255 255 255 / 0.1)` dark): hairline borders and dividers.

### Named Rules
**The One Accent Rule.** Indigo-600 is the only brand color. If a screen has a second decorative hue, one of them is wrong. Green/amber/red appear *only* to communicate state (grading, streak, destructive confirm), never as decoration.

**The Kind Palette Rule.** Failure is never loud. Missed cards, wrong answers, and empty states use soft tints (`amber-50`, `red-50/60`) and encouraging copy — never a saturated red block. The color should reassure, not punish.

**The Slate-Only Rule.** The neutral ramp is `slate`, exclusively. Never mix Tailwind `gray-*` with `slate-*`; the codebase was unified to slate and must stay that way.

**The Dark-Twin Rule.** Every color class ships a `dark:` variant in the same edit. Dark mode is not a theme layered on afterwards; black text on a dark surface is this codebase's most persistent regression.

## Typography

**Display / Body / Label Font:** the platform system sans — `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, ...` (Tailwind's default stack). One family throughout.

**Character:** Neutral, legible, invisible. As an offline-first PWA that renders Japanese kana/kanji, Cyrillic, Arabic, and Latin side by side, the system font is a feature: it ships zero webfont bytes, never flashes, and always has native script coverage. Hierarchy comes from **weight and size**, never from a second typeface. Base size is a generous **18px** (`--app-font-size`, user-adjustable in Settings).

### Hierarchy
- **Display** (700, `1.5rem`/24px, lh 1.2): page-level titles and hero numbers (e.g. "Session Complete", stat values).
- **Headline** (600, `1.125rem`/18px, lh 1.3): card titles, section leads ("Today's Plan").
- **Title** (600, `1rem`/16px): sub-card headings, list-item titles.
- **Body** (400, `1rem`/16px, lh 1.5): sustained text; cap prose at 65–75ch.
- **Label** (500, `0.75rem`/12px): captions, chips, stat labels, muted metadata. Sentence case.

### Named Rules
**The System-Sans Rule.** No custom webfonts, ever. This is an offline PWA; a font that needs the network is a font that breaks on the subway. Weight and size carry all hierarchy.

**The No-Eyebrow Rule.** Section headers are normal-case `text-sm font-semibold text-slate-500 dark:text-slate-400`. Uppercase + wide letter-spacing above every section is forbidden. Uppercase is reserved for genuine micro-badges only (a two-letter language code like "JA", an achievement tag).

**The 12px Floor.** `text-xs` (12px) is the smallest type in the system. Below that a label stops being read and starts being decoration.

**The Direction Rule.** Target-language text carries `dir` (via `isRTL` / `rtlProps` in `src/lib/rtl.ts`) — Arabic ships today. English-primary prose that merely *quotes* a target-language word stays LTR. Never assume a script's direction from the layout.

## Layout

**One column, everywhere.** `.app-frame` = `max-w-[34rem] mx-auto` (`--app-max: 34rem`, 544px). The header, `<main>`, and the bottom nav all align to this width. There is no second layout: a desktop browser gets the same phone-width column, deliberately framed, not a sprawling dashboard.

- **`.app-surface`** paints the frame color on the content column at **every** width. On a phone the column fills the screen, so the canvas must never double as the reading surface.
- **`.app-canvas`** is the backdrop *behind* the column — a slate field with a soft indigo radial that reads in the desktop side rails. It carries no text.
- **≥768px only:** the frame gains hairline side rails and the ambient shadow (see Elevation & Depth) that floats the column above the canvas.

**Rhythm.** `gap-3` (12px) between tiles in a group, `gap-4`/`space-y-4` (16px) between stacked sections, `p-4` (16px) inside a card. Sustained prose caps at 65–75ch.

**Density.** Content is grouped, not gridded. Two columns are the practical maximum at this width; three only for compact tiles (letter charts, number pads). Horizontal chip rows scroll (`overflow-x-auto`) rather than wrapping into a second line that pushes content below the fold.

### Z-Index Scale
`header: z-40` → `bottom nav: z-50` → `modal / bottom-sheet: z-[60]` → `toast / nudge: z-[70]` → `onboarding: z-[100]`. Never invent arbitrary values; slot new overlays into this ladder. Full-screen surfaces (modals, onboarding) live *outside* the frame but must respect the scale.

### Named Rules
**The One-Column Rule.** Everything lives in the `.app-frame`. A surface that needs more width is a surface that needs less content.

**The Above-the-Fold Rule.** A first-run screen fits in ≲1.5 viewports at 390×844. Instrumentation (stats, forecasts, heat maps, badges) stays hidden until there is data to instrument.

## Elevation & Depth

This system is **flat by default and layered by tone**, not by shadow. Depth is communicated through three stacked neutral surfaces — **canvas → frame → card** — each a step lighter (light mode) or a step lighter-on-darker (dark mode). Shadows are subtle and mostly reserved for the desktop app-frame and for hover feedback. Glassmorphism (`backdrop-filter: blur(16px)`) is used **only** on the two pieces of sticky chrome (the header and bottom nav), never on content cards.

### Shadow Vocabulary
- **Resting card** (`shadow-sm` → `0 1px 2px rgb(0 0 0 / 0.05)`): the default lift for a content card. Barely there.
- **Hover card** (`shadow-md` + `-translate-y-0.5`): tactile response to hover on interactive cards.
- **App frame** (`0 24px 60px -24px rgb(15 23 42 / 0.28)`, desktop ≥768px only): the ambient shadow that floats the phone-width column above the canvas. Dark mode: `0 24px 60px -20px rgb(0 0 0 / 0.6)`.
- **Modal / sheet** (`shadow-lg` / `shadow-xl`): elevated overlays.

### Named Rules
**The Three-Layer Rule.** Depth = canvas (`slate-200`/`slate-950`) → frame (`slate-50`/`slate-900`) → card (`white`/`slate-800`). Reach for a lighter surface before you reach for a heavier shadow.

**The Glass-Is-Chrome-Only Rule.** `backdrop-blur` belongs on the sticky header and bottom nav and nowhere else. Glass on a content card is decoration, and decoration is banned.

## Shapes

Corners are **generously rounded and consistent**: soft enough to read as friendly, uniform enough to disappear. The radius encodes scale, not emphasis — a bigger surface gets a bigger radius.

| Step | Value | Used by |
|---|---|---|
| `rounded-lg` | 8px | inputs, selects, small tiles |
| `rounded-xl` | 12px | buttons, chips, grade buttons, list rows |
| `rounded-2xl` | 16px | cards, sheets, modals, section containers |
| `rounded-full` | pill | badges, counts, avatars, filter pills |

**Borders are hairlines, and they go all the way around.** `border border-slate-200/70 dark:border-white/10` on cards; `border-slate-300 dark:border-slate-600` on inputs and outline buttons. A border defines an edge — it never carries color as emphasis.

**Fills before outlines.** Separation comes from a tonal fill plus a hairline. If two things need to look different, change the surface, not the border weight.

### Named Rules
**The No-Stripe Rule.** A colored `border-l-*` / `border-r-*` accent stripe on a card, list item, or callout is an absolute ban. It is the single most reliable tell of generated UI, and it is how a second accent color sneaks into the system.

**The No-Nesting Rule.** Never put a `rounded-2xl` card inside another `rounded-2xl` card. If content needs grouping inside a card, use spacing and a hairline divider.

## Components

Every interactive element ships default, hover, focus-visible, active, and disabled states. Icons are emoji (a deliberate brand choice) paired with a text label or an `aria-label`.

### Buttons
- **Shape:** `rounded-xl` (12px).
- **Primary:** `bg-indigo-600 text-white`, `px-5 py-2`, `font-semibold`. Hover `bg-indigo-700`. Active `scale-0.97` (`.press-feedback`). Disabled `opacity-40`. This is the one loud element per screen.
- **Secondary / Outline:** `border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200`, transparent fill, hover `bg-slate-100 dark:bg-slate-700`.
- **Focus:** every button inherits the global `:focus-visible` outline (`2px solid var(--color-primary)`, 2px offset).
- **Target:** `min-h-[44px]`, without exception.

### Chips / Filters
- **Style:** `rounded-full` or `rounded-xl`, `px-3`, `text-sm font-medium`, `min-h-[44px]`.
- **Selected:** `bg-indigo-600 text-white` — always, on every surface. There is one selected-state in this system.
- **Unselected:** a tonal fill — `bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200`, hover one step darker. Where a chip sits directly on a white card and needs an edge, `bg-white dark:bg-slate-700` + `border border-slate-300 dark:border-white/10` is the bordered variant.
- Rows scroll horizontally (`flex gap-2 overflow-x-auto`) rather than wrapping.

### Language Picker (signature — the one switcher)
`src/components/common/LanguagePicker.tsx`. Every language-aware surface uses this and only this; it replaced twenty hand-rolled chip rows that had drifted into four different selected-states, including a `bg-pink-600` that broke the One Accent Rule.

- **It renders nothing when there are fewer than two options.** Most learners study one language and must never see a control with one answer.
- Selected/unselected follow the chip rules above. `role="group"` + `aria-label`, `aria-pressed` per chip, `aria-label` carrying the full language name behind the short display label.
- `allowAll` adds an "All languages" chip for surfaces where language is a *filter* (Analytics, Words) rather than a viewing context.
- The current language is app-wide state (`useCurrentLanguage`), not per-page state. Switching on one surface switches everywhere.

### Empty & Unavailable States
- **Unavailable:** when a surface does not support the learner's current language, it says so by name — "Conjugation drills aren't available for Romanian yet" — and offers the languages it does have (`LanguageUnavailable`). It never silently substitutes a different language.
- **Empty:** an empty state is a *next step*, not an apology. One sentence of encouragement plus one action that leads into content. Soft tints only (see the Kind Palette Rule).

### Cards / Containers
- **Corner Style:** `rounded-2xl` (16px) — see Shapes.
- **Background:** `bg-white dark:bg-slate-800/90`.
- **Border:** a full hairline — `border border-slate-200/70 dark:border-white/10`. **Never** a colored side-stripe.
- **Shadow:** `shadow-sm` at rest (see Elevation & Depth). Never nest a card inside a card.
- **Internal Padding:** `p-4` (16px).

### Inputs / Fields
- **Style:** `border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg px-3 py-2`.
- **Focus:** `focus:ring-2 focus:ring-indigo-400` (plus the global focus-visible outline).
- **Labeling:** every input and `<select>` has an associated `<label>` or an `aria-label`, plus an `id`/`name`. Non-negotiable.

### Navigation (Bottom tab bar — signature)
- Fixed, glass, aligned to the app-frame width with side rails on desktop. Five tabs (📊 Home · 🃏 Review · 📚 Words · 📖 Reader · 🎓 Learn), each an emoji + label.
- **Active:** `text-indigo-600 dark:text-indigo-400 font-semibold`, icon `scale-110`, plus a sliding indigo indicator bar. **Inactive:** `text-slate-500`. A red count badge rides the Review icon when cards are due.

### Grade Buttons (signature — the SRS core loop)
Four semantic tinted chips expressing effort, not judgment: **Again** (orange), **Hard** (amber), **Good** (green), **Easy** (blue). Each is `bg-<hue>-50 text-<hue>-700 border border-<hue>-200 rounded-xl` (dark: `bg-<hue>-900/25 text-<hue>-300 border-<hue>-800/60`). Traffic-light meaning, clean full borders — never gradient fills or side-stripes. Keyboard 1–4 and Space to flip.

### Starting Points (signature — the on-ramp)
The first-run hand-off, shared by the last onboarding step, the zero-data Dashboard, and the Learn hub (`src/lib/starting-points.ts`). Three equal-weight rows with exactly one marked recommended; the recommendation is derived from the language's script system, never guessed. One component, three placements — so the app never gives three different answers to "where do I start?".

## Do's and Don'ts

### Do:
- **Do** use **indigo-600** as the one accent — primary actions, active state, focus, progress, and text links (use indigo-600 for links, not indigo-500).
- **Do** write muted text as `text-slate-500 dark:text-slate-400` on cards and the frame, stepping down to `text-slate-600 dark:text-slate-300` on tinted or slate-100 surfaces. Headings are `text-slate-800 dark:text-slate-100`. Verify ≥4.5:1 contrast (≥3:1 for large/bold).
- **Do** differentiate cards with a **full 1px border** (`border border-slate-200/70 dark:border-white/10`) plus tonal fill.
- **Do** give every icon-only button an `aria-label`, every input/`<select>` a label, and every control a visible `:focus-visible` state and a ≥44px (`min-h-[44px]`) touch target.
- **Do** keep content inside the `.app-frame` and slot overlays into the z-scale (modal 60, toast 70, onboarding 100).
- **Do** reuse the shared control — `LanguagePicker` for language, `StartingPoints` for the on-ramp, `LanguageUnavailable` for an unsupported pair. A local re-implementation is how the system drifts.
- **Do** ship a `dark:` variant with every color class, in the same edit.
- **Do** fetch runtime content with `` `${import.meta.env.BASE_URL}...` `` (the app is served under `/LangLearn/`).
- **Do** honor `prefers-reduced-motion` (a global reset already zeroes durations) and keep transitions ease-out, 150–300ms.
- **Do** keep failure gentle: soft tints + encouraging copy for wrong answers, misses, and empty states.
- **Do** establish hierarchy — one hero action, grouped rows, muted metadata. Collapse long lists (e.g. badges) behind a summary + "Show all".

### Don't:
- **Don't** use `border-left`/`border-right` greater than 1px as a colored accent stripe on cards, list items, or callouts. (Absolute ban.)
- **Don't** use gradient text (`bg-clip-text` + gradient). Solid ink only; emphasize with weight/size. (Absolute ban.)
- **Don't** use decorative indigo→violet gradients. The one intentional exception is the "Today's Plan" hero surface; everywhere else, solid. Interactive fills use `.fill-primary` (solid indigo-600) — white text on the old violet endpoint measured 4.2:1 and failed AA.
- **Don't** set type below the 12px Label floor (`text-xs`). If a number won't fit, the number doesn't belong there — state it in the adjacent label instead.
- **Don't** put a tiny uppercase tracked eyebrow above every section. Use normal-case `text-sm font-semibold text-slate-500`.
- **Don't** use bounce/overshoot easing (`cubic-bezier(0.34, 1.56, …)`) or `animate-bounce`. Ease-out only; no infinite decorative loops.
- **Don't** stack endless equal-weight `rounded-2xl` cards. If everything is a card, nothing is grouped.
- **Don't** nest a card inside a card.
- **Don't** mix `gray-*` and `slate-*` — the neutral ramp is slate, exclusively.
- **Don't** use `text-slate-400` (or `indigo-500`) as light-mode body/label text; it fails WCAG AA.
- **Don't** add glassmorphism to content cards — glass is for the sticky header and nav only.
- **Don't** silently fall back to another language when a surface can't serve the current one. Name the gap.
- **Don't** hardcode a language name or assume a script's direction — `getLanguageLabel(code)` and `rtlProps` exist for this.
- **Don't** add a custom webfont; this is an offline PWA. System sans only.
