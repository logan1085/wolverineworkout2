# 3D studio

Open from the agent composer, desktop rail, or mobile More. Describe a sketch, confirm sharing with OpenAI, then create. Select “Revise the current object” for edits. Orbit with one finger, pinch with two, or use the accessible controls. Export real geometry as GLB or its structured scene as JSON.

The generator assembles up to 24 boxes, spheres, cylinders, cones and rings. This is a stylized sketch tool, not general text-to-mesh, accurate anatomy, or manufacturing CAD. The example works without AI. WebGL is required to display and export GLB; JSON remains available without it.

Descriptions and optionally the current scene go to OpenAI with store:false. No health context or durable memory is included. Scenes are held in component memory until the studio closes or account changes. Download before closing; there is no saved gallery. Reopen downloaded scene JSON with “Open scene JSON”; the same geometry bounds apply to imports. Undo / redo restores the previous scene after generation or import. Provider retention policies still apply.

The endpoint requires same-origin identity, explicit sharing consent, bounded request size, and validated geometry. Cloud generation shares the daily agent quota. Untrusted output cannot load scripts, external textures or assets. Three.js loads only when the viewer opens, renders on interaction rather than continuously, and caps pixel ratio at 1.5.

Validation: scene unit tests, HTTP authorization/consent guards, synthetic live generation, lint, TypeScript and production build. Physical touch interaction, GPU rendering and downloaded GLB appearance still require device QA.
