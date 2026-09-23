# Wolverine interface

The health app uses warm white surfaces, navy text, soft blue accents, and pastel 3D companion portraits. The shared theme is in `src/components/health/refinement.css`; layout and interaction rules remain in `health.css`.

- One clear primary action in the first-use daily briefing.
- Show a useful explanation and connection action before daily signals exist. Never fill empty health metrics with invented values.
- Use the same sans-serif typography, surfaces, controls, and focus indicators across Today, agent, activity, journal, memory, connections, and dialogs.
- Keep character choice secondary to the daily action, with a larger interactive portrait and a visible fallback while WebGL loads.
- On mobile, preserve the bottom navigation, keyboard-aware chat layout, and minimum 44px action targets.
- Demo data remains explicitly labeled and separate from personal records.

Visual review covers a 390px mobile viewport, the character picker, agent screen, More menu, and a desktop layout. Build validation is recorded in the release notes when shipped.

The companion picker includes Kai, an original anime-style human built in Blender, alongside the three mascots. Kai is the default for new preferences. The selected character appears in Today and the agent avatar/welcome. Mobile selection tiles use two columns and the human preview receives a taller frame. Poster images are explicitly constrained to their reserved frame during GLB loading.
