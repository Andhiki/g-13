# 003 — Check course list transition performance
- **Status**: TODO
- **Commit**: c96956c
- **Severity**: MEDIUM (potential)
- **Category**: Performance
- **Estimated scope**: investigation; implementation only if evidence warrants it

## Problem
`apps/web/src/features/curriculum/CurriculumPage.tsx:123` transitions padding when details open:

```tsx
transition-[padding] duration-200 ease-out motion-reduce:transition-none
```

The selected state changes left padding on desktop and bottom padding on mobile. This causes layout, but code inspection alone cannot establish visible jank. The adjacent details panel uses a 400 ms transition in `apps/web/src/courses/CourseDetails.tsx:78`.

## Target and steps
1. Run the app with a populated curriculum in list view. Record performance traces while opening and closing details on desktop and on a narrow viewport, including a throttled CPU. Observe dropped frames, layout cost, text reflow and alignment with the details panel. Repeat enough times to distinguish noise; record environment and observations.
2. If the transition is smooth, keep it and report the evidence. If it visibly janks, first compare removing `transition-[padding] duration-200 ease-out` with the current behavior. Retain the selected padding values and `motion-reduce` behavior. Choose the simpler option only if the visual result remains acceptable; do not invent a transform that scales or obscures course content.
3. If neither is acceptable, report the findings and tradeoff before changing the layout. Preserve scrolling, sheet clearance and course selection.

## Boundaries
Do not change graph animations, introduce dependencies, or claim a speedup from a single trace. If the code has drifted, stop and report.

## Verification
Feel-check opening, closing and rapid reselection at normal speed and 10% playback, desktop and mobile, with reduced motion enabled and disabled. If code changes, run `bun run check` and `bun run build`, manually verify UI as required by CONTRIBUTING.md, and add an Indonesian Unreleased changelog entry. Done means either evidence supports leaving the transition alone, or a verified change addresses observed jank.
