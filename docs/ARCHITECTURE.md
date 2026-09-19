# Modular models and animations

Models and animations must be reusable and composable. Showcases are the final composition layer: they connect models, animations, effects, cameras and lighting into a complete presentation.

## Models can contain models

- Keep model and component factories in `src/models/`, using `components/` when useful. A model can be used alone or assembled inside another model; it does not need a library entry to be reusable.
- For example, a heat pump can contain a fan model, a compressor model and a water heat exchanger model. Those components can also be used in other products.
- Each factory returns a fresh named group. Preserve useful local origins, units and attachment points; the parent assembly owns placement, while the child owns its internal geometry and rest transforms.
- Expose stable named parts or explicit references for animation targets. Scope lookups to the relevant component when an assembly contains several instances of the same model.
- Keep resource ownership explicit. The current disposal system assumes exclusive ownership per product instance; shared cached resources need an ownership policy before reuse across viewers.

## Models can have multiple animations

- Keep reusable motion in `src/animations/`. A model can support several animations, and an animation can support several models that satisfy its target contract.
- For example, a heat pump can support fan rotation, panel opening and an exploded view. Fan rotation can also run on a standalone fan or a compatible fan inside another product.
- Animation factories receive a model or component reference and declare the parts and properties they control. They must not depend on a particular showcase or the library UI.
- Use `duration` and absolute-time `sample(seconds)` so playback, seeking and composition remain deterministic.
- Animations may run together when they control different properties. If two animations affect the same property, define sequencing, blending or a separate parent transform explicitly; do not rely on sampling order to overwrite one another accidentally.
- Separate component motion from whole-product placement. Fan rotation should only rotate the rotor; keeping the cabinet still is an inspection concern, and moving it through a presentation is a showcase concern.
- Reuse the same animation implementation wherever that motion appears. The fan study and heat-pump showcase both call `createFanAnimation` from `src/animations/fan.ts`; speed changes belong there and apply to both.

## Showcases are the final composition layer

- Keep each showcase in its own descriptively named file under `src/showcases/`, such as `heat-pump-cycle.ts`.
- A showcase chooses the assembled model, composes reusable animations and effects, and coordinates their timing with camera, lighting and chapter direction.
- Showcases are complete presentations, not reusable building blocks for models, animations or other showcases. Models and animations must not import showcase modules. Extract reusable behavior into the appropriate lower layer when another presentation needs it.
- Register complete products, contextual animation actions and showcases in `src/library/catalog.ts`. Keep the catalog focused on discovery, compatibility and metadata.

These are extension rules, not a claim that every existing mesh is already a separate model. Extract components when they need independent reuse. The inspection view exposes compatible actions for the selected model, with one active at a time; simultaneous animation composition belongs in sequence code until the UI explicitly supports it.

See [MODEL-GUIDE.md](MODEL-GUIDE.md) for coordinates and attachment points, [LIBRARY.md](LIBRARY.md) for registration, and [SHOWCASE.md](SHOWCASE.md) for the current presentation.
