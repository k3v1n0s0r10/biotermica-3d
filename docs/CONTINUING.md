# Continuing the Blender studio

1. Read the architecture and model guide. Edit native `.blend` geometry and curves,
   not browser meshes. Keep named roots, metric scale and shadow ownership.
2. After a scene edit run `bun run blender:validate` and regenerate still, movie,
   and published exports. Visually inspect several frames and isolated components.
3. After web changes run `bun run lint:fix`, inspect the fixes, and run the complete
   `bun run validate`. Do not weaken gates or add analyzer entry points to hide code.
4. Test image/video/3D modes, all four models, downloads, Back/Forward, narrow
   screens and a failed GLB request. Video and WebGL should load only on request.
5. Run `bun run deploy` only when publishing is requested. Static CI/deployment
   needs the tracked preview assets, not Blender or the ignored render frames.

The Three.js authoring/runtime has been retired. Model-viewer internally uses
Three.js, but its role is limited to displaying exported geometry. True Blender
rendering is offline; do not claim `.blend` executes in a browser.
