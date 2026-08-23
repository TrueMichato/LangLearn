---
target: Learn experience
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-23T07-59-02Z
slug: src-pages-learn-tsx
---
Method: dual-agent (A: learn-design-review · B: learn-detector-evidence)

# Learn experience critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Path progress is clear, but test-out scope and consequences are not previewed before entry. |
| 2 | Match System / Real World | 3 | The tone is friendly, while "Test Vocabulary/Grammar" feels colder and less self-explanatory. |
| 3 | User Control and Freedom | 2 | Active assessments lack a prominent exit and do not reliably return learners to the path. |
| 4 | Consistency and Standards | 3 | Shared styling is coherent, but locked future units expose active test-out controls. |
| 5 | Error Prevention | 2 | Many skip-ahead assessments are available without enough framing or guardrails. |
| 6 | Recognition Rather Than Recall | 3 | Nodes are legible, but learners must infer that checkpoints cover every incomplete lesson through that unit. |
| 7 | Flexibility and Efficiency | 2 | Browse all supports experts, but its fourteen equal-weight choices recreate the old catalog. |
| 8 | Aesthetic and Minimalist Design | 2 | The path starts focused, then becomes a long repeated wall with a second navigation system below it. |
| 9 | Error Recovery | 3 | Loading and blocked states are kind; interrupted assessment recovery is weaker. |
| 10 | Help and Documentation | 2 | Locking and test-out behavior receive too little contextual explanation. |
| **Total** | | **25/40** | **Acceptable - significant improvements needed** |

## Design Specificity Verdict

**Partially specific.** The sequence-first path, kind copy, language-aware routing, and script prerequisites feel authored for LangLearn. The checkpoint labels, Browse all inventory, and downstream assessment transition are more category-interchangeable and pull the experience back toward a generic course catalog.

The deterministic CLI scan returned **0 findings** across `Learn.tsx`, `LearningPath.tsx`, `PathNode.tsx`, and `PathCheckpoint.tsx`. Browser overlays found one recurring target-local issue: tight line-height in expanded activity-card subtitles. Other overlay findings were global shell/design-system signals or likely detector interference rather than regressions in this target. Live overlays were injected successfully in the isolated browser review.

## Overall Impression

The first screen has the right product idea: one calm recommendation in a clear sequence. The largest opportunity is to protect that idea all the way through the page and into assessments instead of exposing every shortcut and catalog choice at once.

## What's Working

- The "Up next" hierarchy and kind, non-punitive copy fit the product promise.
- Current, completed, and locked path states are easy to distinguish.
- Explicit language curricula, unavailable states, and RTL mechanics make the path robust across shipped languages.

## Priority Issues

### P1 - Future test-outs break the one-next-step promise

**Why it matters:** Learners encounter many optional tests while still being guided toward one current lesson. First-timers may read skipping as expected behavior rather than an expert shortcut.

**Fix:** Present one contextual "Check what you already know" action near the current unit. Hide future checkpoints until they are relevant, or place range selection behind that single action.

**Suggested command:** `/impeccable distill`

### P1 - Test-out transition severs path context

**Why it matters:** Entering an assessment abruptly replaces the guided experience. There is no prominent exit, and completion or interruption does not reliably return the learner to Learn.

**Fix:** Carry a Learn-origin return target into the assessment, show a persistent "Back to path" action, preserve in-progress confirmation semantics, and return to the newly unlocked node after success.

**Suggested command:** `/impeccable harden`

### P1 - Browse all recreates the inventory the path was meant to replace

**Why it matters:** Fourteen equal-weight activities beneath the path dilute the primary sequence, increase scroll depth, and create a second information architecture on the same page.

**Fix:** Keep Learn focused. Replace the full inline catalog with a compact grouped browse gateway or move the catalog to a dedicated route while preserving every existing activity.

**Suggested command:** `/impeccable distill`

### P2 - Checkpoint language is generic and underspecified

**Why it matters:** "Test Vocabulary" and "Test Grammar" do not explain the covered range, what passing changes, or that no lesson XP is awarded.

**Fix:** Use kind, plain-language framing such as "Check what you already know," show the exact scope, and explain that passing marks those lessons complete without normal lesson XP.

**Suggested command:** `/impeccable clarify`

### P2 - RTL is mechanically mirrored rather than fully composed

**Why it matters:** Reversed arrows and rows are correct, but Arabic still reads like an adapted LTR path rather than an authored RTL study sequence.

**Fix:** Review alignment, connector rhythm, badge placement, title wrapping, and assessment-entry direction as one RTL composition.

**Suggested command:** `/impeccable adapt`

## Cognitive Load

The experience fails five load checks: single focus, one thing at a time, minimal choices, working-memory demand, and progressive disclosure. The largest decision points are the six-language first-run chooser, fourteen expanded Browse all activities, and repeated future test-out choices across the path.

## Emotional Journey

The page begins calm and reassuring, peaks at the emphasized next action, then loses confidence as future tests and the full catalog accumulate. The assessment entry feels more evaluative than companion-like, and the end state is weaker than the beginning because the return to the path is not guaranteed.

## Persona Red Flags

- **Jordan, first-time learner:** Future "Test" links can imply that skipping is expected or safer than following lessons.
- **Sam, keyboard or assistive-technology user:** The long linear tab order grows substantially when Browse all expands, and an active assessment lacks an obvious escape hatch.
- **Casey, distracted mobile learner:** Deep scrolling, abrupt quiz entry, and weak return behavior make interruption recovery difficult.

## Minor Observations

- Completed nodes are useful revisit links, but revisit and progress actions are not strongly differentiated.
- Recommended resources on the same screen further dilute the primary learning action.
- The recurring target-local detector signal is tight line-height in Browse all subtitles.

## Questions to Consider

- If Learn owes a beginner a sequence, why are future skip controls visible before the learner asks for them?
- Should Browse all be a destination rather than a second hub embedded inside Learn?
- When a learner enters from Learn, should every downstream screen guarantee a return to Learn?
