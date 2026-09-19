# Biotérmica product studio

Bun + TypeScript + Vite + Three.js workspace for product models and repeatable showcase animations.

## Run

```sh
bun install --frozen-lockfile
bun run dev
```

Open the local URL printed by Vite. The default view plays a 24-second cinematic showcase with animated camera angles, lighting, colours and fan motion. Use **Inspeccionar** for manual orbit/zoom and the eight-second turntable. Both modes support playback and scrubbing. Reduced-motion users start paused.

- [Modular architecture and composition rules](docs/ARCHITECTURE.md)
- [Continuation checklist and extension boundaries](docs/CONTINUING.md)
- [Biotérmica brand guidelines](docs/BRAND.md)
- [Library menus and adding new entries](docs/LIBRARY.md)
- [Model guide and accepted design decisions](docs/MODEL-GUIDE.md)
- [Showcase direction and animation editing](docs/SHOWCASE.md)

The showcase is a live animation; video file export is future work.

```sh
bun run typecheck
bun test
bun run build
bun run preview
```

Production files are written to `dist/`. Bun manages dependencies and runs tooling; Three.js renders in the browser (WebGL 2 required).

## Code quality and agent workflow

Biome 2.5.14 handles formatting, linting, and import organization. Fallow 3.27.0
checks dead code, complexity, and duplication. Both are pinned in `package.json`
and `bun.lock`; TypeScript remains responsible for type checking.

```sh
bun run format        # Apply formatting
bun run lint:fix      # Apply formatting and safe lint/import fixes
bun run lint          # Check without changing files; warnings fail
bun run analyze       # Fallow gates across the entire project
bun run analyze:json  # Full Fallow evidence for agents, as JSON
bun run check         # Biome + Fallow + TypeScript
bun run validate      # Tests + all static checks + production build
```

`bun run build` includes the static gates. The GitHub Actions `Quality` workflow
runs `bun run validate` on pushes and pull requests. Repository administrators can
require its `validate` job in branch protection to block merging failed checks.

Agents must follow [AGENTS.md](AGENTS.md): inspect affected code, resolve all tool
warnings/errors, and pass validation before reporting completion. Rules must not
be weakened or findings hidden to make checks pass. Fallow's informational scores,
churn metrics, and refactoring suggestions guide investigation; its configured
findings are enforced with nonzero exits. A small JSON-report gate enforces zero
duplicate groups because Fallow 3.27 does not fail `dupes --fail-on-issues` at
its default unlimited duplication threshold. No inherited-issue baseline is used.

The GLTF loader is an explicit Fallow entry because it is a documented extension
API, although the current catalog builds its model procedurally. The browser
entry and Bun tests are also explicit. Generated output, dependency directories,
and Fallow caches are ignored; Biome excludes the bundled agent skill directories.

For context before editing, run `bunx --no-install fallow inspect --file src/main.ts`.
See the [Biome linter reference](https://biomejs.dev/linter/) and
[Fallow CLI documentation](https://fallow.tools/docs/) for tool behavior.

## Structure

```text
src/
  main.ts              Selection and playback lifecycle
  brand/
    theme.ts           Shared company and showcase palette
  library/
    catalog.ts         Models, animations, showcases and compatibility
    menu.ts            Searchable library interface
  core/
    viewer.ts          Renderer, camera, controls, resizing, cleanup
    dispose.ts         GPU resource cleanup for owned model assets
  models/
    heat-pump.ts       Square cabinet, corner lid, grilles, fan, service ports
    load-model.ts      Standard GLB/glTF loader
  scenes/
    studio.ts          Product assembly, studio lights, floor
  animations/
    turntable.ts       Absolute-time sequence interface and inspection loop
    fan.ts             Shared rotor motion for inspection and showcases
    heat-flow.ts       Four-stage air and water effects
  showcases/
    heat-pump-cycle.ts Complete heat-pump presentation composing shared animations
  style.css
public/
  brand/               Official Biotérmica emblem
  models/              Product GLB/glTF assets, grouped by product
  textures/            Shared texture maps
  environments/        HDR/EXR lighting assets for future scenes
tests/                Bun animation tests
```

## Add a product

Models can contain other models and support multiple reusable animations. Showcases are the final layer that connects these parts into a presentation. Follow the [architecture rules](docs/ARCHITECTURE.md) when extending the project.

1. Export a standard `.glb` into `public/models/<product-id>/model.glb`. For `.gltf`, retain its relative texture and binary paths.
2. Load it with `await loadModel('models/<product-id>/model.glb')` from `src/models/load-model.ts`.
3. Register a model factory in `src/library/catalog.ts`. For async GLB factories, extend the viewer/selection lifecycle to await loading before starting playback and keep errors visible.
4. Put product-specific assembly/material logic in `src/models/`; keep camera and lighting arrangements in `src/scenes/`.

Conventions: one world unit = one metre, +Y up, +Z product front, origin centered on the floor beneath the product. The loader preserves authored transforms and named parts. Use stable part names for future fan, panel, and exploded-view animations. Draco, Meshopt, and KTX2 decoder support can be added when assets require it; the starter loader handles standard uncompressed assets.

## Reproducible animation

Each sequence exposes `duration` (seconds) and `sample(seconds)`. Assign animated properties from absolute time; avoid accumulating rotation or relying on previous frames. `viewer.renderAt(seconds)` samples and renders directly. For a future frame capture pipeline, call it with `frameIndex / fps` after fixing the camera and output size.

In inspection mode, orbit controls change the camera independently of animation; showcase mode owns the camera. Reset the view before comparing renders. Poses are repeatable; pixel-identical output across GPUs/browsers is not guaranteed. Video encoding/export is not implemented yet.

Add sequences in `src/animations/` and register them in `src/library/catalog.ts`. Loaded animation clips are available as `gltf.animations`; when adding a mixer, drive it from absolute sequence time and test backward seeking as well as playback.

The viewer disposes its controls, resize observer, geometry, materials, textures, shadows, and renderer on hot reload. The cleanup helper assumes exclusive asset ownership; introduce explicit shared-resource ownership before caching models across viewers.

Dependencies are locked in `bun.lock`. Three.js itself makes the initial production bundle exceed Vite's default 500 kB warning threshold; the build succeeds. Split additional models/scenes into lazy imports as the catalogue grows.

## Reference model

`createHeatPump()` builds an unbranded visual concept from the supplied product image and CGAxis reference. It uses a dark square cabinet, a flush corner electrical lid, and a shallow bottom service pocket. Slots are actual holes, coil fins are instanced, and fan/guard/lid groups have stable names for animation. Dimensions are illustrative, not measured engineering data.
