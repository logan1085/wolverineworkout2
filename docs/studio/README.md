# 3D studio

Open from the agent composer, desktop rail, or mobile More. Describe a sketch, confirm sharing with OpenAI, then create. Select “Revise the current object” for edits. Orbit with one finger, pinch with two, or use the accessible controls. Export real geometry as GLB or its structured scene as JSON.

The generator assembles up to 24 boxes, spheres, cylinders, cones and rings. This is a stylized sketch tool, not general text-to-mesh, accurate anatomy, or manufacturing CAD. The example works without AI. WebGL is required to display and export GLB; JSON remains available without it.

Descriptions and optionally the current scene go to OpenAI with store:false. No health context or durable memory is included. Scenes are held in component memory until the studio closes or account changes. Download before closing; there is no saved gallery. Reopen downloaded scene JSON with “Open scene JSON”; the same geometry bounds apply to imports. Undo / redo restores the previous scene after generation or import. Provider retention policies still apply.

The endpoint requires same-origin identity, explicit sharing consent, bounded request size, and validated geometry. Cloud generation shares the daily agent quota. Untrusted output cannot load scripts, external textures or assets. Three.js loads only when the viewer opens, renders on interaction rather than continuously, and caps pixel ratio at 1.5.

Validation: scene unit tests, HTTP authorization/consent guards, synthetic live generation, lint, TypeScript and production build. Physical touch interaction, GPU rendering and downloaded GLB appearance still require device QA.

## Blender object library

The studio opens to a six-object catalog: kettlebell, dumbbell, hydration bottle, yoga mat, balance stones and moon sculpture. Category filters, rendered thumbnails and a touch/keyboard 3D viewer work without AI or health-account storage. Only the selected GLB loads; original downloads work even without WebGL. Choose Create with AI for the separate editable sketch tool, and download a sketch before switching views.

Editable .blend sources and regeneration instructions are in assets/blender; public models and thumbnails are under public/models/wolverine. Original artwork, no third-party models or external textures. The full web catalog is about 1 MB. Seven catalog checks load all six GLBs with the actual Three.js loader, check bounds and file sizes, and confirm Blender sources exist. Blender thumbnails were visually inspected; physical mobile WebGL testing remains pending.

## Objects in daily use

Today replaces the CSS orb with a live, demand-rendered Blender object: balance stones for the existing gentler-day briefing, otherwise the kettlebell. Bottle and moon render cards lead to habit planning and check-in. Activity pairs the dumbbell with movement planning; Journal pairs balance stones and the yoga mat with check-in and recovery conversation. These cards use lightweight Blender-rendered images, with explicit Explore in 3D actions opening the exact asset at the top of the studio. Only the briefing uses an inline WebGL canvas; the other surfaces avoid multiple simultaneous renderers. Mobile cards stack, and the live briefing keeps an explicit route to keyboard controls.

## Selectable companions

Moss, Sunny and Pebble are original Blender companions. Choose character from Today, the chat avatar, the desktop rail or mobile More. The choice updates the daily 3D figure and chat welcome/avatar; Moss is the default. It is an appearance preference only, scoped to the signed-in account (or signed-out device) in localStorage, never part of health memory or AI requests. Cross-tab changes are reflected; unavailable storage keeps the preference for the current visit with a visible notice. This is device-local, not cross-device account sync. The picker includes an interactive preview with keyboard controls and GLB download. Editable files are in assets/blender/characters; regenerate with scripts/blender/build_characters.py.
