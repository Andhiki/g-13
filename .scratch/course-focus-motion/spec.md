Status: completed

## Problem Statement

Selecting a course abruptly replaces its surrounding map with a focused layout. Connected courses jump to new positions while a short camera animation and drawer opening happen separately. Closing the drawer restores the old layout and viewport, producing viewport jank and making it difficult to follow the course the student was inspecting.

## Solution

Make entering and leaving course focus a continuous, coordinated transition in both the peta kurikulum and roadmap kuliah, on desktop and mobile. The selected course glides from its current screen position to the center of the graph area visible beside the side drawer or above the bottom sheet. Directly connected courses glide into the existing focused arrangement while unrelated courses fade away.

Closing preserves the current zoom and the previously selected course's screen position. Connected courses glide back into their normal map arrangement and the rest of the map fades back in around that anchor. Closing does not restore a saved viewport or recenter for the newly available space.

## User Stories

1. As a student, I want the course I click to glide into focus, so that I can visually follow it from the map.
2. As a student, I want the selected course itself centered in the visible graph area, so that it remains the focal point even when its connections are unevenly distributed.
3. As a student, I want directly connected courses to move smoothly into the focused layout, so that I can understand their relationship to the selected course.
4. As a student, I want unrelated courses to fade away, so that focus changes without an abrupt visual cut.
5. As a student, I want connected courses to remain visible through appropriate focus zoom, so that I can inspect prerequisites and dependents together.
6. As a student, I want connections to follow their moving course nodes, so that the graph remains understandable during motion.
7. As a student, I want drawer opening and graph movement to feel coordinated, so that opening course details feels like one action.
8. As a student, I want closing details to preserve my current zoom, so that I do not experience an unexpected zoom reset.
9. As a student, I want the previously selected course to stay fixed on screen when I close details, so that I retain my place in the map.
10. As a student, I want connected courses to glide back and other courses to reappear around that course, so that I can resume exploring the full map.
11. As a student, I want another course selection to redirect movement immediately from its current visible state, so that rapid exploration does not snap or wait for old animations.
12. As a student, I want closing during focus movement to begin unfocusing from the current visible state, so that reversing my action does not cause a jump.
13. As a student using the curriculum map, I want this motion when inspecting courses, so that curriculum exploration maintains visual continuity.
14. As a student using the roadmap, I want the same focus behavior, so that the two graph views feel consistent.
15. As a desktop user, I want focus centered beside the side drawer, so that details do not cover the selected course.
16. As a mobile user, I want focus centered above the bottom sheet, so that the selected course remains visible on a small screen.
17. As a student who prefers reduced motion, I want immediate repositioning while retaining the same final layout and closing anchor, so that I can use course focus without travel animations.

## Implementation Decisions

- Retain the existing focused arrangement of the selected course and its direct prerequisites and dependents. “Mata kuliah terhubung” continues to mean direct relationships, not the transitive prerequisite chain.
- Center the selected course itself, rather than the bounding box of the focused group. Calculate zoom to accommodate connected courses around that anchor in the graph area left visible by course details.
- Coordinate node positions, viewport movement, connection rendering, course visibility, and drawer or sheet motion. Nodes must retain visual identity across the transition rather than disappear and remount at the destination.
- Start every interrupted transition from the currently displayed positions, opacity, and viewport. A new selection supersedes the old destination immediately; a stale completion must not restore an old selection or viewport.
- On every existing drawer dismissal path, preserve the current zoom and the selected course's current screen position, including dismissal during entry motion. Stop any superseded focus camera movement.
- Restore normal map-relative node positions around the closing anchor. A translated map or an equivalent coordinate calculation is acceptable; the observable invariant is a stationary selected course and unchanged zoom throughout closing. Do not animate back to a saved pre-focus camera position.
- Drawer disappearance must not recenter the anchor into the expanded graph area. It stays where it was immediately before closing.
- Keep connections attached to course nodes as they move; restore unrelated nodes and their applicable connections without a final-frame jump.
- Put reusable graph-motion behavior in the shared graph layer; curriculum and roadmap features retain ownership of their layouts and page composition, consistent with the web feature ownership decision.
- Respect prefers-reduced-motion for all participating motion, including the drawer or sheet. Preserve the same final focus and unfocus behavior with immediate updates.
- Begin visual tuning around 400 ms with gentle easing and no bounce. This is a proposed tuning baseline, not an exact timing requirement agreed by the user.
- No curriculum data, URL, persistence, or external API changes are required. Do not preserve the old saved-viewport restoration behavior for compatibility.

## Testing Decisions

- Prefer one high-level seam: interaction with the rendered graph and course details through the existing Playwright browser suite. Exercise both curriculum and roadmap through their real selection and dismissal controls.
- Check observable behavior: selected-course screen bounds, visible related courses, camera zoom, restored map relationships, drawer state, and connected edge endpoints. Avoid assertions about hook state, timer counts, internal animation APIs, or exact intermediate frame counts.
- Sample intermediate course positions during entry and exit to establish actual movement rather than testing only endpoints. Use tolerances for browser rendering and avoid hard-coding an exact duration.
- Verify that closing leaves the selected course stationary and preserves zoom throughout the transition and after settlement, including after any user pan or zoom while focused.
- Cover selecting another course during entry, closing during entry, and selecting again during exit. After settling, only the most recent action may determine the view.
- Cover desktop and phone viewports, both graph views, asymmetric connections, a course with no direct connections, and reduced motion. Reduced motion must reach the same final state without animated travel.
- Use existing map-sharing browser tests as prior art for graph interaction and existing syllabus-animation browser tests as prior art for motion checks. Inspect those tests before implementation rather than assuming their helpers cover this feature.
- Add lower-level tests only if essential coordinate or transition behavior cannot be proved reliably through the rendered interaction seam; do not mirror the implementation with redundant tests.
- The user confirmed these rendered interaction checks: selected-course screen position, zoom stability on close, smooth interruption, and connected edges during movement, across desktop, mobile, and reduced-motion settings in both graph views.

## Out of Scope

- Replacing the existing focused graph arrangement or changing which courses count as connected.
- Restoring pre-focus pan and zoom when closing details.
- Recentering the previously selected course after the drawer closes.
- Adding focus animations to the course list or unrelated views.
- Changing semester navigation, reset controls, manual pan/zoom semantics, or unrelated graph interactions beyond what is required to prevent competing focus animations.
- New course data, prerequisite rules, drawer content, settings, or animation libraries chosen in advance.

## Further Notes

- The final closing decision supersedes the earlier proposal to reverse the camera movement and restore the previous viewport.
- The user confirmed animated rearrangement, smooth redirection, both views and screen sizes, selected-course centering on entry, and a stationary selected-course anchor on exit.
- No new domain term or durable architectural trade-off was identified; no glossary change or ADR is needed for this spec.
