# PRODUCT.md — LangLearn

Strategic context for LangLearn. This file answers **who / what / why**; [DESIGN.md](./DESIGN.md) answers **how it looks**. Every design task should read both before touching UI.

## Register

**Product.** Design *serves* the task. LangLearn is an app UI — a daily-use learning tool, not a marketing surface. The bar is earned familiarity: a learner fluent in Anki, Duolingo, or Notion should sit down and trust it immediately. The tool disappears into the task; delight is saved for moments, not pages.

## What it is

A **kind, local-first Progressive Web App for language learning** — six languages ship full grammar, vocabulary and graded reading content today (Japanese, Russian, Arabic, Spanish, Portuguese, Romanian), and the app is extensible to any language via a registry entry plus content. It runs entirely offline in the browser (IndexedDB via Dexie, no backend), installs as a PWA, and is deployed to GitHub Pages at `https://truemichato.github.io/LangLearn/`. Core surfaces: a spaced-repetition **Review** loop (SM-2), a personal **Words** vocabulary, an immersion **Reader**, and a **Learn** hub (grammar, letters, listening, sentences, conjugations, music, tests, more), tied together by a gamified **Dashboard** (XP, streaks, badges, goals).

## The first-run contract

A beginner may arrive knowing nothing — not the script, not a single word, not what "SRS" means. The app owes them a **sequence, not an inventory**: every first-run surface points at exactly one next step, and that step is a *lesson*, never a form.

- Onboarding **hands off into content** — its last step is "pick your starting point" and its button navigates into a lesson. It never ends on the Dashboard.
- The recommendation is derived, not guessed: languages with an unfamiliar script (`ja`, `ru`, `ar`) start at **Letters**; Latin-script languages start at **First words**. The logic lives in `src/lib/starting-points.ts` and is the single source used by onboarding, the zero-data Dashboard, and the Learn hub — so the app never gives three different answers.
- **Zero words is the design centre, not an edge case.** Instrumentation (stats, forecasts, heat maps, badges) stays hidden until there is something to instrument.
- Adding a word manually is an *expert* action. Never make a beginner type 食べる before they have been taught it.

## Users & Purpose

- **Who:** self-directed adult language learners studying on their own, mostly on a phone, in short daily sessions (5–20 min) — on a commute, in bed, between tasks.
- **Context:** bursty, low-pressure, often one-handed on a small screen, sometimes offline. They return daily to keep a habit alive.
- **Job to be done:** "Help me make a little progress today without making me feel bad about yesterday." The primary task on any screen should be obvious and one tap away.
- **Emotional contract — "kind learning":** the app *rewards effort and never punishes mistakes.* No penalties, no streak-shaming, no harsh red failure states. A missed card is "No worries — it'll come back later," not a rebuke.

## Brand & Personality

**Three words: Kind · Calm · Capable.**

- **Kind** — encouraging microcopy, gentle color, celebrates effort. The tutor who's always on your side.
- **Calm** — uncluttered, legible, low-stimulation. A focused surface you can use tired.
- **Capable** — genuinely deep (SRS, immersion reading, analytics) without showing off. Quietly competent.

Playfulness shows up as **friendly emoji used as iconography** (a deliberate, owner-endorsed brand choice) and small gamified delights (streaks, badges, XP) — kept warm and low-pressure, never manipulative or loud.

### Named references (the feeling)
- The gentle encouragement of a **good human tutor**.
- The focused daily-habit calm of **Duolingo's best moments**, minus the dark-pattern pressure.
- The information density and trustworthiness of **Anki**, made humane and phone-native.

## Anti-references (what it must NOT feel like)

These are non-negotiable; they map 1:1 to the Don'ts in DESIGN.md.

- **Not "AI slop."** No rainbow card grids, gradient text, colored side-stripe borders, uppercase-tracked eyebrows over every section, bounce/overshoot easing, decorative indigo→violet gradients, or endless stacks of identical equal-weight cards. The app was deliberately rebuilt away from all of these.
- **Not punishing or high-pressure.** No streak-shaming, no aggressive red failure blocks, no guilt-trip nudges, no dark patterns.
- **Not a flashy SaaS landing page.** No hero-metric template, no glassmorphism-as-decoration, no "shouting" display type. This is a tool, not a pitch.
- **Not desktop-first enterprise UI.** It is phone-first; desktop is a deliberately framed phone-width column, not a sprawling dashboard.

## Accessibility

Accessibility is a **product requirement**, not a nice-to-have (learners use this daily, one-handed, in varied light):

- **WCAG AA contrast is a floor.** Body/label text ≥4.5:1; large/bold ≥3:1. Muted text is `slate-500` (light) / `slate-400` (dark) on the card and frame surfaces — **but slate-500 only clears AA on those.** On a tinted or slate-100 surface (chips, pills, segmented tabs, the indigo start-here card) muted text must be `slate-600` / `slate-300`. Never `text-slate-400` in light mode.
- **Full dark mode** with real `dark:` variants on every surface.
- **Keyboard + screen reader:** visible `:focus-visible` on every control; `aria-label` on icon-only buttons; labels on every input/`<select>`.
- **Touch targets ≥44px.** Base font 18px, user-adjustable.
- **Reduced motion** honored globally.

## Strategic design principles

1. **One obvious next action per screen.** Hierarchy over uniformity: a hero action, then grouped rows, then muted metadata. Never fifteen equal cards. A screen that offers a menu instead of a next step has failed, however complete the menu is.
2. **Kindness is a design constraint.** When in doubt between a "correct/incorrect" framing and an "effort/keep-going" framing, choose the latter — in copy *and* color.
3. **Restraint is the brand.** One indigo accent, one system font, tonal depth over shadows. Personality comes from voice and warmth, not decoration.
4. **Phone-first, offline-always.** Every feature must work on a small screen, one-handed, with no network. No webfonts, no runtime-critical fetches without a fallback.
5. **Extensible by language.** New languages are content + a registry entry (see `src/lib/languages.ts`); UI must never hardcode "Japanese" or assume a script.

## Where to look

- **Visual system / tokens / components / rules:** [DESIGN.md](./DESIGN.md) and `.impeccable/design.json`.
- **Architecture, DB schema, conventions:** `AGENTS.md`.
- **Design tokens in code:** `src/index.css` (`:root` / `.dark`).
- **A design detector hook is active** in this repo (`.impeccable/`): it scans UI files after edits and flags anti-patterns. Keep it green.
