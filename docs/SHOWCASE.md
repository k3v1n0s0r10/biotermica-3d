# Native white showcase

The master `.blend` owns a 15-second white product film: a smooth camera orbit
rises over the fan and returns to its front three-quarter opening view. The
cabinet remains still; the rotor spins around its local Z axis. There is no floor,
logo overlay, contact shadow or explanatory flow effect. Neutral area lights
preserve material detail.

Frames 1–360 at 24 fps form the rendered loop. Frame 361 matches frame 1's camera
and rotor pose and is excluded from video to avoid a duplicate endpoint. Keyed
poses support scrubbing in either direction. Edit curves in Blender; avoid frame
handlers that accumulate transforms.

Run `bun run blender:validate`, then `blender:render`, `blender:animate`,
`blender:encode`, and `blender:publish`. Inspect the opening, side, overhead and
closing frames before deploying. The default movie preview is 480 × 480, eight
Cycles samples with denoising. The still uses the native scene's 1200 × 1200,
32-sample settings. Full-resolution animation uses the direct Blender command in
the README. The encoder reads the actual frame dimensions.

The website offers native video controls, no automatic playback, a poster and a
text description of the silent film. Switching selection, hiding the page or
leaving it pauses playback. The 3D view is independently lit browser geometry;
it is not expected to match Cycles pixels.
