## Problem Statement

The current header and filter bar take space away from the curriculum map and make the app feel like a conventional website rather than a focused, full-screen map.

## Solution

Make the map fill the screen and place only its essential controls along the edges: search, light/dark mode, curriculum selection, zoom, and filters. Keep the interface nearly minimal and focused on using the map.

## User Stories

1. As a student, I want the map to fill the available screen, so I can see more of the curriculum at once.
2. As a student, I want to search for a course from the map, so I can find it without navigating away.
3. As a student, I want search results to take me to the selected course, so I can inspect its place in the map.
4. As a student, I want to switch between light and dark mode, so I can use the map comfortably in different environments.
5. As a student, I want to choose a curriculum version, so I can explore the version relevant to me.
6. As a student, I want zoom controls near the map, so I can adjust the view without losing context.
7. As a student, I want to filter by semester or course group, so I can focus on the part of the curriculum I need.
8. As a student, I want controls to stay out of the way of course nodes, so I can interact with the map unobstructed.
9. As a student using a phone, I want the controls to remain usable without taking over the map, so I can explore on a small screen.

## Implementation Decisions

- Keep the existing curriculum-map canvas and its search, theme, curriculum, zoom, and filter behavior.
- Replace the stacked header and filter rows with compact controls positioned at screen edges.
- Do not add product identity treatment or source-information display.
- Keep controls visually restrained and make map usability the priority.
- Avoid combining uppercase text with letter spacing; prefer sentence case and minimal decoration.
- Adapt control placement for phone-sized screens so the map remains usable and controls do not obscure important content.

## Testing Decisions

- No tests for this UI-only change, as requested.

## Out of Scope

- Adding product branding or identity elements.
- Showing source information.
- Changing curriculum data, course relationships, or map semantics.
- Adding map features beyond the listed controls.

## Further Notes

- The agreed test seam was app-level interaction, but automated tests are explicitly out of scope for this change.
