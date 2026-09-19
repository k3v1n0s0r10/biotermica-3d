# Starter showcase — El calor del aire, en tu agua

This is the accepted starter presentation for Biotérmica: a live, looping 24-second Three.js sequence, not an encoded video. Its stable catalog ID is `form-in-motion`; the model is `heat-pump-v1`. Keep IDs stable when changing display names so saved links continue to resolve.

## Final direction

Use the shared Biotérmica emblem, wordmark, Spanish captions and blue/aqua identity. The stage uses muted deep blue-green backgrounds with a restrained warmer variation for hot water. White headings and pale cyan accents sit directly on the scene: **no background cards behind the logo or captions**. The floor is darkened independently to counter the studio lights. Keep the charcoal cabinet well lit and the PVC and flow highlights visible. See [BRAND.md](BRAND.md) for the shared palette.

Preserve the four-step reveal / overhead / socket-detail / return choreography. Product rotation, camera movement, fan rotation, light movement and flow are all driven by absolute time. The fan speed is chosen for presentation, not an asserted operating speed.

| Time | Process and flow | Camera direction |
| --- | --- | --- |
| 0–6 s | Warm amber air enters the side grilles | Approach and small product turn |
| 6–12 s | Icy cyan air leaves upward through the fan | Overhead fan detail |
| 12–18 s | Hot water leaves the lower-X PVC socket | Descend to and hold the service pocket |
| 18–24 s | Cold water enters the higher-X PVC socket | Stay near the sockets, then return to opening pose |

Camera keys are at 0, 5, 8, 11, 14, 18, 21 and 24 seconds; chapter boundaries are at 0, 6, 12 and 18 seconds. They deliberately differ so camera moves lead into the process views. The last camera/color key matches the first. Quintic easing creates soft starts and stops between keys.

## Flow implementation and model contract

`src/animations/heat-flow.ts` attaches `showcase-heat-flow` to the model's `cabinet` group. It expects two direct children named `pvc-water-socket`, sorts them by local X, and reads their positions with a +0.065 m local Z offset to reach the openings. `createHeatPumpCycle` composes the shared `createFanAnimation`, which expects a `fan-rotor` node. These assumptions are specific to the current heat pump; do not apply this sequence to another model without adapting its attachment points.

- Air: two `Points` systems, 360 streams each with four-point trails (1,440 rendered points per stage), size 0.018, shared soft sprite, warm amber / icy cyan colors. Keep the fine, dense appearance.
- Water: separate translucent `TubeGeometry` surfaces with physical materials and 70 instanced moving droplets per port. Do not reuse air sprites for water.
- Hot water travels outward along a 0.36 m path that drops 0.075 m. Cold water travels inward along a straight level path. Avoid upward water arcs.
- Only the active stage is visible; effects fade at its boundaries. Deterministic seeds and absolute time make arbitrary seeking repeatable.
- Inlet/outlet assignment and flow colors are explanatory, pending engineering confirmation. This is not a thermal or fluid simulation.
- Inspection mode has no flow effects. Meshes, points, materials and the sprite are disposed with the viewer.

## Where to edit

| Concern | File |
| --- | --- |
| Camera keys, product yaw, lighting and backdrop | `src/showcases/heat-pump-cycle.ts` |
| Shared fan rotation (inspection and showcase) | `src/animations/fan.ts` |
| Air/water visuals, paths and six-second stages | `src/animations/heat-flow.ts` |
| Shared 3D brand palette | `src/brand/theme.ts` |
| Registration, chapter copy, model ownership | `src/library/catalog.ts` |
| Floor, fog and lights | `src/scenes/studio.ts` |
| Renderer, environment, controls and rendering API | `src/core/viewer.ts` |
| Playback, chapter index, selection lifecycle | `src/main.ts` |
| Shared logo and caption layout | `index.html`, `src/style.css` |

The current water chapters (zero-based indices 2 and 3) place captions higher to keep the flow paths clear. This is a shared CSS assumption today; introduce explicit layout metadata when another showcase needs different chapter placement. Similarly, the flow module currently hard-codes 24 seconds and four equal stages. Update camera timing, flow timing, catalog duration and captions together if changing the sequence length.

## Playback and verification

Use **Biblioteca** to select content, **Inspeccionar** for manual orbit/zoom, and **Presentación** for the scripted camera. Showcase playback starts automatically except with reduced motion. Opening the library or hiding the tab pauses playback; the user can resume. Timeline scrubbing samples the requested time directly.

Run `bun run build` and `bun test` after sequence changes. Tests cover deterministic seeking, stage selection, water direction, camera/product/light repeatability and catalog compatibility. In the browser, scrub to 3, 9, 15 and 21 seconds, then seek backward and across 24 → 0. Check readable captions, visible fine air, distinct water, correct port attachment, no rising outlet and no close-up overlap. Also inspect a narrow viewport and switch between model, animation and showcase.

## Future video export

`viewer.renderAt(seconds)` provides the absolute-time render entry point. Fix output size, pixel ratio, frame rate and asset readiness, sample `frameIndex / fps`, then encode frames. HTML logo/captions/controls are outside the WebGL canvas: include a deliberate overlay composition or page-capture strategy. No MP4/WebM exporter, capture UI or encoding pipeline exists yet. Repeatable scene poses do not guarantee pixel-identical results across GPUs/browsers.

Shadows are showcase-only: `src/showcases/shadows.ts` owns shadow casting, receiving, and the contact-shadow plane. The viewer disables these and shadow-map rendering in model inspection.
