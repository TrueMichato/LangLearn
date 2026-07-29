# Product

<!-- impeccable:product-schema 1 -->

Strategic context for LangLearn. This file answers **who / what / why**; [DESIGN.md](./DESIGN.md) answers **how it looks**. Every design task should read both before touching UI.

## Platform

web

## Users

- **Who:** self-directed adult language learners studying on their own, mostly on a phone, in short daily sessions (5–20 min) — on a commute, in bed, between tasks.
- **Context:** bursty, low-pressure, often one-handed on a small screen, sometimes offline. They return daily to keep a habit alive.
- **Job to be done:** "Help me make a little progress today without making me feel bad about yesterday." The primary task on any screen should be obvious and one tap away.
- **A beginner may arrive knowing nothing** — not the script, not a single word, not what "SRS" means. That learner, not the returning power user, is the design centre.

## Product Purpose

A **kind, local-first Progressive Web App for language learning.** Six languages ship full grammar, vocabulary and graded reading content today (Japanese, Russian, Arabic, Spanish, Portuguese, Romanian), and the app is extensible to any language via a registry entry plus content.

Core surfaces: a spaced-repetition **Review** loop (SM-2), a personal **Words** vocabulary, an immersion **Reader**, and a **Learn** hub (grammar, letters, listening, sentences, conjugations, music, tests, more), tied together by a **Dashboard** (XP, streaks, badges, goals).

Success is a learner who finishes something real in their first session and knows what to do tomorrow — and who is still coming back in a month without having been pressured into it.

## Positioning

Two claims that only hold together:

1. **One app for the whole loop.** SRS, immersion reading with word mining, scripts, listening, lyrics and conjugation drills in one place — instead of Anki plus a reader plus a textbook, stitched together by hand.
2. **Kind by construction.** It rewards effort and *structurally cannot punish you*: no weaponised streaks, no penalties for a wrong answer, no dark patterns.

A retention-driven competitor can copy the first claim. It cannot truthfully copy the second, because its business model depends on the pressure this product refuses.

## Operating Context

- **Offline-first, no backend.** Everything runs in the browser: IndexedDB via Dexie, Zustand state persisted to localStorage. Installs as a PWA. Deployed to GitHub Pages at `https://truemichato.github.io/LangLearn/` under the base path `/LangLearn/`.
- **Phone-first.** Desktop is a deliberately framed phone-width column, not a sprawling dashboard.
- **Sessions are short and interruptible.** A learner may close the app mid-lesson and return two days later; nothing may depend on finishing in one sitting.
- **Multi-language learners are a first-class case.** Someone studying two languages has one current language at a time, and it follows them across every surface rather than being re-picked on each screen.

## The first-run contract

The app owes a beginner a **sequence, not an inventory**: every first-run surface points at exactly one next step, and that step is a *lesson*, never a form.

- Onboarding **hands off into content** — its last step is "pick your starting point" and its button navigates into a lesson. It never ends on the Dashboard.
- The recommendation is derived, not guessed: languages with an unfamiliar script (`ja`, `ru`, `ar`) start at **Letters**; Latin-script languages start at **First words**. The logic lives in `src/lib/starting-points.ts` and is the single source used by onboarding, the zero-data Dashboard, and the Learn hub — so the app never gives three different answers.
- **Zero words is the design centre, not an edge case.** Instrumentation (stats, forecasts, heat maps, badges) stays hidden until there is something to instrument.
- Adding a word manually is an *expert* action. Never make a beginner type 食べる before they have been taught it.

## Capabilities and Constraints

- **Extensible by language.** A new language is content plus a registry entry (`src/lib/languages.ts`). UI must never hardcode "Japanese" or assume a script — including direction: Arabic is RTL.
- **A surface may support a subset of languages.** When it cannot offer the learner's language it says so by name and offers the ones it has; it never silently substitutes a different language.
- **No network dependency at runtime.** Content is fetched from the app's own origin under `import.meta.env.BASE_URL`, and every feature must degrade gracefully offline. No webfonts.
- **Terminology:** learner-facing copy avoids jargon. "SM-2", "SRS" and raw activity keys are internal; the UI says "reviews", "your stats", "Review".
- **Undecided:** whether languages will ever be offered as downloadable packs rather than bundled content.

## Brand Commitments

**Name:** LangLearn. **Three words: Kind · Calm · Capable.**

