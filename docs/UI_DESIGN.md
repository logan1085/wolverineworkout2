# Wolverine interface

The health app uses warm white surfaces, navy text, soft blue accents, and pastel 3D companion portraits. The shared theme is in `src/components/health/refinement.css`; layout and interaction rules remain in `health.css`.

- One clear primary action in the first-use daily briefing.
- Show a useful explanation and connection action before daily signals exist. Never fill empty health metrics with invented values.
- Use the same sans-serif typography, surfaces, controls, and focus indicators across Today, agent, activity, journal, memory, connections, and dialogs.
- Keep character choice secondary to the daily action, with a larger interactive portrait and a visible fallback while WebGL loads.
- On mobile, preserve the bottom navigation, keyboard-aware chat layout, and minimum 44px action targets.
- Demo data remains explicitly labeled and separate from personal records.

Visual review covers a 390px mobile viewport, the character picker, agent screen, More menu, and a desktop layout. Build validation is recorded in the release notes when shipped.

## Character direction

Use original soft, round, non-human companions: simple silhouettes, expressive eyes, tiny limbs, and a playful Kirby-esque feel. Moss, Sunny, and Pebble remain selectable; Moss is the default. Avoid human anime characters. The selected mascot appears consistently in Today and the agent avatar/welcome. Preserve the constrained loading-poster frame. Kai was an unaccepted exploration and is excluded from the app catalog; its editable source remains in repository history/workspace for reference.
