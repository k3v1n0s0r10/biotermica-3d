# Form in motion — showcase 01

The default view is a live, 24-second Three.js film. It is not an encoded MP4 or WebM. It starts automatically unless the viewer requests reduced motion. Play/pause, restart and timeline scrubbing remain available. Select **Inspect model** for manual orbit controls and the original eight-second turntable, or open `/?mode=studio` directly.

## Creative direction

An unbranded product study: charcoal metal, teal opening, violet overhead view, warm copper-coloured backdrop for the details, then a cool closing hero angle. Environment reflections and moving key lighting make the curved metal readable. A soft procedural contact-shadow plane grounds the feet; it is presentation shading, not a physical simulation. Editorial captions are HTML overlays, separate from the product geometry. The fan rotates slowly for presentation, not at an asserted operating speed.

| Time | Movement |
| --- | --- |
| 0–6 s | Slow approach and a small product turn |
| 6–11 s | Rise above the top-mounted fan |
| 11–16 s | Descend toward the corner cover and PVC sockets |
| 16–20 s | Pull back into the complete product view |
| 20–24 s | Return to the opening pose and palette |

## Editing

- `src/animations/showcase.ts`: timestamped camera positions, look targets, product yaw, background and accent colours. Quintic easing joins each pose with zero endpoint velocity/acceleration. It is a deliberate stop-and-go dolly sequence, not a constant-speed camera spline.
- `src/scenes/studio.ts`: physical scene, floor, fog, key/fill/rim lights.
- `src/core/viewer.ts`: renderer and environment, mode changes, inspection controls and `renderAt(seconds)`.
- `src/library/catalog.ts`: showcase registration, captions and model ownership.
- `src/main.ts`: selection, playback and mode buttons. No business claims or company identity are baked into the model.
- `src/style.css`: film typography and responsive overlay. Change it independently from lighting and camera choreography.

Every frame is sampled from absolute time, including the rotor and lighting. No random motion or accumulated rotations. Loop duration is 24 seconds, and the last key matches the first. Tests verify out-of-order seeking and loop repeatability. Manual orbit is disabled only in showcase mode so it cannot fight the camera sequence.

For video export later, fix renderer size, pixel ratio and frame rate, sample `frame / fps`, and encode frames. The current HTML overlay would need to be included through page capture or composited separately; canvas capture alone excludes it. Real-time capture is not yet implemented.
