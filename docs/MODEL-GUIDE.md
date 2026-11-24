# Native Blender model guide

The authoritative source is `blender/models/heat-pump.blend`. These are visual
concepts from reference images, not measured manufacturing CAD.

## Preserve the product design

- Unbranded charcoal square cabinet with softly curved corners.
- Separate rolled corners and a flush electrical lid wrapping the front/right corner.
- Side panels meet the lids directly; no intermediate bands.
- Lids extend 3 mm outward; low support feet total 1 cm in height.
- Recess only the small bottom service pocket, with two hollow white PVC sockets.
- Real grille openings and a real top aperture, with five blades below the guard.
- Preserve the diagonal compressor/exchanger pair and their clearances to piping.
- Preserve separate rigid PVC runs, elbow fittings, union collars and copper tubing.

## Coordinates and named parts

One Blender unit is one metre; +Z is up and the product front is -Y. The ground
origin is below the product centre. GLB export converts axes automatically; do not
rotate or normalize the source a second time. The cabinet's -0.0325 m vertical
assembly offset is already authored.

The catalog roots are `heat-pump`, `heat-exchanger` (coil), `compressor`, and
`titanium-heat-exchanger`. Within the product retain `cabinet`, `internals`,
`support-legs`, `electrical-lid`, `fan-rotor`, `fan-guard`, `top-deck`,
`refrigerant-piping`, `water-piping` and the functional component names.
`fan-rotor` rotates about local Z. Imported repeated detail names have Blender
numeric suffixes; use parent hierarchies instead of assuming global uniqueness.

The exchanger retains its sleeve, end caps, unions, titanium serpentine and
water-volume geometry. Reveal effects should be authored in Blender materials
or actions. The previous browser-only sleeve toggle and flow-particle film have
been retired; their geometry and the white showcase remain in the native scene.

Edit in place and keep component-local origins useful. Shared mesh datablocks
are deliberate; make single-user copies before changing only one instance.
Keep model shadow rays disabled and avoid baked lighting/AO textures. Render
isolated components to check detail, then inspect the complete assembly.
