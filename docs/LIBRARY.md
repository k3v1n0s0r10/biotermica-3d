# Product library

Open **Biblioteca** in the top navigation. The menu separates:

- **Modelos**: physical product assemblies to inspect.
- **Presentaciones**: complete presentations, each tied to one model and its camera/lighting sequence.

Search filters the active collection. Opening a model enters a still inspection view with contextual action buttons below the viewport. Only compatible actions appear: for example, **Mostrar interior** for the titanium exchanger and **Activar ventilador** for the heat pump. Click an active action again to restore the resting model. Opening a showcase plays its film; its composed animation remains owned by the presentation. Reduced-motion users remain paused for continuous actions; held inspection poses are applied immediately. Opening the menu pauses playback; close it and press Reproducir to continue.

The active model and experience appear beside the Biblioteca button. URL parameters (`mode`, `model`, `animation`, `showcase`) preserve selection when reloading or copying a local preview link. Invalid model or showcase IDs fall back to valid entries; missing or incompatible animation IDs leave the model at rest. The library does not upload, create or edit assets; new entries are registered in code.

## Add content

Follow [ARCHITECTURE.md](ARCHITECTURE.md): models and animations are composable building blocks; showcases assemble them into complete presentations. A model may support multiple animations, and nested component models need not be registered separately.

Edit `src/library/catalog.ts`. The menus and counts derive from these arrays; do not add menu buttons manually.

### Model

Add a `ModelEntry` with a stable ID, display name, description, version, synchronous `create()` factory, initial camera position and look target. The factory must return a new exclusively owned `Group` on each call. Follow MODEL-GUIDE.md for units and component conventions. Add compatible animations using `modelIds`; models without animations remain inspectable with playback disabled. Async GLB loading will require awaiting the factory in the selection lifecycle before enabling playback.

### Animation

Add an `AnimationEntry` with a stable ID, an action-oriented button name, description, compatible `modelIds`, and a factory returning `{ duration, sample(seconds) }`. These entries appear as contextual model actions, not library cards. Set `holdAt` to an absolute sample time for a persistent inspection pose; omit it for a playable motion. Held poses hide playback controls. Only one inspection action is active at a time; reset clears it. Sample absolute time and reset all animated properties deterministically. Include required named nodes in the model contract. No model-specific assumptions belong in the library UI. `fan-study`, for example, requires the `fan-rotor` node; the turntable acts on the product root.

### Showcase

Implement each presentation in its own `src/showcases/<subject>.ts` file and import its factory into the catalog. Reuse animation factories from `src/animations/` instead of duplicating their motion code.

Add a `ShowcaseEntry` with its owning `modelId`, chapter captions, edition, duration, and camera/stage sequence factory. The factory returns `{ duration, sample(seconds) }`; sampling returns the chapter index used for the overlay. Metadata durations should agree with actual sequences. The shared studio is currently the stage contract; introduce explicit stage factories when showcases need genuinely different environments.

## Selection lifecycle

`resolveSelection()` resolves URL/menu selections and compatibility. `main.ts` pauses playback, disposes the old viewer, creates a fresh product/viewer, updates the UI and URL, and starts playback when appropriate. This avoids accumulated object transforms, duplicate loops, and stale GPU resources when changing selections. `core/viewer.ts` receives factories through options rather than importing a hard-coded product or sequence.

The catalog currently bundles factories eagerly. As the library grows, migrate factory imports to dynamic imports and add loading/error states and cancellation for asynchronous selection. Keep the stable IDs and user-facing menu structure.

Validate with `bun run build`, `bun test`, and browser checks for model → contextual action → showcase switching, search, keyboard dismissal, timeline reset, and reloadable links.
