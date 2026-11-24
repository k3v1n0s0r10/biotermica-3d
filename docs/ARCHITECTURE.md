# Blender source, static previews

## Ownership

`blender/models/heat-pump.blend` owns the product meshes, materials, named parts,
studio camera, lights and animation. `blender/catalog.json` maps stable catalog
IDs to named roots in that scene. Model hierarchies are reusable components;
the assembly owns placement. Mesh/material datablocks may be shared within the
native scene. Export scripts operate in separate Blender processes and never
save over the master file.

`src/` owns only browsing, selection, media playback, URLs and download links.
It does not construct models, lighting rigs, or animation curves. GLB display
uses the model-viewer web component; the application does not import Three.js.
The component internally uses Three.js for browser rendering. Its renderer is
loaded on demand, and detached previews stop playing when selection changes.

## Data flow

1. Edit the native Blender source and save it.
2. Validate named parts, metre scale, shadows, loop closure and seeking.
3. Render the still and animation frames, then encode the MP4.
4. Publish model-only GLBs and PNGs under `public/previews/<product-id>/`.
5. Build the static website. CI validates artifacts without running Blender.

The catalog is shared by Blender publishing, the browser and artifact tests.
Add products through the catalog and native scene, not new JavaScript factories.
Static hosts serve published assets; they never execute Blender. Genuine Cycles
rendering happens offline. GLB is the interactive delivery format and may differ
in lighting from Cycles. Do not present it as a native Blender renderer.

## Shadows and animation

Models and inspection remain shadow-free: no shadow-ray participation, contact
planes, baked shadows or AO textures. Keep material lighting and reflections.
The current white showcase is also shadow-free. Future showcase shadow settings
must be isolated from model-only exports.

Blender is Z-up in metres. GLB exports convert to glTF Y-up. The fan rotates about
Blender local Z. Animations are authored against absolute frames, never integrated
from previously sampled frames. The current scene renders frames 1–360 at 24 fps;
frame 361 is the closing loop key. GLB animation includes that closing key.

## Validation

`bun run validate` tests catalog resolution and actual artifact headers, geometry,
named roots, animations, omitted lights/cameras/AO, and the native download. Biome,
Fallow, strict TypeScript and Vite production build remain blocking gates.
`bun run blender:validate` additionally opens and evaluates the native source.
Review stills and several timeline positions after visual changes.
