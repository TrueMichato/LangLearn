---
target: expanded guided learning paths
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T13-47-33Z
slug: src-components-learn-learningpath-tsx
---
Method: dual-agent (A: path-design-assessment · B: path-detector-assessment)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Current progress is clear, but Full path lacks a useful phase/unit position and repeats several counters inside forks. |
| 2 | Match System / Real World | 3/4 | Choosing which required track to do first is understandable; generated “Build on …” labels sound mechanical rather than learner-centered. |
| 3 | User Control and Freedom | 3/4 | Current/Full switching, jump-to-current, revisiting, and test-out are strong; long paths lack section-level jump controls. |
| 4 | Consistency and Standards | 3/4 | Branch behavior is consistent, but the decorative rejoin lock reuses the same symbol as genuinely locked lessons. |
| 5 | Error Prevention | 3/4 | Locked nodes are non-interactive and test-out is safe; very large test-out scopes need clearer expectation-setting. |
| 6 | Recognition Rather Than Recall | 2/4 | Repeated generated titles and long runs of structurally identical units make future locations hard to recognize. |
| 7 | Flexibility and Efficiency | 2/4 | Full path preserves access to everything, but 24–63 units need phase landmarks and direct navigation. |
| 8 | Aesthetic and Minimalist Design | 2/4 | The current view is calm; Full path gives locked nodes too much visual weight and branch rows drift out of alignment. |
| 9 | Error Recovery | 3/4 | Kind, non-punishing copy and safe test-out behavior support recovery well. |
| 10 | Help and Documentation | 2/4 | Useful strand descriptions are hidden from sighted learners, while fork copy is less direct than the behavior. |
| **Total** | | **26/40** | **Acceptable — significant refinements needed** |

## Design Specificity Verdict

**LLM assessment:** The branch mechanic is genuinely product-specific: two required learning tracks open together, one calm recommendation remains, and both rejoin before progression. The weakness is the continuation layer around it. Sixteen authored forks use coherent content, but their parent headings are often more abstract than the strand headings. Generated units then dominate long paths with repeated “Build on …” labels, making the experience feel composed by catalog batching rather than by a kind tutor.

**Deterministic scan:** The CLI detector returned `[]` with exit code 0. Runtime detection reported five signals. `radial-spotlight-glow`, `ai-color-palette`, and `single-font` are false positives against LangLearn’s documented design system. `nested-cards` is also not actionable here: the learning path is one bordered container with divided sections and rounded controls, not rounded content cards nested inside cards. `flat-type-hierarchy` is directionally useful and agrees with the manual finding that locked lesson titles remain too prominent.

**Visual overlays:** Injection succeeded and overlays rendered in a temporary fresh tab, but that tab was closed during assessor cleanup, so no user-visible overlay remains. Browser evidence found no horizontal overflow and no interactive targets under 44px at phone width.

## Overall Impression

The current-unit experience is calm, technically careful, and faithful to “The Kind Study Companion.” The new forks add meaningful flexibility without compromising progression. The main opportunity is to make Full path an orientation tool rather than a raw catalog: preserve every inline milestone, but add phase structure, clearer generated labels, stronger state hierarchy, and correct RTL path geometry.

## What’s Working

1. **One recommendation, real freedom:** exactly one step is marked “Up next,” while the sibling track remains immediately actionable.
2. **Kind and reversible:** “Also available,” safe test-out behavior, revisitable completed lessons, and Current/Full switching avoid punishment or irreversible choices.
3. **Careful interaction engineering:** expansion preserves viewport position, reduced motion is honored, focus is restored deliberately, and live announcements explain view changes.

## Priority Issues

### [P1] Arabic winding connectors do not follow their mirrored nodes

**Why it matters:** The visual path metaphor breaks for Arabic learners: node alignment is mirrored with `flex-row-reverse`, but connector X coordinates remain tied to left-origin offsets. The curves can float far from their markers.

**Fix:** Derive connector coordinates from the mirrored marker position or use an RTL-aware coordinate transform; switch winding text alignment to logical start alignment and validate the real Arabic layout at 390×844.

**Suggested command:** `/impeccable audit`

### [P1] Full path is too long to orient within

**Why it matters:** Japanese reaches 24 units and Arabic reaches 63. Compact unit chrome helps, but repeated “Build on …” headings, duplicate first-lesson naming, and one continuous scroll still make future content hard to recognize.

**Fix:** Keep every milestone inline, but introduce 3–5 content-aware phase landmarks with direct jump controls. Replace generated “Build on …” names with short paired-topic labels and add current phase/unit position to the sticky toolbar.

**Suggested command:** `/impeccable shape`

### [P2] Fork hierarchy spends space on redundant status

**Why it matters:** The parent progress summary plus two strand counters repeats the same information, while locked lesson titles retain the same bold ink as actionable steps.

**Fix:** Keep one unit-level completion summary, demote locked titles to muted medium weight, and reserve bold/indigo emphasis for available and recommended work.

**Suggested command:** `/impeccable distill`

### [P2] Branch rows drift and explanatory copy is hidden or indirect

**Why it matters:** Independent strand lists develop 35px+ row drift when one status wraps, weakening the visual rejoin. Sighted learners cannot see the useful strand descriptions, and “Choose either path first” is less direct than the actual behavior.

**Fix:** Use a shared two-column row grid or reserve equal metadata height. Show one concise strand description and say: “Both tracks are open. Finish both to unlock the next unit.” Place the rejoin explanation directly with the fork.

**Suggested command:** `/impeccable layout`

### [P2] Large mastery checks need clearer bounds

**Why it matters:** “Go furthest” can mean dozens of lessons, and the specific-unit selector inherits repetitive generated unit names.

**Fix:** Express scope in bounded phase terms, include lesson count and approximate effort before launch, and retain “Start small” as the default.

**Suggested command:** `/impeccable clarify`

## Persona Red Flags

**First-time Arabic learner:** Current view is reassuring, but the winding connector geometry can make the path look broken. Opening Full path reveals dozens of future locked steps without enough phase-level reassurance.

**Returning mobile learner:** The learner can switch back to Current and jump to the recommendation, but cannot jump to a remembered future phase; fork row drift makes peer steps feel less connected than they are.

**Experienced learner testing out:** Safe test-out behavior is excellent, but a large “Go furthest” scope and repetitive unit names make it difficult to choose an appropriate checkpoint confidently.

## Minor Observations

- The decorative rejoin lock should not reuse the same glyph as a genuinely locked lesson.
- Strand descriptions are currently more useful than many parent descriptions but are `sr-only`.
- The sticky Full path controls are strong, but phase position would make them substantially more useful.
- Phone overflow, dark mode, contrast, touch targets, focus-visible treatment, and the single-accent palette are all strong.

## Questions to Consider

1. Can Full path remain fully inline while becoming a map through phase landmarks rather than a corridor of units?
2. Should generated unit labels describe the two most salient topics instead of repeating the first lesson?
3. Which progress figure actually helps at a fork: whole-unit completion, per-track completion, or both?
4. Can the branch visually communicate “order is your choice, completion is shared” without a decorative lock?
