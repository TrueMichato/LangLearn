---
target: guided path phase navigation
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-08-24T20-25-12Z
slug: src-components-learn-learningpath-tsx
---
Method: dual-agent (A: phase-map-design-review · B: phase-map-detector-review)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Node states are clear, but the sticky Full-path toolbar reports the learner's saved position while they may be viewing another phase. |
| 2 | Match System / Real World | 4/4 | Phases, units, strands, and mastery checks map naturally to how learners understand a course. |
| 3 | User Control and Freedom | 3/4 | Current/Full switching, phase jumps, replay, preview, and test-out are strong; long phases need more efficient local navigation. |
| 4 | Consistency and Standards | 4/4 | Controls, states, branch behavior, RTL, light/dark treatment, and hierarchy are consistent. |
| 5 | Error Prevention | 4/4 | Locked nodes are inert, mastery checks explain XP consequences, and focus/live announcements are deliberate. |
| 6 | Recognition Rather Than Recall | 2/4 | The toolbar can silently disagree with the visible phase, forcing learners to remember where they scrolled. |
| 7 | Flexibility and Efficiency | 3/4 | Phase fast-travel and bounded test-out scopes help, but 24–63-unit paths still need better local orientation without hiding content. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Current view remains calm; deep Full view becomes repetitive as generated continuation units accumulate. |
| 9 | Error Recovery | 4/4 | Kind, specific unlock guidance and reversible navigation support recovery well. |
| 10 | Help and Documentation | 2/4 | Full path, phase navigation, and mastery checks have no lightweight first-use explanation. |
| **Total** | | **32/40** | **Strong foundation with focused refinements needed** |

## Design Specificity Verdict

**Conditionally specific.** Current view, required parallel strands, the rejoin model, and kind progress copy are recognizably LangLearn. Specificity weakens deep in long paths because generated units inherit the same visual and narrative weight as authored units, and some paired-topic titles read like catalog concatenation rather than a tutor's progression.

**Deterministic scan:** The target scan returned no LearningPath-specific findings. Fresh current-source browser evidence showed no overflow at 390×844 or framed desktop, correct Arabic RTL branch direction and CTA arrows, correct connector geometry, clean dark/light presentation, and no console errors or warnings. The stale 4173 preview that lacked phase controls and used obsolete path geometry was excluded.

## Overall Impression

The phase-map work moved Full path from a long corridor toward a genuine curriculum map and improved the prior score from 26/40 to 32/40. The primary remaining flaw is conceptual rather than decorative: the sticky navigator conflates the learner's saved course position with the content under their eyes. Full path should behave like a map with a persistent compass.

## What's Working

1. **Calm default, complete map:** Current view gives one obvious next action; Full path keeps every completed and future milestone inline, replayable, and previewable.
2. **Meaningful learner agency:** Parallel required strands open together, progress independently, and clearly rejoin without creating competing recommendations.
3. **Strong interaction engineering:** Full/Current switching, phase jumps, focus restoration, live announcements, reduced-motion handling, and 44px targets are sound.

## Priority Issues

### [P1] Separate "Your position" from "Now viewing"

After jumping to Phase 2, the focused Phase 2 heading appeared correctly, but the sticky toolbar still read "Phase 1 of 4 · Unit 1 of 25." The interface contradicts the visible content exactly when a returning planner needs orientation most.

**Fix:** Observe the existing phase/unit landmarks while scrolling. Make `Now viewing` the primary toolbar context, preserve `Your position` as secondary context, and provide a clear `Back to your position` action. Announce deliberate jumps, but not passive scrolling.

### [P2] Improve long-phase orientation without hiding milestones

Arabic has 63 units and five phases; Japanese has 24 units and four. Phase landmarks help, but a phase can still contain many similar continuation units.

**Fix:** Keep every milestone inline while adding phase-local unit position, phase progress, and previous/next phase movement. Do not collapse, filter, paginate, or virtualize generated units.

### [P2] Give generated units a more authored voice

Deterministic paired-topic labels are better than `Build on ...`, but unrelated first topics can still create awkward titles.

**Fix:** Use authored phase vocabulary plus one coherent representative lesson theme. Keep labels stable, short, language-aware, and shared with mastery-check choices.

### [P3] Explain the map once, inline

First-time learners must infer how Current view, Full path, replay, preview, phase navigation, and mastery checks relate.

**Fix:** Add one compact, dismissible inline explanation on first Full-path reveal. Do not use a modal or tour.

## Persona Red Flags

- **Returning planner:** needs scroll-synced viewing context and an explicit route back to their real place.
- **First-time learner:** is well served by Current view, but benefits from one quiet Full-path explanation.
- **Arabic learner:** the long five-phase path is technically sound in RTL, making local phase orientation and coherent generated naming especially important.

## Minor Observations

- Do not collapse generated units or hide completed/future milestones; this violates the explicit product requirement.
- Do not reinterpret Content font size as global UI scaling; it intentionally applies to lesson and target-language content.
- Preserve the current single-accent, slate-neutral, full-border card treatment.

## Questions to Consider

1. Can the sticky navigator make the content under the learner's eyes primary while keeping their saved position one action away?
2. Can long phases become easier to traverse without creating a second navigation surface?
3. Can generated units borrow the voice of authored phases instead of forcing unrelated lesson topics into one label?
