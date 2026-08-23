---
target: Learn experience confirmation
total_score: 33
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-23T08-08-43Z
slug: src-pages-learn-tsx
---
Method: dual-agent (A: learn-design-review · B: learn-detector-evidence)

# Learn experience confirmation critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | Current, locked, completed, and assessment progress are clear. |
| 2 | Match System / Real World | 3 | "Check through" still requires interpretation. |
| 3 | User Control and Freedom | 4 | Back to path, leave confirmation, and refreshed return work well. |
| 4 | Consistency and Standards | 3 | Browse mixes language-specific cards in one inventory. |
| 5 | Error Prevention | 3 | Consequences are clear, but range selection can feel too open-ended. |
| 6 | Recognition Rather Than Recall | 3 | The path is clear; browse and range selection still require scanning. |
| 7 | Flexibility and Efficiency | 4 | Guided, browse, and test-out paths are now intentionally separated. |
| 8 | Aesthetic and Minimalist Design | 3 | Learn is cleaner, but future locked units remain visually long. |
| 9 | Error Recovery | 3 | Failing changes nothing and interruption is protected. |
| 10 | Help and Documentation | 3 | Assessment help is strong; browse modes have limited guidance. |
| **Total** | | **33/40** | **Good** |

## Design Specificity Verdict

**Mostly specific.** The refined surface expresses a clear LangLearn opinion: guided path first, catalog second, and assessment as an informed side path rather than ambient noise.

The deterministic CLI scan returned zero findings across all changed Learn, Browse, path, and assessment markup. Browser evidence found no recurring target-local issue and no console errors. Global shell findings remained outside this target.

## Resolved Original P1 Issues

- Repeated future test-out noise: resolved through one progressive mastery-check entry.
- Path-context loss: resolved through assessment preview, Back to path, interruption confirmation, return navigation, and focus restoration.
- Inline catalog overload: resolved by moving the catalog and resources to `/learn/browse`.

## Remaining Issues at This Checkpoint

- **P1:** Future locked units remain too exposed.
- **P1:** The dual-select mastery chooser asks for too much interpretation.
- **P2:** Browse remains a dense equal-weight catalog.
- **P2:** Numeric progress could be warmer.

The two P1 findings were addressed immediately after this confirmation run by collapsing future units behind an explicit route disclosure and replacing dual selects with track buttons plus three plain-language scope presets. Exact-unit selection remains available behind a secondary disclosure.

## Persona Notes

- An anxious beginner benefits from one current unit and kind assessment framing.
- A goal-driven learner can reach the dedicated activity browser without competing with the path.
- Arabic mobile layout preserves mirrored path geometry and direction.