- **Kind** — encouraging microcopy, gentle color, celebrates effort. The tutor who's always on your side.
- **Calm** — uncluttered, legible, low-stimulation. A focused surface you can use tired.
- **Capable** — genuinely deep (SRS, immersion reading, analytics) without showing off. Quietly competent.

Playfulness shows up as **friendly emoji used as iconography** (a deliberate, owner-endorsed brand choice) and small gamified delights (streaks, badges, XP) — kept warm and low-pressure, never manipulative or loud.

### Named references (the feeling)

- The gentle encouragement of a **good human tutor**.
- The focused daily-habit calm of **Duolingo's best moments**, minus the dark-pattern pressure.
- The information density and trustworthiness of **Anki**, made humane and phone-native.

### Anti-references (what it must NOT feel like)

These are non-negotiable; they map 1:1 to the Don'ts in DESIGN.md.

- **Not "AI slop."** No rainbow card grids, gradient text, colored side-stripe borders, uppercase-tracked eyebrows over every section, bounce/overshoot easing, decorative indigo→violet gradients, or endless stacks of identical equal-weight cards. The app was deliberately rebuilt away from all of these.
- **Not punishing or high-pressure.** No streak-shaming, no aggressive red failure blocks, no guilt-trip nudges, no dark patterns.
- **Not a flashy SaaS landing page.** No hero-metric template, no glassmorphism-as-decoration, no "shouting" display type. This is a tool, not a pitch.
- **Not desktop-first enterprise UI.** It is phone-first; desktop is a deliberately framed phone-width column.

## Evidence on Hand

A solo project with no audience yet.

**Real and citable:**

- Grammar lessons for six languages, each carrying a `## Sources` section — `public/content/grammar/{ja,ru,es,pt,ar,ro}/`.
- 40 vocabulary lessons per language — `public/content/vocab/<lang>/`.
- 10 graded reading texts per language, across three difficulty levels — `public/content/reading/<lang>/`.
- ~625 characters across five scripts — `src/data/alphabets/`.
- Arabic dialect profiles and cross-dialect phrase comparisons — `src/data/dialects/`.
- A live deploy at `https://truemichato.github.io/LangLearn/`.

**Absences future work must never fabricate:** there are **no user counts, no testimonials, no reviews, no press, no case studies, and no benchmarks.** Do not write copy that implies any exist.

## Product Principles

1. **One obvious next action per screen.** Hierarchy over uniformity: a hero action, then grouped rows, then muted metadata. Never fifteen equal cards. A screen that offers a menu instead of a next step has failed, however complete the menu is.
2. **Kindness is a design constraint.** When in doubt between a "correct/incorrect" framing and an "effort/keep-going" framing, choose the latter — in copy *and* color.
3. **Restraint is the brand.** One indigo accent, one system font, tonal depth over shadows. Personality comes from voice and warmth, not decoration.
4. **Phone-first, offline-always.** Every feature must work on a small screen, one-handed, with no network.
5. **Say it, don't substitute it.** When the app cannot do what the learner asked — a language a surface lacks, a deck with nothing due — it names the gap and offers a real alternative. Quietly showing something else is the confusion it exists to remove.

## Accessibility & Inclusion

Accessibility is a **product requirement**, not a nice-to-have (learners use this daily, one-handed, in varied light):

- **WCAG AA contrast is a floor.** Body/label text ≥4.5:1; large/bold ≥3:1. Muted text is `slate-500` (light) / `slate-400` (dark) on the card and frame surfaces — **but slate-500 only clears AA on those.** On a tinted or slate-100 surface (chips, pills, segmented tabs, the indigo start-here card) muted text must be `slate-600` / `slate-300`. Never `text-slate-400` in light mode.
- **Full dark mode** with real `dark:` variants on every surface.
- **Keyboard + screen reader:** visible `:focus-visible` on every control; `aria-label` on icon-only buttons; labels on every input/`<select>`.
- **Touch targets ≥44px.** Base font 18px, user-adjustable.
- **Reduced motion** honored globally.
- **RTL** is a real requirement, not a stretch goal — Arabic ships today.

## Where to look

- **Visual system / tokens / components / rules:** [DESIGN.md](./DESIGN.md) and `.impeccable/design.json`.
- **Architecture, DB schema, conventions:** `AGENTS.md`.
- **Design tokens in code:** `src/index.css` (`:root` / `.dark`).
- **A design detector hook is active** in this repo (`.impeccable/`): it scans UI files after edits and flags anti-patterns. Keep it green.
