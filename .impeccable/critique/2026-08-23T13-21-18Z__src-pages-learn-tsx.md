---
target: guided Learn experience
total_score: 38
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
timestamp: 2026-08-23T13-21-18Z
slug: src-pages-learn-tsx
---
Method: dual-agent (A: learn-release-critique-a · B: learn-release-critique-b)

# Guided Learn accessibility and continuity critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 4 | Progress, saved state, feedback, and focus transitions are explicit. |
| 2 | Match system / real world | 4 | Copy is plain, honest, and kind. |
| 3 | User control and freedom | 4 | Resume, restart, and exit remain available. |
| 4 | Consistency and standards | 3 | Programmatic focus intentionally uses `focus:` rather than the global `focus-visible:` convention. |
| 5 | Error prevention | 4 | Autosave and answer locking preserve the attempt without double writes. |
| 6 | Recognition rather than recall | 4 | Answered-draft resume restates position, prompt, saved answer, and correctness. |
| 7 | Flexibility and efficiency | 4 | Pointer, keyboard, resume, and expert-ahead paths converge cleanly. |
| 8 | Aesthetic and minimalist design | 4 | New context is quiet or screen-reader-only; no extra card chrome was added. |
| 9 | Error recovery | 4 | Misses and persistence failures remain encouraging and actionable. |
| 10 | Help and documentation | 3 | In-context guidance is sufficient, though ahead-credit provenance is available only in Curriculum. |
| **Total** |  | **38/40** | **Excellent** |

## Design Specificity Verdict

The result feels authored for LangLearn rather than interchangeable app polish. It uses the product's single indigo accent, slate ramp, kind amber feedback, 44px controls, full-border cards, quiet progress copy, and existing RTL path conventions. The assessment focus loop and ahead-credit acknowledgment directly support the "Kind Study Companion" promise.

The deterministic scan returned **0 findings** across `Learn.tsx`, `LessonAssessment.tsx`, `GrammarQuiz.tsx`, `LearningPath.tsx`, and `BrowseActivities.tsx`. No reliable user-visible overlay was available in the final immutable evidence pass because the live overlay configuration was unavailable; browser inspection and DOM/accessibility evidence completed successfully instead.

## Overall Impression

The guided Learn flow is release-ready. Question transitions now orient keyboard and screen-reader users, answered drafts resume with full context, expert credit is acknowledged without weakening prerequisites, and Browse remains bounded to four choices per disclosure.

## What's Working

1. **Self-orienting assessment loop:** fresh and advanced questions focus a visibly outlined prompt; answering announces one polite atomic status and moves focus to a visibly outlined Next or See results action.
2. **Honest resume continuity:** an answered draft keeps its action-focused resume behavior while `aria-describedby` supplies question position, prompt, saved answer, and correctness.
3. **Calm progressive disclosure:** Browse renders groups of 4/3/4/2 at the largest Arabic capability set, while completed-ahead credit stays quiet and never changes the current guided step.

## Priority Issues

### [P2] Document the programmatic-focus exception

**Why it matters:** The prompt and Next action deliberately use unconditional `focus:` rings so app-moved focus remains visible after pointer and keyboard input. That differs from the normal global `focus-visible:` convention and could be accidentally reverted.

**Fix:** Treat this as a narrow assessment-flow convention if the pattern spreads; no release code change is required.

**Suggested command:** `/impeccable document`

### [P3] Resume feedback may be mildly repetitive for some screen readers

**Why it matters:** The restored answer feedback and the resume-only action description can both state correctness. The repetition favors orientation over terseness, but may feel verbose.

**Fix:** Observe with real assistive-technology testing before suppressing either source; preserve the complete action description unless evidence favors a shorter version.

**Suggested command:** `/impeccable audit`

### [P3] Ahead credit identifies a count, not specific lessons

**Why it matters:** A learner with several future completions must open Curriculum to identify them.

**Fix:** Keep the Learn surface quiet; only add inline lesson names if real usage shows counts commonly grow beyond one or two.

**Suggested command:** `/impeccable clarify`

## Persona Red Flags

- **Keyboard-only learner:** no blocking red flags; prompt and action focus remain visible and deterministic.
- **Screen-reader learner:** no blocking red flags; feedback, progress value text, and answered-draft context are exposed.
- **Arabic learner:** no blocking red flags; target options retain RTL metadata and the curriculum link mirrors its row and arrow.

## Minor Observations

- Browser evidence showed no console errors or horizontal overflow in dark mobile mode.
- The final detector scan found no file-scoped design-system violations.
- The progressbar's `aria-valuetext` is correct in the DOM even when DevTools omits it from a compact accessibility snapshot.

## Questions to Consider

- Should unconditional focus rings become a named convention for all programmatically focused controls?
- If ahead counts routinely exceed two, should Curriculum expose a direct anchor from the acknowledgment?

**Release assessment:** P0 0 · P1 0.
