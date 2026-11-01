# 002 — Refine map control panel motion
- **Status**: TODO
- **Commit**: c96956c
- **Severity**: MEDIUM
- **Category**: Performance and physicality
- **Estimated scope**: one component, plus changelog

## Problem
`apps/web/src/graph/Overlay.tsx:133` animates layout on every toggle:

```tsx
animate={{ width: open ? width : 40, height: open ? "auto" : 40 }}
transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.25 }}
```

At line 165 the icon scales to `0.25`. Layout work may be visible on busy graphs; confirm with a performance trace before claiming an improvement.

## Target and steps
Keep the outer panel at its open dimensions and reveal it from the top right using a clipped or transform-based inner surface, retaining a fixed 40px toggle hit target. Use an interruptible transition, 200 ms and `cubic-bezier(0.23, 1, 0.32, 1)` for entry; preserve the existing opacity reveal and reduced-motion duration of 0. Change icon scale from `0.25` to `0.9` and use 200 ms ease-out. Ensure the closed panel does not intercept pointer events outside the toggle, and its contents remain inert and hidden from accessibility APIs. Maintain Escape and focus behavior. Existing `useReducedMotion()` and `inert={!open}` in this component are the conventions to retain.

## Boundaries
Do not change the compact filter drawer, graph state or add dependencies. If clipping or transforms cannot preserve the controls' usable layout and hit testing, stop and report the tradeoff rather than shipping a broken control. If the source has drifted, stop and report.

## Verification
Run `bun run check` and `bun run build`. In the app exercise filter and zoom panels with pointer and shortcuts, including rapid reversal and Escape; check focus, hit targets, clipping and the closed panel's click-through area. Inspect normal speed and 10% playback, and verify reduced motion. Record a browser performance trace on a populated graph before and after; report layout and frame observations without claiming a speedup unless the traces support it. Follow CONTRIBUTING.md for manual UI verification and add an Indonesian Unreleased changelog entry.
