# White product showcase

The default showcase, `heat-pump-white`, is a presentation without added text or logo overlays on pure white (`#ffffff`). A 15-second continuous orbit rises over the fan and returns seamlessly to the front three-quarter view. Neutral studio lighting retains the cabinet details and reflections, with no floor or flow effects. Camera and fan motion use absolute time, including portrait framing and reduced-motion support.

Open `/?showcase=heat-pump-white` for the white showcase. Library menus, inspection switching, and playback controls remain available. The original explanatory film remains available at `/?showcase=form-in-motion`.

Camera and lighting live in `src/showcases/heat-pump-white.ts`. The catalog's `clean` flag hides only the editorial overlay for this showcase, retaining menus and playback controls.

# Starter showcase — El calor del aire, en tu agua

This is the accepted starter presentation for Biotérmica: a live, looping 15-second Three.js sequence, not an encoded video. Its stable catalog ID is `form-in-motion`; the model is `heat-pump-v1`. Keep IDs stable when changing display names so saved links continue to resolve.

## Final direction

Use pure white (`#ffffff`) throughout the four stages so the showcase blends into a white website. No floor, contact shadows, logo, captions or editorial overlays. Neutral lighting preserves the charcoal cabinet and visible air/water effects. The catalog’s `clean` flag retains workspace and playback controls while hiding presentation overlays.

Preserve the four-step reveal / overhead / socket-detail / return choreography. Product rotation, camera movement, fan rotation, light movement and flow are all driven by absolute time. The fan speed is chosen for presentation, not an asserted operating speed.

| Time | Process and flow | Camera direction |
| --- | --- | --- |
| 0–3.75 s | Warm amber air enters the side grilles | Approach and small product turn |
| 3.75–7.5 s | Icy cyan air leaves upward through the fan | Overhead fan detail |
| 7.5–11.25 s | Hot water leaves the lower-X PVC socket | Descend to and hold the service pocket |
| 11.25–15 s | Cold water enters the higher-X PVC socket | Stay near the sockets, then return to opening pose |

Camera keys are at 0, 3.125, 5, 6.875, 8.75, 11.25, 13.125 and 15 seconds; chapter boundaries are at 0, 3.75, 7.5 and 11.25 seconds. They deliberately differ so camera moves lead into the process views. The last camera key matches the first. Quintic easing creates soft starts and stops between keys.

## Flow implementation and model contract

`src/animations/heat-flow.ts` attaches `showcase-heat-flow` to the model's `cabinet` group. It expects two direct children named `pvc-water-socket`, sorts them by local X, and reads their positions with a +0.065 m local Z offset to reach the openings. `createHeatPumpCycle` composes the shared `createFanAnimation`, which expects a `fan-rotor` node. These assumptions are specific to the current heat pump; do not apply this sequence to another model without adapting its attachment points.

- Air: two line-trail systems with 18,000 streams per air stage, doubled from 9,000 for visibility against the white and pale-blue backgrounds. Each trail has eight vertices with faded ends. Preserve the fine, dense appearance and absolute-time motion.
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
| Air/water visuals, paths and equal-duration stages | `src/animations/heat-flow.ts` |
| Registration, chapter copy, model ownership | `src/library/catalog.ts` |
| Floor, fog and lights | `src/scenes/studio.ts` |
| Renderer, environment, controls and rendering API | `src/core/viewer.ts` |
| Playback, chapter index, selection lifecycle | `src/main.ts` |
| Shared logo and caption layout | `index.html`, `src/style.css` |

The current water chapters (zero-based indices 2 and 3) place captions higher to keep the flow paths clear. This is a shared CSS assumption today; introduce explicit layout metadata when another showcase needs different chapter placement. All showcases use `defaultShowcaseDuration` in `src/showcases/defaults.ts`, which defaults to 15 seconds. New showcases should use this shared default. The four-stage showcase passes its duration to the flow animation, keeping four equal stages and proportional camera timing synchronized.

## Playback and verification

Use **Biblioteca** to select content, **Inspeccionar** for manual orbit/zoom, and **Presentación** for the scripted camera. Showcase playback starts automatically except with reduced motion. Opening the library or hiding the tab pauses playback; the user can resume. Timeline scrubbing samples the requested time directly.

Run `bun run build` and `bun test` after sequence changes. Tests cover deterministic seeking, stage selection, water direction, camera/product/light repeatability and catalog compatibility. In the browser, scrub to 1.875, 5.625, 9.375 and 13.125 seconds, then seek backward and across 15 → 0. Check a seamless white background, no branding, visible fine air, distinct water, correct port attachment, no rising outlet and no close-up overlap. Also inspect a narrow viewport and switch between model, animation and showcase.

## Future video export

`viewer.renderAt(seconds)` provides the absolute-time render entry point. Fix output size, pixel ratio, frame rate and asset readiness, sample `frameIndex / fps`, then encode frames. HTML logo/captions/controls are outside the WebGL canvas: include a deliberate overlay composition or page-capture strategy. No MP4/WebM exporter, capture UI or encoding pipeline exists yet. Repeatable scene poses do not guarantee pixel-identical results across GPUs/browsers.

Both current showcases are shadow-free and have no contact-shadow plane. Future showcase shadows must remain isolated from model inspection.

## Clear showcase background choice

Both clear showcases expose a **Fondo** selector: **Blanco** (`#ffffff`, default) or **Azul suave** (`#f4fbff`) to match the website. The selection changes only the backdrop and fog, preserving lighting, playback and camera position. It survives switching presentations and reloads through `?background=f4fbff` (or `ffffff`). Inspection hides the control and retains its own background.
