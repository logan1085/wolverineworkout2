# Wolverine training stadium

Original geometry authored by scripts/blender/build_training_ground.py in Blender 4.5.0. The editable source preserves individual meshes, materials, soft area lighting and the editorial camera. No stock assets or external textures.

Rebuild from repository root:

```
/Volumes/Blender/Blender.app/Contents/MacOS/Blender --background --factory-startup --python scripts/blender/build_training_ground.py -- "$PWD"
```

The existing mounted application was used; no installation was performed. A fresh full rebuild bakes Cycles combined lighting/materials into a 2048-square atlas, creates one static mesh and exports a self-contained GLB with KHR_materials_unlit. The optional --reuse-bake flag is only for export-only changes with identical geometry/UV generation. The packed JPEG atlas reduces download size; the full-quality PNG bake remains here. GLB normals are omitted because the material is unlit. Live dates, workout markers, race countdown and completion bars remain browser overlays driven by current application state.

Budgets enforced by tests/training-world-asset.test.mjs: under 3 MB, under 50,000 triangles, one static mesh/primitive/material, embedded resources only, valid glTF with no errors. Actual export: 1,464,780 bytes, 39,912 triangles. Source and atlas stay outside public/. Poster PNG is delivered through Next image optimization.
