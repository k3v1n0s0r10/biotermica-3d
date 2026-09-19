# Heat pump V1 — working model guide

## Intent and accepted design

This is an editable procedural product shell, built from visual references, not production CAD. Keep it as the base for future internal component models. Dimensions are illustrative until actual drawings are provided.

Preserve these decisions when extending the model:

- Dark charcoal, unbranded, square cabinet with softly curved corners.
- Separate rolled corner panels join adjacent vented sides. The electrical cover wraps the front/right corner.
- Top and bottom lids meet the side panels directly: **no intermediate bands**.
- Lids extend 3 mm outward, including around the curves. This replaced an almost-flush lip that disappeared from some angles.
- Feet are **1 cm total height**, deliberately almost invisible.
- Electrical cover stays flush with the body; only the small bottom water-connection pocket is recessed.
- Two hollow white PVC water sockets, not metallic refrigerant fittings.
- Actual opening through the top deck, five complete fan blades beneath a concentric guard. No solid interior block obscuring the blades.
- The compressor and titanium pool heat exchanger form a centered diagonal pair on the interior floor, both at their standalone scale. The compressor sits left/front; the taller exchanger sits right/back. Both placements and orientations are turned 15° counterclockwise around the shared centre, bringing the compressor forward and the exchanger farther back.

## Coordinates and current envelope

One Three.js unit = one metre. +Y is up; +Z is the front; the service corner is +X/+Z. Product root origin is at ground level below the centre. Avoid auto-normalizing imported parts: all parts should share this coordinate frame.

| Item | Current value |
| --- | --- |
| Cabinet half width/depth | 0.454 m |
| Lid half width/depth | 0.457 m |
| Cabinet corner radius | 0.045 m |
| Base lower / upper Y (cabinet local) | 0.0425 / 0.0875 m |
| Top lid lower / upper Y (cabinet local) | 1.065 / 1.084 m |
| Cabinet group Y offset in product | -0.0325 m |
| Ground clearance | 0.010 m |
| Fan aperture radius | 0.381 m |

The cabinet group offset is intentional: do not apply it again to children. For early internals, keep components inside roughly X/Z ±0.39 m and cabinet-local Y 0.10–0.95 m, then verify clearances against actual meshes. This is a planning envelope, not an engineering clearance guarantee.

## Scene graph and ownership

`src/models/heat-pump.ts` owns the cabinet geometry and materials. The standalone `src/models/coil.ts` model owns its fins, copper tubing, and materials; the heat pump imports `createCoil()` and places it at cabinet-local Y = 0.115 m. The coil uses a bottom-centre local origin and is also selectable independently in the library. `createHeatPump()` returns `heat-pump`:

```text
heat-pump
  cabinet                        Y = -0.0325 m
    base-pan / interior-floor
    front-grille / right-grille / back-grille / left-grille
      perforated-sheet           Real capsule-shaped holes
    heat-exchanger               Standalone coil model, Y = 0.115 m
      heat-exchanger-fins        Vertical instanced plates
      heat-exchanger-serpentine  Continuous copper tube
    curved-corner-panel-1..3
    electrical-lid
      lid-front / lid-return / lid-rounded-corner / fasteners
    pocket-back / pocket-side / pocket-ceiling / pocket-floor
    pvc-water-socket ×2 / pvc-union-collar ×2
    top-deck / fan-shroud
    fan-rotor                    Rotate this group around local Y
      fan-hub / fan-blade-0..4
    fan-guard
    internals                    Attachment group for internal models and compositions
      compressor                 X ≈ -0.1094, Y = 0.086, Z ≈ 0.1328 m; yaw 15°
      titanium-heat-exchanger     X ≈ 0.1094, Y = 0.093, Z ≈ -0.1328 m; yaw 15°
      refrigerant-piping          Heat-pump refrigerant composition
      water-piping                Hollow PVC routes and union reducers
  support-legs
```

