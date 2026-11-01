# 001 — Remove the view switch spin
- **Status**: TODO
- **Commit**: c96956c
- **Severity**: HIGH
- **Category**: Purpose and frequency
- **Estimated scope**: one file

## Problem
`apps/web/src/features/curriculum/components/ViewSwitch.tsx:33` increments `turns` on every activation, including the V shortcut. The icon spins for 400 ms:

```tsx
setTurns((value) => value + 1);
onViewChange(view === "map" ? "list" : "map");
// ...
<m.span className="flex" aria-hidden="true" initial={false}
  animate={{ rotate: turns * 360 }}
  transition={{ duration: reducedMotion ? 0 : 0.4, ease: "easeOut" }}>
```

## Target and steps
Remove the spin for all activation methods: render the existing icon in a plain `span` with `className="flex"` and `aria-hidden="true"`; retain the view change, label, pressed state and tooltip. Remove the unused state, reduced-motion hook and Motion imports. The existing plain icon in `apps/web/src/graph/Overlay.tsx` provides a markup precedent.

## Boundaries
Do not alter shortcut handling, other animations or dependencies. If the code has drifted, stop and report.

## Verification
Run `bun run check` and `bun run build`. In the running app, switch views by button and V repeatedly: the view and label update immediately without a spin. Check with reduced motion enabled too. Verify visually at normal and 10% animation playback. Do not add UI tests; CONTRIBUTING.md calls for manual UI verification. Add an Indonesian Unreleased changelog entry for the user-visible change.
