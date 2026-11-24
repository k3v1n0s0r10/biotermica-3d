# Blender product library

`blender/catalog.json` is shared by native publishing and the preview website.
It preserves the four original IDs: `heat-pump-v1`, `heat-pump-coil-v1`,
`compressor-v1`, and `titanium-heat-exchanger-v1`.

Each entry identifies a named native object hierarchy (`root`) and provides its
Spanish name, category, description, and whether a film is available (`video`).
Currently only the heat pump has a film. All products have an isolated PNG and
model-only GLB; the complete master `.blend` is downloadable separately.

To add a component, author a named hierarchy in the native scene, add a catalog
entry with a unique ID/root, run native validation and publishing, then run web
validation. Publishing selects only the component subtree, omits lights/cameras,
and renders a component still with framing calculated from its world bounds.
New films require a render/encode recipe before setting `video` to true; the
current film recipe is specific to the full heat pump.

URLs use `?product=<id>&view=image|video|model`. Invalid IDs fall back to the heat
pump; a video request for a component falls back to its still. Browser Back and
Forward restore selection. Old `?model=<id>` links still select the component.
