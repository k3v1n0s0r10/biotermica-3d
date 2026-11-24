# Biotérmica Blender studio

Blender is the source of truth for geometry, materials, cameras, lighting, and
animation. The website is a static preview gallery for Blender outputs: Cycles
stills, MP4 films, and interactive GLB models. It does not author product geometry.

## Start the preview website

```sh
bun install --frozen-lockfile
bun run dev
```

The gallery contains the heat pump, coil, compressor, and titanium exchanger.
Choose **Imagen**, **Video**, or **Modelo 3D**. Only the heat pump currently
has a film. Playback starts on request; switching views or hiding the page pauses
it. Views have shareable URLs and support browser Back/Forward. The 3D viewer
loads only when requested; image/video viewing does not download its renderer.

## Work in Blender

Open [the native master scene](blender/models/heat-pump.blend) in **Blender 5.3+**.
This is the editable source, not an intermediate generated from TypeScript.
The complete assembly and all four components are preserved as named hierarchies.
Edit geometry and materials in Blender, save, then regenerate outputs:

```sh
bun run blender:validate # Validate source parts, units, shadows, seeking, loop
bun run blender:render   # Cycles still, using settings authored in the .blend
bun run blender:animate  # 360 PNG frames at 480 × 480, eight samples
bun run blender:encode   # Encode those frames to a silent H.264 MP4
bun run blender:publish  # Export four GLBs, component stills and preview downloads
bun run validate        # Tests, Biome, Fallow, TypeScript and production build
```

On macOS the runner finds Blender in `/Applications/Blender.app`. Elsewhere put
`blender` on PATH, or set `BLENDER_BIN` to the full executable path. Commands fail
if Blender fails. Source files are never overwritten by render/export commands.
Render intermediates live in ignored `out/blender/`; distributable outputs live
in `public/previews/` and are tracked so deployment does not require Blender.

For full-resolution frames, use Blender directly:

```sh
blender --background --python-exit-code 1 --python scripts/blender/render.py -- --animation
```

The encoder uses the generated frames. Publish only after regenerating both the
still and movie following edits; the website should reflect the saved source.

## Browser rendering and deployment

A browser cannot open or execute a `.blend` file. The interactive view uses
[`<model-viewer>`](https://modelviewer.dev/) to display a Blender-exported GLB
with orbit/zoom controls. It uses its own WebGL renderer (internally based on
Three.js); the application has no Three.js authoring code or direct dependency.
GLB material lighting is an approximation of Cycles, not a live Cycles render.
True Cycles results are supplied as images/video. Live server-side rendering
would require a separate Blender compute service and is outside this static site.

```sh
bun run build
bun run preview
bun run deploy # Deploy dist as Cloudflare Workers static assets
```

Build and deploy are separate. Deploy requires your Cloudflare credentials and
uses [wrangler.jsonc](wrangler.jsonc). For another static host, upload `dist/`.
No Blender installation is needed on the host or in web CI. Vite's `--base` option
supports deployment beneath a path prefix. Keep individual assets below the
host's size limit; larger future renders belong in object storage.

## Structure and quality

- `blender/models/heat-pump.blend`: authoritative native scene.
- `blender/catalog.json`: stable product IDs, named object roots and gallery copy.
- `scripts/blender/`: native rendering, validation, GLB publishing and encoding.
- `scripts/blender.ts`: cross-platform Blender command runner.
- `src/`: the preview interface; no procedural product modeling.
- `public/previews/`: published GLBs, PNGs, MP4 and native download.
- `tests/`: catalog behavior and actual published artifact integrity.

[Architecture](docs/ARCHITECTURE.md), [model conventions](docs/MODEL-GUIDE.md),
[showcase workflow](docs/SHOWCASE.md), [library extension](docs/LIBRARY.md),
[continuation checklist](docs/CONTINUING.md), and [brand](docs/BRAND.md).

`bun run lint:fix` applies safe formatting/lint fixes; `bun run validate` enforces
all gates. Native scene changes also require `bun run blender:validate` and visual
review. Old procedural Three.js code and its runtime-specific tests were retired
in the Blender migration. A local migration backup is in ignored
`out/legacy-threejs.tar.gz`; it is not part of the application or deployment.