Repeated detail names are intentional: use `traverse` to collect all sockets or fasteners; `getObjectByName` returns only the first match. Keep animation attachment group names stable. Each product instance exclusively owns its resources; dispose it through `disposeObject` only when no longer used. Repeated fins use instancing; shared meshes within one product may share geometry/materials.

The heat pump owns its piping composition in `src/compositions/heat-pump/piping.ts`. It connects the compressor suction to the bottom of the coil suction header, the compressor discharge to the titanium exchanger inlet, and the exchanger outlet to the coil injection port. Straight runs meet through tangent elbows. The composition receives the assembled components and creates resources owned by this heat-pump instance.

The coil injection distributor is recessed into the interior at local X = 0.335 m, Z = 0.075 m. Its flexible copper branches sweep inward from the fin edge, and its supply union faces inward to leave the service opening clear. The refrigerant composition follows the union endpoint and tangent.

The water composition in `src/compositions/heat-pump/water-piping.ts` connects the upper exchanger water outlet to the left PVC socket and the lower inlet to the right socket, matching the showcase flow directions. Hollow reducers seat inside the blue unions. Rigid PVC lengths join separate, thicker elbow fittings with raised socket cuffs; PVC runs must show these accessories rather than appear as continuously bent tubing. The upper return descends behind the service pocket ceiling, with separate low runs to the pierced pocket back. Both water routes clear the copper piping; the component placements remain unchanged.

## Add an internal component

1. Create a factory under `src/models/components/<component>.ts` returning a named `Group`. Keep dimensions and materials in that module. Use the same metre/Y-up conventions.
2. Attach it to `product.getObjectByName('internals')`. This group uses cabinet-local coordinates and inherits the cabinet offset and product turntable motion.
3. Use an assembly placement transform on the returned group, leaving the component's local origin useful for its own animation.
4. Name functional pieces (e.g. `compressor`, `water-heat-exchanger`, `circulation-pump`, `water-inlet`). Pass references to animation sequences rather than repeatedly looking up meshes per frame.
5. Inspect with the outer cover temporarily hidden; check collisions with the fan, coil fins, service pocket, and base. Do not reintroduce a solid filler block.
6. Add absolute-time animations: every sampled timestamp must work after arbitrary seeking. Keep exploded-view offsets separate from authored/rest transforms.

For GLB parts, use `loadModel`; preserve scale and node names, await loading before playback, and add decoder support only when required by the asset. Factory/material code belongs with models; stage lighting and camera code belongs with scenes/animations.

## Validation and future work

Run `bun run build` and relevant `bun test` checks. Inspect all four corners, top opening, low side angles, PVC bores, and lid seams in the browser. Keep the small feet small. Check multiple timeline positions after changing animations. Avoid claiming manufacturing accuracy or physical airflow/thermal behaviour from this visual model.

Next work: measured dimensions, internal component assemblies, pipe routing, removable panel/exploded views, richer powder-coat detail, and offline video export. The current showcase is a live Three.js animation, not an encoded video.

## Titanium pool heat exchanger

`createTitaniumHeatExchanger()` in `src/models/components/titanium-heat-exchanger.ts` creates a standalone photo-based component, approximately 0.64 m tall with a 0.20 m diameter body. Its bottom-centre origin uses metres, +Y up, and both hollow pool-water unions face +Z. Dimensions and tube routing are illustrative, not engineering drawings.

Stable targets include `reveal-sleeve`, `upper-housing`, `lower-housing`, `water-inlet`, `water-outlet`, `titanium-serpentine`, `water-volume`, and `water-surface`. The continuous corrugated tube includes a descending feed and 17 ascending turns ending at the second top fitting. The water chamber is partially filled to leave a visible surface. Resources belong exclusively to the model instance.

The library's `exchanger-reveal` animation fades only the central sleeve, holds the internal view, then restores the exterior over 12 seconds. It controls sleeve opacity and depth writing through absolute-time sampling. The end caps and unions remain opaque. This is an illustrative transparency effect, not a fluid or heat-transfer simulation. The model also supports the shared turntable animation.
