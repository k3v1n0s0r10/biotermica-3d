# Continuing the product studio

## Start here

Read [MODEL-GUIDE.md](MODEL-GUIDE.md) before changing the heat-pump shell, [SHOWCASE.md](SHOWCASE.md) before changing the film, and [BRAND.md](BRAND.md) for every new presentation. [LIBRARY.md](LIBRARY.md) describes registration and selection. These documents describe the current implementation; update them with accepted changes instead of appending contradictory design revisions.

The starter contains one procedural exterior (`heat-pump-v1`), one four-step showcase (`form-in-motion`), and two inspection animations (`turntable`, `fan-study`). The intended direction is **many independent models, many showcases, and compatible reusable animations**, all discoverable through the catalog-driven library.

## Adding content safely

### Another product or internal component

1. Create a factory in `src/models/` (or `src/models/components/` for an internal assembly). Return a fresh named `Group` with exclusively owned resources. Use metres, +Y up and +Z front.
2. For internals, attach to the existing `internals` group in cabinet-local coordinates; do not apply the cabinet Y offset twice. Preserve the accepted lid seams, small feet, rounded panels, fan opening and PVC sockets.
3. Give functional attachment points stable names. For future products, prefer explicit inlet/outlet/fan references over positional inference. The starter flow currently sorts two socket nodes by X.
4. Register complete products as `ModelEntry` items with initial inspection framing. Add `modelIds` compatibility only to animations that support the product's node contract.
5. Check the geometry in inspection mode before creating a showcase around it.

### Another showcase

1. Create a separate sequence module; keep the starter available as a reference instead of replacing its stable ID.
2. Register a `ShowcaseEntry` with a unique ID, owning model, edition, captions and matching duration. Menus derive from the catalog automatically.
3. Return `{ duration, sample(seconds) }`; sample returns a valid zero-based chapter index. Set every animated property from time rather than previous-frame state.
4. Reuse the shared brand shell and palette. Compose camera views around both the product and the caption area. Add explicit chapter layout metadata if the starter's high water-caption placement does not fit.
5. Attach effects to the product or its appropriate local assembly so they follow product motion. Keep effects out of inspection mode and release all resources on selection changes.
6. Keep engineering claims and illustrative motion distinct. Confirm actual port roles/dimensions before presenting the starter as a manufacturing diagram.

### Another inspection animation

Register an `AnimationEntry` with compatible model IDs and `{ duration, sample(seconds) }`. Document required named parts, retain useful rest transforms, and test backward seeking. Camera ownership belongs to orbit controls in inspection and to the sequence in showcase mode.

## Current boundaries

- Factories and registry imports are synchronous/eager. The GLB loader exists, but async catalog loading is not wired into selection. Add loading/error states and stale-request cancellation before using async factories.
- All showcases receive the same studio stage contract. Add explicit stage factories when environments diverge.
- Resource cleanup assumes exclusive ownership, including textures. Introduce reference counting or another ownership policy before sharing cached GPU assets across viewers.
- Heat-flow timing, socket placement and some caption layouts are starter-specific, not yet general effect/layout systems.
- The exterior is an illustrative procedural model; internals, engineering dimensions and pipe routing remain future work.
- Video export is not implemented. See the capture requirements in SHOWCASE.md.
- The production bundle exceeds Vite's 500 kB warning threshold. Add lazy loading as the catalog grows rather than duplicating assets in every entry.

## Completion checklist

- Run `bun run build` and relevant `bun test` checks for code changes.
- Verify selection/search, compatible animations, reloadable URL parameters and keyboard dialog dismissal when changing the library.
- Check each chapter, backward seeks, pause/resume, loop boundary, narrow viewport and text/product/particle contrast when changing a showcase.
- Confirm disposal when switching entries and avoid accumulating render loops or effects.
- Update the appropriate guide with stable names, coordinates, dependencies and any new limitations. Keep branding shared rather than copying it into each model.

Useful next milestones are measured internals, removable/exploded assemblies, explicit model attachment contracts, a second independent showcase to validate reuse, and deterministic video export.
