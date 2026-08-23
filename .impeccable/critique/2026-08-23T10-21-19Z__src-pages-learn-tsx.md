---
target: Learn continuity
total_score: 37
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-23T10-21-19Z
slug: src-pages-learn-tsx
---
Method: dual-agent (A: learn-final-design-a · B: learn-final-evidence-b)

# Learn continuity post-implementation critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Unit, question, saved-draft, and result states are explicit and semantic. |
| 2 | Match System / Real World | 4 | Learner-facing copy now uses plain language such as “check” and “how much.” |
| 3 | User Control and Freedom | 4 | Attempts survive navigation and offer clear Resume or Start over choices. |
| 4 | Consistency and Standards | 4 | Learn, Curriculum, Browse, dark mode, and Arabic layouts follow the shared system. |
| 5 | Error Prevention | 4 | Fixed-nav clearance and durable drafts prevent blocked controls and lost work. |
| 6 | Recognition Rather Than Recall | 4 | The current unit, next step, prerequisites, and resumed question are named. |
| 7 | Flexibility and Efficiency | 3 | Progressive disclosure works, but the expanded mastery chooser remains dense. |
| 8 | Aesthetic and Minimalist Design | 3 | The daily path is calm; Curriculum intentionally exposes the full course on demand. |
| 9 | Error Recovery | 4 | Save, blocked, fail, and malformed-draft states explain what happened and what to do. |
| 10 | Help and Documentation | 3 | Inline guidance is strong, though there is no separate help affordance. |
| **Total** | | **37/40** | **Excellent — no P0 or P1 findings remain.** |

## Design Specificity Verdict

**Strongly product-specific.** The calm next-step path, kind no-penalty assessment language, script-aware progression, local interruption recovery, and restrained milestone framing feel authored for LangLearn rather than copied from a generic course dashboard.

The deterministic CLI detector reported two `ai-color-palette` warnings in `Shell.tsx`. Both are false positives: DESIGN.md explicitly defines indigo as LangLearn’s only accent. Browser detector noise for the global shell was likewise unrelated to the scoped source. Fresh live checks found no horizontal overflow, sub-44px controls, console errors, fixed-nav interception, or Arabic direction failures.

## Overall Impression

The shaped release now makes the original calm-path promise mechanically true. Daily Learn stays focused, Curriculum and Browse carry optional depth, and mastery checks can be safely interrupted without losing question or answer state. The remaining opportunities are low-severity product-tuning questions, not release blockers.

## What’s Working

1. **Interruption-safe assessment flow:** generated questions, position, score, and selected answer resume exactly after navigation or refresh.
2. **Clear information architecture:** Learn presents one current milestone; Curriculum handles planning; Browse prioritizes a useful continuation before the catalog.
3. **Inclusive interaction craft:** semantic progress/results, disabled answered choices, 44px controls, dark-mode parity, and span-level Arabic direction all work in live inspection.

## Priority Issues

### [P2] Power-user planning is available on the first day

**Why it matters:** A brand-new learner can intentionally open the full 26–27-step curriculum before completing the first lesson, which may feel larger than the daily path.

**Fix:** Keep the current opt-in link, but consider showing unit-level milestones rather than the full step total for zero-progress learners if usage evidence shows anxiety or abandonment.

**Suggested command:** `/impeccable onboard`

### [P2] The expanded mastery chooser remains information-dense

**Why it matters:** Lesson type, three range presets, and an optional exact-unit selector make the expanded expert tool slower to scan than the rest of Learn.

**Fix:** Preserve the collapsed entry, then consider revealing the exact-unit selector only after choosing its preset.

**Suggested command:** `/impeccable distill`

### [P3] Deep-linked future completions are visible mainly in Curriculum

**Why it matters:** An unusual direct `?testOut=` link can complete a future lesson that the compact daily preview does not name.

**Fix:** If deep links become user-facing, surface a quiet “completed ahead” note in the current-unit summary.

**Suggested command:** `/impeccable clarify`

## Cognitive Load

The primary Learn surface has one clear next action and no decision point above four peers. Browse exposes one recommendation plus three collapsed groups. Curriculum presents nine collapsed unit summaries only after an explicit planning action. The mastery chooser is the sole dense state, and it is collapsed by default.

## Emotional Journey

Entry feels calm and purposeful. Assessments explain the stakes before starting, reassure the learner that misses change nothing, save work without interruption, and end with encouraging pass or fail language. The result is consistent with “The Kind Study Companion.”

## Persona Red Flags

**Anxious beginner:** The optional full-curriculum total may still emphasize distance if opened too early, but it no longer crowds the daily path.

**Goal-driven learner:** Browse recommendations, recent activity, exact mastery ranges, and durable resume now support fast return without sacrificing clarity.

**Arabic learner:** Target answers use explicit RTL direction and right alignment; Curriculum rows and progression arrows now mirror consistently while English instructional chrome remains readable.

## Minor Observations

- The full-page screenshot overlap reported during assessment was stitching behavior, not a live fixed-nav defect.
- Detector palette warnings conflict with the repository’s explicit one-indigo design rule and are false positives.
- The successful-result XP footnote now exceeds WCAG AA in both light and dark tinted states.

## Questions to Consider

- Should zero-progress learners see the total number of course steps, or only the number of units?
- Is exact-unit mastery selection common enough to deserve a second-stage reveal?
- If future lesson deep links become shareable, where should “completed ahead” progress appear?
